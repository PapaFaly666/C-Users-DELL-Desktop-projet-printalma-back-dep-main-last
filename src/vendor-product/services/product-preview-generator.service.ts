import { Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';
import axios from 'axios';
import {
  calculateCompletePositioning,
  validateDesignTransform,
  convertDelimitationToPixels,
  type DesignTransform,
  type Delimitation as BBoxDelimitation,
} from '../utils/bounding-box-calculator';

interface Delimitation {
  x: number;
  y: number;
  width: number;
  height: number;
  coordinateType: 'PERCENTAGE' | 'PIXEL';
}

/**
 * 🎯 Interface de position du design (nouveau format unifié)
 */
interface DesignPosition {
  x: number;              // Offset X depuis le centre de la délimitation (en pixels)
  y: number;              // Offset Y depuis le centre de la délimitation (en pixels)

  // Support des deux formats (rétro-compatibilité)
  designScale?: number;   // ✅ NOUVEAU: Échelle du design (0.8 = 80% de la délimitation)
  scale?: number;         // 🔄 ANCIEN: Échelle du design (rétro-compatibilité)

  rotation?: number;      // Rotation en degrés (0-360)
  designWidth?: number;   // ❌ OBSOLÈTE: Le backend calcule avec fit: 'inside'
  designHeight?: number;  // ❌ OBSOLÈTE: Le backend calcule avec fit: 'inside'
  positionUnit?: 'PIXEL' | 'PERCENTAGE'; // Toujours PIXEL (logique unifiée)

  // 🎯 LOGIQUE UNIFIÉE - Dimensions ESSENTIELLES envoyées par le frontend
  delimitationWidth?: number;   // ✅ ESSENTIEL: Largeur de la délimitation en pixels
  delimitationHeight?: number;  // ✅ ESSENTIEL: Hauteur de la délimitation en pixels

  // ❌ OBSOLÈTE: Le backend recalcule containerWidth/containerHeight
  // containerWidth?: number;
  // containerHeight?: number;
}

interface ProductPreviewConfig {
  productImageUrl: string;    // Image du produit (t-shirt, mug, etc.)
  designImageUrl: string;      // Image du design
  delimitation: Delimitation;  // Zone imprimable (OBLIGATOIRE)
  position: DesignPosition;    // Position du design dans la délimitation
  showDelimitation?: boolean;  // ⚠️ DEBUG: Afficher un contour rouge autour de la délimitation
  isSticker?: boolean;         // 🎨 Si true, applique une bordure blanche au design (style autocollant)
}

@Injectable()
export class ProductPreviewGeneratorService {
  private readonly logger = new Logger(ProductPreviewGeneratorService.name);

  /**
   * Cache de téléchargements : stocke les Promises en cours ou terminées.
   * Si deux couleurs demandent le même design en parallèle, elles attendent
   * la MÊME Promise → téléchargement unique, zéro travail dupliqué.
   * Expiration automatique après 10 minutes.
   */
  private readonly downloadCache = new Map<string, Promise<Buffer>>();

  /**
   * Optimise une URL Cloudinary pour limiter la taille téléchargée.
   * Réduit la consommation mémoire de Sharp ~4x sans perte de qualité visible.
   * ex: image 3000x3000px → 1500x1500px = 4x moins de RAM utilisée par Sharp
   */
  private optimizeCloudinaryUrl(url: string, maxWidth = 1500): string {
    if (!url || !url.includes('res.cloudinary.com') || url.includes('.svg')) {
      return url; // SVG gardé tel quel (Sharp le gère via density)
    }
    const uploadIndex = url.indexOf('/upload/');
    if (uploadIndex === -1) return url;

    const afterUpload = url.substring(uploadIndex + 8);
    // Ne pas ré-appliquer si des transformations existent déjà
    if (/^[a-z]_/.test(afterUpload)) return url;

    // c_limit : redimensionne seulement si l'image dépasse maxWidth
    // q_auto  : qualité automatique Cloudinary
    // f_png   : forcer PNG pour préserver la transparence
    return `${url.substring(0, uploadIndex + 8)}w_${maxWidth},c_limit,q_auto,f_png/${afterUpload}`;
  }

  /**
   * Télécharge une image avec déduplication : si le même URL est demandé
   * plusieurs fois en parallèle (ex: design partagé entre toutes les couleurs),
   * un seul téléchargement est effectué et le résultat est partagé.
   */
  private downloadImageCached(url: string, maxWidth?: number): Promise<Buffer> {
    const cacheKey = maxWidth ? this.optimizeCloudinaryUrl(url, maxWidth) : url;

    if (!this.downloadCache.has(cacheKey)) {
      const optimizedUrl = cacheKey !== url ? cacheKey : this.optimizeCloudinaryUrl(url, maxWidth ?? 1500);
      this.logger.log(`📥 [CACHE MISS] Téléchargement: ${optimizedUrl.split('/').pop()}`);

      const promise = this.downloadImage(optimizedUrl).then(buffer => {
        this.logger.log(`✅ [CACHE STORE] ${optimizedUrl.split('/').pop()} (${Math.round(buffer.length / 1024)}KB)`);
        return buffer;
      });

      this.downloadCache.set(cacheKey, promise);

      // Expiration automatique après 10 minutes pour libérer la mémoire
      promise.finally(() => {
        setTimeout(() => {
          this.downloadCache.delete(cacheKey);
          this.logger.log(`🗑️ [CACHE EXPIRE] ${cacheKey.split('/').pop()}`);
        }, 10 * 60 * 1000);
      });
    } else {
      this.logger.log(`⚡ [CACHE HIT] Réutilisation: ${cacheKey.split('/').pop()} (0 téléchargement)`);
    }

    return this.downloadCache.get(cacheKey)!;
  }

  /**
   * Télécharger une image depuis une URL
   * Les SVG sont téléchargés bruts et seront convertis par Sharp
   */
  private async downloadImage(url: string): Promise<Buffer> {
    try {
      this.logger.log(`📥 Téléchargement de l'image: ${url}`);
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 120000, // 2 minutes - timeout augmenté pour les connexions lentes
      });

      this.logger.log(`✅ Téléchargement réussi - Status: ${response.status}, Taille: ${response.data.byteLength} bytes`);

      const buffer = Buffer.from(response.data);

      // Si c'est un SVG, le convertir immédiatement en PNG avec Sharp
      if (url.includes('.svg')) {
        this.logger.log(`🔄 Conversion SVG → PNG avec Sharp (taille SVG: ${buffer.length} bytes)`);
        try {
          // Sharp peut lire les SVG et les convertir en PNG
          // Définir une taille raisonnable pour le SVG (2000px max)
          // Augmenter la limite de densité pour les SVG complexes
          const pngBuffer = await sharp(buffer, {
            density: 300,  // DPI pour la conversion SVG → PNG
            limitInputPixels: false  // Pas de limite pour les grands SVG
          })
            .resize(2000, 2000, {
              fit: 'inside',
              withoutEnlargement: false,
              background: { r: 0, g: 0, b: 0, alpha: 0 }
            })
            .png({
              quality: 90,
              compressionLevel: 6,
              effort: 5
            })
            .toBuffer();
          this.logger.log(`✅ SVG converti en PNG (${pngBuffer.length} bytes)`);
          return pngBuffer;
        } catch (svgError) {
          this.logger.error(`❌ Erreur conversion SVG:`, {
            message: svgError.message,
            stack: svgError.stack,
            bufferLength: buffer.length,
            bufferStart: buffer.slice(0, 200).toString('utf-8').substring(0, 200)
          });
          throw new Error(`Impossible de convertir le SVG: ${svgError.message}`);
        }
      }

      return buffer;
    } catch (error) {
      this.logger.error(`❌ Erreur téléchargement image DÉTAILS:`, {
        url,
        message: error.message,
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        stack: error.stack
      });
      throw new Error(`Impossible de télécharger l'image: ${error.message || error.code || 'Erreur inconnue'}`);
    }
  }

  /**
   * Obtenir les dimensions d'un buffer
   */
  private async getDimensions(buffer: Buffer): Promise<{ width: number; height: number }> {
    const metadata = await sharp(buffer).metadata();
    return {
      width: metadata.width || 0,
      height: metadata.height || 0
    };
  }

  /**
   * Ajouter un contour blanc au design (effet autocollant) - SUIT LES CONTOURS
   *
   * Cette méthode crée une bordure blanche qui suit la forme du design
   * en utilisant une dilatation du canal alpha avec Sharp + SVG.
   *
   * @param imageBuffer - Buffer de l'image du design
   * @param strokeWidth - Épaisseur du contour en pixels
   * @returns Buffer de l'image avec contour blanc suivant la forme
   */
  private async addWhiteStrokeToDesign(
    imageBuffer: Buffer,
    strokeWidth: number = 80
  ): Promise<Buffer> {
    const dims = await this.getDimensions(imageBuffer);

    this.logger.log(`🎨🎨🎨 ===== DÉBUT AJOUT BORDURE BLANCHE AUTOCOLLANT ===== 🎨🎨🎨`);
    this.logger.log(`✏️ Contour blanc autocollant suivant les contours (${strokeWidth}px)`);
    this.logger.log(`📐 Dimensions design original: ${dims.width}x${dims.height}px`);

    try {
      const newWidth = dims.width + (strokeWidth * 2);
      const newHeight = dims.height + (strokeWidth * 2);

      this.logger.log(`📏 Dimensions finales avec bordure: ${newWidth}x${newHeight}px`);

      // STRATÉGIE: Utiliser SVG avec feMorphology pour dilater l'alpha
      // Cette approche suit parfaitement les contours du design
      const svgFilter = `
        <svg width="${newWidth}" height="${newHeight}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="white-border" x="-50%" y="-50%" width="200%" height="200%">
              <!-- Extraire le canal alpha (la forme du design) -->
              <feColorMatrix in="SourceAlpha" type="matrix"
                values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="alpha"/>

              <!-- Dilater pour créer la bordure -->
              <feMorphology operator="dilate" radius="${strokeWidth}" in="alpha" result="expanded"/>

              <!-- Remplir avec du blanc -->
              <feFlood flood-color="white" result="white"/>
              <feComposite in="white" in2="expanded" operator="in" result="whiteBorder"/>

              <!-- Superposer le design original sur la bordure blanche -->
              <feMerge>
                <feMergeNode in="whiteBorder"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          <!-- Appliquer le filtre au design -->
          <image x="${strokeWidth}" y="${strokeWidth}"
                 width="${dims.width}" height="${dims.height}"
                 href="data:image/png;base64,${imageBuffer.toString('base64')}"
                 filter="url(#white-border)"/>
        </svg>
      `;

      this.logger.log(`🔄 Application filtre SVG avec feMorphology...`);

      // Convertir le SVG en PNG
      const withBorder = await sharp(Buffer.from(svgFilter), {
        density: 150
      })
      .png({
        quality: 90,
        compressionLevel: 6
      })
      .toBuffer();

      const finalDims = await this.getDimensions(withBorder);
      const sizeBefore = Math.round(imageBuffer.length / 1024);
      const sizeAfter = Math.round(withBorder.length / 1024);

      this.logger.log(`✅ Bordure blanche suivant les contours appliquée!`);
      this.logger.log(`📊 ${dims.width}x${dims.height}px → ${finalDims.width}x${finalDims.height}px`);
      this.logger.log(`📦 Taille: ${sizeBefore}KB → ${sizeAfter}KB`);
      this.logger.log(`🎨🎨🎨 ===== FIN BORDURE AUTOCOLLANT ===== 🎨🎨🎨`);

      return withBorder;
    } catch (error) {
      this.logger.error(`❌ Erreur ajout bordure autocollant: ${error.message}`);
      this.logger.error(`Stack trace:`, error.stack);

      // FALLBACK: Bordure rectangulaire simple si le filtre SVG échoue
      this.logger.warn(`⚠️ Utilisation fallback: bordure rectangulaire simple`);
      try {
        const newWidth = dims.width + (strokeWidth * 2);
        const newHeight = dims.height + (strokeWidth * 2);

        return await sharp({
          create: {
            width: newWidth,
            height: newHeight,
            channels: 4,
            background: { r: 255, g: 255, b: 255, alpha: 1 }
          }
        })
        .composite([{
          input: imageBuffer,
          left: strokeWidth,
          top: strokeWidth
        }])
        .png()
        .toBuffer();
      } catch (fallbackError) {
        this.logger.error(`❌ Même le fallback a échoué: ${fallbackError.message}`);
        return imageBuffer;
      }
    }
  }

  /**
   * ⚠️ DEBUG : Dessiner un contour rouge autour de la délimitation
   * Permet de vérifier visuellement que la zone d'impression est bien respectée
   */
  private async drawDelimitationRect(
    imageBuffer: Buffer,
    delimInPixels: { x: number; y: number; width: number; height: number }
  ): Promise<Buffer> {
    const metadata = await sharp(imageBuffer).metadata();
    const width = metadata.width || 0;
    const height = metadata.height || 0;

    this.logger.log(`🔴 DEBUG: Tracé délimitation sur l'image ${width}x${height}px`);
    this.logger.log(`🔴 Rectangle: x=${Math.round(delimInPixels.x)}, y=${Math.round(delimInPixels.y)}, ` +
      `w=${Math.round(delimInPixels.width)}, h=${Math.round(delimInPixels.height)}`);

    // Créer un calque SVG avec le rectangle rouge
    const borderWidth = 4;
    const svg = `
      <svg width="${width}" height="${height}">
        <rect
          x="${Math.round(delimInPixels.x)}"
          y="${Math.round(delimInPixels.y)}"
          width="${Math.round(delimInPixels.width)}"
          height="${Math.round(delimInPixels.height)}"
          fill="none"
          stroke="#FF0000"
          stroke-width="${borderWidth}"
          stroke-dasharray="10,5"
        />
        <!-- Marqueurs aux coins pour visualiser les limites -->
        <line x1="${Math.round(delimInPixels.x) - 10}" y1="${Math.round(delimInPixels.y)}" x2="${Math.round(delimInPixels.x) + 10}" y2="${Math.round(delimInPixels.y)}" stroke="#FF0000" stroke-width="${borderWidth}" />
        <line x1="${Math.round(delimInPixels.x)}" y1="${Math.round(delimInPixels.y) - 10}" x2="${Math.round(delimInPixels.x)}" y2="${Math.round(delimInPixels.y) + 10}" stroke="#FF0000" stroke-width="${borderWidth}" />

        <line x1="${Math.round(delimInPixels.x + delimInPixels.width) - 10}" y1="${Math.round(delimInPixels.y)}" x2="${Math.round(delimInPixels.x + delimInPixels.width) + 10}" y2="${Math.round(delimInPixels.y)}" stroke="#FF0000" stroke-width="${borderWidth}" />
        <line x1="${Math.round(delimInPixels.x + delimInPixels.width)}" y1="${Math.round(delimInPixels.y) - 10}" x2="${Math.round(delimInPixels.x + delimInPixels.width)}" y2="${Math.round(delimInPixels.y) + 10}" stroke="#FF0000" stroke-width="${borderWidth}" />

        <line x1="${Math.round(delimInPixels.x)}" y1="${Math.round(delimInPixels.y + delimInPixels.height) - 10}" x2="${Math.round(delimInPixels.x)}" y2="${Math.round(delimInPixels.y + delimInPixels.height) + 10}" stroke="#FF0000" stroke-width="${borderWidth}" />
        <line x1="${Math.round(delimInPixels.x) - 10}" y1="${Math.round(delimInPixels.y + delimInPixels.height)}" x2="${Math.round(delimInPixels.x) + 10}" y2="${Math.round(delimInPixels.y + delimInPixels.height)}" stroke="#FF0000" stroke-width="${borderWidth}" />

        <line x1="${Math.round(delimInPixels.x + delimInPixels.width)}" y1="${Math.round(delimInPixels.y + delimInPixels.height) - 10}" x2="${Math.round(delimInPixels.x + delimInPixels.width)}" y2="${Math.round(delimInPixels.y + delimInPixels.height) + 10}" stroke="#FF0000" stroke-width="${borderWidth}" />
        <line x1="${Math.round(delimInPixels.x + delimInPixels.width) - 10}" y1="${Math.round(delimInPixels.y + delimInPixels.height)}" x2="${Math.round(delimInPixels.x + delimInPixels.width) + 10}" y2="${Math.round(delimInPixels.y + delimInPixels.height)}" stroke="#FF0000" stroke-width="${borderWidth}" />
      </svg>
    `;

    const svgBuffer = Buffer.from(svg);

    // Composer l'image avec le rectangle
    return await sharp(imageBuffer)
      .composite([
        {
          input: svgBuffer,
          left: 0,
          top: 0,
          blend: 'over',
        }
      ])
      .png()
      .toBuffer();
  }

  /**
   * Convertir une délimitation en pixels
   * Utilise l'utilitaire centralisé avec gestion des cas legacy
   */
  private convertDelimitationToPixelsLegacy(
    delim: any,
    imageWidth: number,
    imageHeight: number
  ): { x: number; y: number; width: number; height: number } {
    // Si c'est en PIXEL, utiliser directement les valeurs
    if (delim.coordinateType === 'PIXEL') {
      return {
        x: delim.x,
        y: delim.y,
        width: delim.width,
        height: delim.height
      };
    }

    // Si marqué comme PERCENTAGE mais valeurs > 100, ce sont probablement des pixels absolus
    // enregistrés sur une image de référence
    if (delim.coordinateType === 'PERCENTAGE' && (delim.x > 100 || delim.y > 100 || delim.width > 100 || delim.height > 100)) {
      this.logger.warn(`⚠️ Délimitation marquée PERCENTAGE mais avec valeurs > 100, traitement comme pixels absolus`);

      // Si on a originalImageWidth/Height, on peut calculer le vrai pourcentage
      if (delim.originalImageWidth && delim.originalImageHeight) {
        const percentX = (delim.x / delim.originalImageWidth) * 100;
        const percentY = (delim.y / delim.originalImageHeight) * 100;
        const percentWidth = (delim.width / delim.originalImageWidth) * 100;
        const percentHeight = (delim.height / delim.originalImageHeight) * 100;

        this.logger.log(`📐 Conversion: ${delim.x}px → ${percentX.toFixed(2)}%`);

        return {
          x: (percentX / 100) * imageWidth,
          y: (percentY / 100) * imageHeight,
          width: (percentWidth / 100) * imageWidth,
          height: (percentHeight / 100) * imageHeight
        };
      }

      // Sinon, traiter directement comme des pixels
      return {
        x: delim.x,
        y: delim.y,
        width: delim.width,
        height: delim.height
      };
    }

    // Conversion pourcentage → pixels (cas normal, valeurs entre 0-100)
    return {
      x: (delim.x / 100) * imageWidth,
      y: (delim.y / 100) * imageHeight,
      width: (delim.width / 100) * imageWidth,
      height: (delim.height / 100) * imageHeight
    };
  }

  /**
   * 🎯 LOGIQUE UNIFIÉE FRONTEND ↔ BACKEND
   *
   * Le frontend et le backend utilisent la MÊME logique pour calculer les dimensions et la position.
   *
   * ### Étape 1: Calculer les Dimensions du Conteneur
   * Utiliser les dimensions de la délimitation envoyées par le frontend
   * const containerWidth = delimitationWidth × scale
   * const containerHeight = delimitationHeight × scale
   *
   * ### Étape 2: Calculer les Contraintes de Position
   * const maxX = (delimitationWidth - containerWidth) / 2
   * const minX = -(delimitationWidth - containerWidth) / 2
   * const maxY = (delimitationHeight - containerHeight) / 2
   * const minY = -(delimitationHeight - containerHeight) / 2
   *
   * ### Étape 3: Calculer la Position Finale
   * const delimCenterX = delimitation.x + (delimitationWidth / 2)
   * const delimCenterY = delimitation.y + (delimitationHeight / 2)
   * const containerCenterX = delimCenterX + x
   * const containerCenterY = delimCenterY + y
   *
   * ### Étape 4: Redimensionner le Design avec fit: 'inside'
   * ✅ CRITIQUE: fit: 'inside' équivaut à CSS object-fit: contain
   *
   * ### Étape 5: Centrer le Design dans le Conteneur
   * Le design peut être plus petit que le conteneur (à cause de fit: 'inside')
   */


  /**
   * 🎯 Génération de Preview avec Logique Unifiée Frontend ↔ Backend
   *
   * Cette méthode utilise l'algorithme exact de la documentation BOUNDING_BOX_IMPLEMENTATION.md
   * via l'utilitaire centralisé bounding-box-calculator.
   *
   * @param config - Configuration de génération de preview
   * @returns Buffer de l'image PNG générée
   */
  // ============================================================
  // COEUR DU TRAITEMENT : étapes 1-5 partagées entre Buffer et Stream
  // ============================================================

  /**
   * Prépare tous les éléments nécessaires à la composition finale.
   * Étapes 1-5 : download → positioning → resize → sticker border → rotation
   *
   * MÉMOIRE :
   * - Mockup téléchargé SANS cache (différent par couleur, jamais réutilisé)
   * - Design téléchargé AVEC cache (identique pour toutes les couleurs)
   * - Buffers intermédiaires nullifiés dès qu'ils ne sont plus nécessaires
   */
  private async _prepareComposite(config: ProductPreviewConfig): Promise<{
    productBuffer: Buffer;
    processedDesign: Buffer;
    finalLeft: number;
    finalTop: number;
    delimInPixels: { x: number; y: number; width: number; height: number };
  }> {
    const { productImageUrl, designImageUrl, delimitation, position } = config;

    const designScale = position.designScale ?? position.scale ?? 0.8;
    const delimitationWidth = position.delimitationWidth ?? delimitation.width;
    const delimitationHeight = position.delimitationHeight ?? delimitation.height;

    const transform: DesignTransform = {
      x: position.x || 0,
      y: position.y || 0,
      designScale,
      rotation: position.rotation || 0,
      positionUnit: 'PIXEL',
      delimitationWidth,
      delimitationHeight,
    };

    validateDesignTransform(transform);

    // ── Étape 1 : Téléchargement ──────────────────────────────────────────────
    // Mockup : PAS de cache (différent par couleur → libéré après chaque génération)
    // Design : cache 10min (identique pour toutes les couleurs du même produit)
    const [productBuffer, designBuffer] = await Promise.all([
      this.downloadImage(this.optimizeCloudinaryUrl(productImageUrl, 1200)),
      this.downloadImageCached(designImageUrl, 1200),
    ]);

    const productMetadata = await sharp(productBuffer).metadata();
    const imageWidth = productMetadata.width || 1200;
    const imageHeight = productMetadata.height || 1200;

    this.logger.log(`✅ Mockup: ${imageWidth}x${imageHeight}px | Design en cache`);

    // ── Étape 2 : Positionnement ──────────────────────────────────────────────
    const positioning = calculateCompletePositioning(
      delimitation as BBoxDelimitation,
      transform,
      imageWidth,
      imageHeight
    );
    const { boundingBox, delimInPixels, centerContainer } = positioning;

    // ── Étape 3 : Redimensionnement du design ─────────────────────────────────
    const BORDER_RATIO = 0.08;
    let targetWidth = boundingBox.width;
    let targetHeight = boundingBox.height;

    if (config.isSticker) {
      const reductionFactor = 1 - (BORDER_RATIO * 2);
      targetWidth = Math.round(boundingBox.width * reductionFactor);
      targetHeight = Math.round(boundingBox.height * reductionFactor);
    }

    let resizedDesign: Buffer | null = await sharp(designBuffer)
      .resize({ width: targetWidth, height: targetHeight, fit: 'inside',
                withoutEnlargement: false, background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 1 }) // compressionLevel bas pour les buffers intermédiaires
      .toBuffer();

    let actualMetadata = await sharp(resizedDesign).metadata();
    let actualDesignWidth = actualMetadata.width || 0;
    let actualDesignHeight = actualMetadata.height || 0;

    // ── Étape 3.5 : Bordure blanche (stickers) ────────────────────────────────
    if (config.isSticker) {
      const avgDimension = (actualDesignWidth + actualDesignHeight) / 2;
      const borderWidth = Math.max(Math.round(avgDimension * BORDER_RATIO), 12);
      resizedDesign = await this.addWhiteStrokeToDesign(resizedDesign, borderWidth);
      actualMetadata = await sharp(resizedDesign).metadata();
      actualDesignWidth = actualMetadata.width || 0;
      actualDesignHeight = actualMetadata.height || 0;
    }

    // ── Étape 4 : Centrage dans le conteneur ──────────────────────────────────
    const containerWidth = config.isSticker
      ? Math.min(Math.max(boundingBox.width, actualDesignWidth), imageWidth)
      : boundingBox.width;
    const containerHeight = config.isSticker
      ? Math.min(Math.max(boundingBox.height, actualDesignHeight), imageHeight)
      : boundingBox.height;

    if (actualDesignWidth > containerWidth || actualDesignHeight > containerHeight) {
      const scaleFactor = Math.min(containerWidth / actualDesignWidth, containerHeight / actualDesignHeight);
      resizedDesign = await sharp(resizedDesign)
        .resize(Math.round(actualDesignWidth * scaleFactor), Math.round(actualDesignHeight * scaleFactor),
                { fit: 'inside', withoutEnlargement: false })
        .png({ compressionLevel: 1 })
        .toBuffer();
      actualMetadata = await sharp(resizedDesign).metadata();
      actualDesignWidth = actualMetadata.width || 0;
      actualDesignHeight = actualMetadata.height || 0;
    }

    const designOffsetX = Math.max(0, Math.round((containerWidth - actualDesignWidth) / 2));
    const designOffsetY = Math.max(0, Math.round((containerHeight - actualDesignHeight) / 2));

    let designInContainer: Buffer | null = await sharp({
      create: { width: containerWidth, height: containerHeight, channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 0 } }
    })
    .composite([{ input: resizedDesign, left: designOffsetX, top: designOffsetY }])
    .png({ compressionLevel: 1 })
    .toBuffer();

    // Libérer resizedDesign — plus nécessaire
    resizedDesign = null;

    // ── Étape 5 : Rotation ───────────────────────────────────────────────────
    const containerMeta = await sharp(designInContainer).metadata();
    let finalLeft = centerContainer.x - ((containerMeta.width || containerWidth) / 2);
    let finalTop  = centerContainer.y - ((containerMeta.height || containerHeight) / 2);

    let processedDesign: Buffer;

    if (transform.rotation !== 0) {
      const rotated = await sharp(designInContainer)
        .rotate(transform.rotation, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png({ compressionLevel: 1 })
        .toBuffer();
      const rotatedMeta = await sharp(rotated).metadata();
      finalLeft = centerContainer.x - ((rotatedMeta.width || 0) / 2);
      finalTop  = centerContainer.y - ((rotatedMeta.height || 0) / 2);
      processedDesign = rotated;
      designInContainer = null; // Libérer le buffer non-rotaté
    } else {
      processedDesign = designInContainer;
      designInContainer = null;
    }

    this.logger.log(`✅ Composite prêt: design ${actualDesignWidth}x${actualDesignHeight}px @ (${Math.round(finalLeft)}, ${Math.round(finalTop)})`);

    return { productBuffer, processedDesign, finalLeft, finalTop, delimInPixels };
  }

  // ============================================================
  // CHEMIN BUFFER — utilisé pour le debug (showDelimitation)
  // ============================================================

  async generateProductPreview(config: ProductPreviewConfig): Promise<Buffer> {
    try {
      this.logger.log(`🎨 === GÉNÉRATION IMAGE (buffer) ===`);
      const { productBuffer, processedDesign, finalLeft, finalTop, delimInPixels } =
        await this._prepareComposite(config);

      let finalImage = await sharp(productBuffer)
        .composite([{ input: processedDesign, left: Math.round(finalLeft), top: Math.round(finalTop), blend: 'over' }])
        .png({ quality: 85, compressionLevel: 6, effort: 5 })
        .toBuffer();

      if (config.showDelimitation) {
        finalImage = await this.drawDelimitationRect(finalImage, delimInPixels);
      }

      const dims = await this.getDimensions(finalImage);
      this.logger.log(`✅ Image finale: ${dims.width}x${dims.height}px (${Math.round(finalImage.length / 1024)}KB)`);
      return finalImage;
    } catch (error) {
      this.logger.error(`❌ Erreur génération preview: ${error.message}`, error.stack);
      throw new Error(`Échec de la génération de la preview: ${error.message}`);
    }
  }

  // ============================================================
  // CHEMIN STREAM — utilisé par la queue de production
  // Retourne un pipeline Sharp qui sera pipé directement vers Cloudinary.
  // Le buffer final (~9MB) n'est JAMAIS matérialisé en mémoire.
  // Sortie JPEG : 3× plus rapide que PNG, 5× plus petit.
  // ============================================================

  async generateProductPreviewStream(config: ProductPreviewConfig): Promise<import('sharp').Sharp> {
    this.logger.log(`🎨 === GÉNÉRATION IMAGE (stream) ===`);
    const { productBuffer, processedDesign, finalLeft, finalTop } =
      await this._prepareComposite(config);

    // Retourne le pipeline Sharp — pas de .toBuffer()
    // Le caller pipe ce pipeline directement vers Cloudinary upload_stream
    return sharp(productBuffer)
      .composite([{ input: processedDesign, left: Math.round(finalLeft), top: Math.round(finalTop), blend: 'over' }])
      .jpeg({ quality: 88, progressive: true, mozjpeg: false });
  }

  // ============================================================
  // WRAPPERS PUBLICS
  // ============================================================

  async generatePreviewFromJson(
    productImageUrl: string,
    designImageUrl: string,
    delimitation: Delimitation,
    positionJson: any,
    showDelimitation = false,
    isSticker = false
  ): Promise<Buffer> {
    const position = typeof positionJson === 'string' ? JSON.parse(positionJson) : positionJson;
    return this.generateProductPreview({
      productImageUrl, designImageUrl, delimitation,
      position: {
        x: position.x || 0, y: position.y || 0,
        scale: position.scale || 0.8, rotation: position.rotation || 0,
        positionUnit: position.positionUnit || 'PIXEL',
        delimitationWidth: position.delimitationWidth ?? delimitation.width,
        delimitationHeight: position.delimitationHeight ?? delimitation.height,
      },
      showDelimitation, isSticker
    });
  }

  async generatePreviewStreamFromJson(
    productImageUrl: string,
    designImageUrl: string,
    delimitation: Delimitation,
    positionJson: any,
    isSticker = false
  ): Promise<import('sharp').Sharp> {
    const position = typeof positionJson === 'string' ? JSON.parse(positionJson) : positionJson;
    return this.generateProductPreviewStream({
      productImageUrl, designImageUrl, delimitation,
      position: {
        x: position.x || 0, y: position.y || 0,
        scale: position.scale || 0.8, rotation: position.rotation || 0,
        positionUnit: position.positionUnit || 'PIXEL',
        delimitationWidth: position.delimitationWidth ?? delimitation.width,
        delimitationHeight: position.delimitationHeight ?? delimitation.height,
      },
      showDelimitation: false, isSticker
    });
  }
}
