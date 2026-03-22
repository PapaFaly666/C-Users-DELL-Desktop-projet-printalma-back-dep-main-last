import { Injectable, Logger } from '@nestjs/common';
import { CloudinaryService } from '../../core/cloudinary/cloudinary.service';
import { PrismaService } from '../../prisma.service';
import sharp from 'sharp';
import axios from 'axios';
import * as opentype from 'opentype.js';

/**
 * Interface pour un élément de design (texte, image, forme)
 */
interface DesignElement {
  id: string;
  type: 'text' | 'image' | 'shape';

  // Pour les textes
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  fontWeight?: string | number;
  textAlign?: 'left' | 'center' | 'right';

  // Pour les images
  imageUrl?: string;

  // Position et dimensions (en pixels)
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  zIndex: number;

  // Opacité
  opacity?: number;
}

/**
 * Configuration pour générer un mockup de commande
 */
interface GenerateMockupConfig {
  productImageUrl: string;  // Image du produit de base (t-shirt, mug, etc.)
  elements: DesignElement[];  // Tous les éléments de personnalisation
  delimitation?: {  // Zone imprimable (optionnel)
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * Service pour générer automatiquement les images finales (mockups)
 * des commandes personnalisées avec tous les éléments de design appliqués
 */
@Injectable()
export class OrderMockupGeneratorService {
  private readonly logger = new Logger(OrderMockupGeneratorService.name);

  /** Cache: primaryFontName → opentype.Font (chargé en mémoire) */
  private readonly fontObjCache = new Map<string, opentype.Font | null>();

  constructor(
    private readonly cloudinaryService: CloudinaryService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Charge une police en mémoire via opentype.js.
   * Récupère l'URL réelle depuis la DB (googleFontUrl de l'admin), télécharge le TTF,
   * et retourne l'objet Font d'opentype.js pour conversion texte → paths.
   */
  private async loadFont(fontFamily: string): Promise<opentype.Font | null> {
    const primaryFont = fontFamily.replace(/['"]/g, '').split(',')[0].trim();

    if (!primaryFont) return null;

    if (this.fontObjCache.has(primaryFont)) {
      return this.fontObjCache.get(primaryFont);
    }

    this.logger.log(`🔤 [Font] Chargement: "${primaryFont}"`);

    // Essayer dans l'ordre : URL construite depuis le nom → URL stockée en DB
    const ttfBuffer = await this.fetchFontBuffer(primaryFont);

    if (!ttfBuffer) {
      this.logger.warn(`⚠️ [Font] Police introuvable: "${primaryFont}" → fallback police système`);
      this.fontObjCache.set(primaryFont, null);
      return null;
    }

    try {
      const arrayBuffer = ttfBuffer.buffer.slice(
        ttfBuffer.byteOffset,
        ttfBuffer.byteOffset + ttfBuffer.byteLength,
      ) as ArrayBuffer;

      const font = opentype.parse(arrayBuffer);
      this.fontObjCache.set(primaryFont, font);
      this.logger.log(`✅ [Font] "${primaryFont}" chargée`);
      return font;
    } catch (e) {
      this.logger.warn(`⚠️ [Font] opentype.parse échoué pour "${primaryFont}": ${e.message}`);
      this.fontObjCache.set(primaryFont, null);
      return null;
    }
  }

  /**
   * Récupère le buffer TTF/OTF d'une police.
   * Stratégie 1 : construire l'URL Google Fonts depuis le nom (sans passer par la DB).
   * Stratégie 2 : utiliser l'URL stockée en DB si la stratégie 1 échoue.
   */
  private async fetchFontBuffer(primaryFont: string): Promise<Buffer | null> {
    // ── Stratégie 1 : URL construite depuis le nom ──
    const encodedName = primaryFont.replace(/ /g, '+');
    const googleUrl = `https://fonts.googleapis.com/css2?family=${encodedName}&display=swap`;

    const buf = await this.downloadFontFromCssUrl(googleUrl, primaryFont);
    if (buf) return buf;

    // ── Stratégie 2 : URL stockée en DB ──
    try {
      const fontRecord = await this.prisma.font.findFirst({
        where: {
          OR: [
            { value: { contains: primaryFont } },
            { name: { contains: primaryFont } },
          ],
        },
        select: { googleFontUrl: true },
      });

      if (fontRecord?.googleFontUrl && fontRecord.googleFontUrl !== googleUrl) {
        this.logger.log(`🔍 [Font] Essai URL DB pour "${primaryFont}"`);
        return this.downloadFontFromCssUrl(fontRecord.googleFontUrl, primaryFont);
      }
    } catch (_) { /* ignorer erreur DB */ }

    return null;
  }

  /**
   * Télécharge le fichier de police (.ttf/.otf) depuis une URL CSS Google Fonts.
   */
  private async downloadFontFromCssUrl(cssUrl: string, label: string): Promise<Buffer | null> {
    // User-Agents à essayer dans l'ordre :
    // 1. Ancien Android 2.x → Google Fonts répond avec des URLs .ttf (le plus fiable)
    // 2. Sans UA → comportement dépendant du serveur
    const uaList = [
      'Mozilla/5.0 (Linux; U; Android 2.2; en-us; Nexus One Build/FRF91) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1',
      '',
    ];

    for (const ua of uaList) {
      try {
        const headers: Record<string, string> = {};
        if (ua) headers['User-Agent'] = ua;

        const cssRes = await axios.get(cssUrl, { timeout: 10000, headers });
        const urlMatches = [...(cssRes.data as string).matchAll(/url\(([^)]+)\)/g)];
        if (!urlMatches.length) continue;

        const fontUrls = urlMatches.map(m => m[1].replace(/['"]/g, ''));
        this.logger.log(`🔍 [Font] URLs trouvées pour "${label}" (UA: ${ua ? 'Android2' : 'none'}): ${fontUrls.join(', ')}`);

        // Préférer .ttf/.otf ; opentype.js ne supporte pas .woff2
        const fontUrl = fontUrls.find(u => u.includes('.ttf') || u.includes('.otf'))
          ?? fontUrls.find(u => u.includes('.woff') && !u.includes('woff2'));

        if (!fontUrl) {
          this.logger.warn(`⚠️ [Font] Pas d'URL TTF/OTF/WOFF avec UA "${ua ? 'Android2' : 'none'}" pour "${label}", essai suivant...`);
          continue;
        }

        this.logger.log(`📥 [Font] Téléchargement: ${fontUrl.substring(0, 80)}...`);
        const fontRes = await axios.get(fontUrl, { responseType: 'arraybuffer', timeout: 15000 });
        return Buffer.from(fontRes.data as ArrayBuffer);

      } catch (e) {
        this.logger.warn(`⚠️ [Font] Erreur avec UA "${ua ? 'Android2' : 'none'}" depuis ${cssUrl}: ${e.message}`);
      }
    }

    return null;
  }

  /**
   * Génère une image finale à partir des éléments de personnalisation
   * et l'upload vers Cloudinary
   *
   * @param config - Configuration de génération
   * @returns URL de l'image finale uploadée
   */
  async generateOrderMockup(config: GenerateMockupConfig): Promise<string> {
    this.logger.log(`🎨 [Mockup] Génération d'une image finale avec ${config.elements.length} élément(s)`);

    try {
      // 1. Télécharger l'image du produit
      this.logger.log(`📥 [Mockup] Téléchargement de l'image du produit: ${config.productImageUrl}`);
      const productBuffer = await this.downloadImage(config.productImageUrl);
      const productMetadata = await sharp(productBuffer).metadata();

      const productWidth = productMetadata.width!;
      const productHeight = productMetadata.height!;
      this.logger.log(`📐 [Mockup] Image du produit: ${productWidth}x${productHeight}px`);

      // 2. Trier les éléments par zIndex (ordre de superposition)
      const sortedElements = [...config.elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
      this.logger.log(`🔢 [Mockup] Éléments triés par zIndex: ${sortedElements.map(e => `${e.type}(z:${e.zIndex})`).join(', ')}`);

      // 3. Créer les calques pour chaque élément
      const composites: any[] = [];

      // Helper: convertir les coordonnées de l'élément en position top-left sur l'image produit.
      // Le frontend stocke x,y comme fraction 0-1 du canvas (point CENTRE, translate(-50%,-50%)).
      // Si x <= 2 et y <= 2 → format fraction ; sinon → pixels display (extraction DOM).
      const resolvePosition = (element: DesignElement): { left: number; top: number } => {
        const isFraction = element.x <= 2 && element.y <= 2;
        const centerX = isFraction ? element.x * productWidth : element.x;
        const centerY = isFraction ? element.y * productHeight : element.y;
        return {
          left: Math.max(0, Math.round(centerX - element.width / 2)),
          top:  Math.max(0, Math.round(centerY - element.height / 2)),
        };
      };

      for (let i = 0; i < sortedElements.length; i++) {
        const element = sortedElements[i];
        this.logger.log(`🎨 [Mockup] Traitement élément ${i + 1}/${sortedElements.length}: ${element.type} (id: ${element.id})`);

        if (element.type === 'text' && element.text) {
          // Normaliser la couleur: le frontend peut envoyer 'color' ou 'fill' (Fabric.js)
          const rawElement = element as any;
          const normalizedElement: DesignElement = (!element.color && rawElement.fill)
            ? { ...element, color: rawElement.fill }
            : element;

          this.logger.log(`  🎨 Texte: "${element.text.substring(0, 20)}" | color=${normalizedElement.color || 'none'} | fill=${rawElement.fill || 'none'} | fontFamily=${element.fontFamily || 'none'}`);

          // Charger la police opentype depuis Google Fonts (via DB)
          const font = await this.loadFont(normalizedElement.fontFamily || 'Arial');

          // Générer SVG avec texte converti en paths (police exacte, sans dépendance système)
          const textSvg = this.createTextSvgFromPaths(normalizedElement, font);
          const textBuffer = Buffer.from(textSvg);

          const { left, top } = resolvePosition(normalizedElement);

          composites.push({
            input: textBuffer,
            left,
            top,
            blend: 'over'
          });

          this.logger.log(`  ✅ Texte ajouté: "${element.text.substring(0, 30)}..." à (${left}, ${top}) couleur=${normalizedElement.color || '#000000'}`);

        } else if (element.type === 'image' && element.imageUrl) {
          // Télécharger et redimensionner l'image
          this.logger.log(`  📥 Téléchargement de l'image: ${element.imageUrl}`);
          const imageBuffer = await this.downloadImage(element.imageUrl);

          // Redimensionner et appliquer la rotation si nécessaire
          let processedBuffer = await sharp(imageBuffer)
            .resize(
              Math.round(element.width),
              Math.round(element.height),
              {
                fit: 'contain',
                background: { r: 0, g: 0, b: 0, alpha: 0 }
              }
            )
            .png()
            .toBuffer();

          // Appliquer la rotation si spécifiée
          if (element.rotation && element.rotation !== 0) {
            processedBuffer = await sharp(processedBuffer)
              .rotate(element.rotation, {
                background: { r: 0, g: 0, b: 0, alpha: 0 }
              })
              .png()
              .toBuffer();
          }

          const { left, top } = resolvePosition(element);

          composites.push({
            input: processedBuffer,
            left,
            top,
            blend: 'over'
          });

          this.logger.log(`  ✅ Image ajoutée: ${Math.round(element.width)}x${Math.round(element.height)}px à (${left}, ${top})`);
        }
      }

      this.logger.log(`🔧 [Mockup] Composition de ${composites.length} calque(s) sur l'image du produit...`);

      // 4. Composer tous les calques sur l'image du produit
      const finalBuffer = await sharp(productBuffer)
        .composite(composites)
        .jpeg({ quality: 92 })
        .toBuffer();

      this.logger.log(`✅ [Mockup] Image finale générée: ${finalBuffer.length} bytes`);

      // 5. Upload vers Cloudinary
      const timestamp = Date.now();
      const uploadPath = `order-mockups/mockup-${timestamp}`;

      this.logger.log(`📤 [Mockup] Upload vers Cloudinary: ${uploadPath}...`);
      const uploadResult = await this.cloudinaryService.uploadBuffer(
        finalBuffer,
        {
          folder: 'order-mockups',
          public_id: `mockup-${timestamp}`,
          quality: 90,
          resource_type: 'image'
        }
      );

      this.logger.log(`✅ [Mockup] Upload terminé: ${uploadResult.secure_url}`);
      return uploadResult.secure_url;

    } catch (error) {
      this.logger.error(`❌ [Mockup] Erreur lors de la génération:`, error.message);
      this.logger.error(`   Stack:`, error.stack);
      throw new Error(`Échec de la génération du mockup: ${error.message}`);
    }
  }

  /**
   * Reproduit le word-wrap de Fabric.js côté serveur.
   * Chaque paragraphe (séparé par \n) est découpé en lignes selon maxWidth
   * en utilisant les métriques de la police opentype.js.
   * Si font est null, on ne coupe que sur les \n existants.
   */
  private wrapTextToLines(
    text: string,
    font: opentype.Font | null,
    fontSize: number,
    maxWidth: number,
  ): string[] {
    const paragraphs = text.split('\n');
    const allLines: string[] = [];

    for (const paragraph of paragraphs) {
      if (!paragraph) { allLines.push(''); continue; }

      if (!font) { allLines.push(paragraph); continue; }

      const words = paragraph.split(' ');
      let currentLine = '';

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const lineWidth = font.getAdvanceWidth(testLine, fontSize);

        if (lineWidth > maxWidth && currentLine) {
          allLines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }

      if (currentLine) allLines.push(currentLine);
    }

    return allLines;
  }

  private createTextSvgFromPaths(
    element: DesignElement,
    font: opentype.Font | null,
  ): string {
    const fontSize = element.fontSize || 24;
    // Chercher la couleur dans 'color' ou 'fill' (Fabric.js stocke la couleur de texte dans 'fill')
    const rawEl = element as any;
    const color = element.color || rawEl.fill || '#000000';
    const text = element.text || '';
    const rotation = element.rotation || 0;
    const svgW = element.width;
    const svgH = element.height;
    const centerX = svgW / 2;
    const centerY = svgH / 2;
    // Reproduire le word-wrap de Fabric.js : couper les lignes qui dépassent la largeur
    const lines = this.wrapTextToLines(text, font, fontSize, svgW);
    const lineHeight = fontSize * 1.2;
    const textAlign = element.textAlign || 'center';

    if (font) {
      // ── Rendu opentype.js : texte → paths SVG (police exacte) ──
      const pathDefs: string[] = [];

      // Bold synthétique : opentype.js rend des <path>, pas de font-weight CSS.
      // On simule le gras avec un stroke de même couleur sur le contour du path.
      const isBold = element.fontWeight === 'bold' || Number(element.fontWeight) >= 600;
      const boldStroke = isBold
        ? ` stroke="${color}" stroke-width="${(fontSize * 0.04).toFixed(1)}" stroke-linejoin="round" paint-order="stroke"`
        : '';

      lines.forEach((line, idx) => {
        if (!line) return;

        // Mesurer la largeur de la ligne pour l'alignement
        const lineWidth = font.getAdvanceWidth(line, fontSize);
        let xOrigin: number;
        if (textAlign === 'left') {
          xOrigin = 0;
        } else if (textAlign === 'right') {
          xOrigin = svgW - lineWidth;
        } else {
          xOrigin = (svgW - lineWidth) / 2;
        }

        // Baseline Y centrée verticalement
        const yBaseline = (svgH / 2) + (idx - (lines.length - 1) / 2) * lineHeight + fontSize * 0.35;

        // Convertir en chemin SVG
        const otPath = font.getPath(line, xOrigin, yBaseline, fontSize);
        const pathData = otPath.toSVG(2); // toSVG retourne une string <path .../>

        // Injecter couleur + bold synthétique si nécessaire
        pathDefs.push(pathData.replace('<path', `<path fill="${color}"${boldStroke}`));
      });

      return `<svg width="${svgW}" height="${svgH}" xmlns="http://www.w3.org/2000/svg">
  <g transform="rotate(${rotation} ${centerX} ${centerY})">
    ${pathDefs.join('\n    ')}
  </g>
</svg>`;

    } else {
      // ── Fallback : <text> avec police système ──
      const textElements = lines.map((line, idx) => {
        const y = (svgH / 2) + (idx - (lines.length - 1) / 2) * lineHeight;
        const anchor = textAlign === 'left' ? 'start' : textAlign === 'right' ? 'end' : 'middle';
        const x = textAlign === 'left' ? 0 : textAlign === 'right' ? svgW : svgW / 2;
        return `<text x="${x}" y="${y}" font-size="${fontSize}" fill="${color}"
          font-weight="${element.fontWeight || 'normal'}" text-anchor="${anchor}"
          dominant-baseline="middle">${this.escapeXml(line)}</text>`;
      }).join('\n    ');

      return `<svg width="${svgW}" height="${svgH}" xmlns="http://www.w3.org/2000/svg">
  <g transform="rotate(${rotation} ${centerX} ${centerY})">
    ${textElements}
  </g>
</svg>`;
    }
  }

  /**
   * Échapper les caractères XML spéciaux dans le texte
   */
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Télécharger une image depuis une URL
   */
  private async downloadImage(url: string): Promise<Buffer> {
    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 30000, // 30 secondes
      });

      const buffer = Buffer.from(response.data);

      // Si c'est un SVG, le convertir en PNG
      if (url.toLowerCase().includes('.svg')) {
        this.logger.log(`  🔄 Conversion SVG → PNG`);
        return await sharp(buffer, { density: 300 })
          .resize(2000, 2000, {
            fit: 'inside',
            withoutEnlargement: false,
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          })
          .png()
          .toBuffer();
      }

      return buffer;

    } catch (error) {
      this.logger.error(`❌ Erreur téléchargement image: ${url}`, error.message);
      throw new Error(`Impossible de télécharger l'image: ${error.message}`);
    }
  }
}
