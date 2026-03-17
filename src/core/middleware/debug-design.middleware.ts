import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class DebugDesignMiddleware implements NestMiddleware {
  private readonly logger = new Logger(DebugDesignMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    // Seulement pour les routes de publication vendeur
    if (req.path.includes('/vendor/publish') && req.method === 'POST') {
      this.logger.log('🔍 === MIDDLEWARE DEBUG DESIGN ===');
      
      // Informations sur la requête
      this.logger.log('📡 Headers:', {
        contentType: req.headers['content-type'],
        contentLength: req.headers['content-length'],
        authorization: req.headers.authorization ? 'Présent' : 'Absent'
      });
      
      // Informations sur le body
      if (req.body) {
        this.logger.log('📦 Body keys:', Object.keys(req.body));
        
        // Debug design spécifique
        this.logger.log('🎨 Design dans body:', {
          designUrlPresent: !!req.body.designUrl,
          designUrlType: typeof req.body.designUrl,
          designUrlLength: req.body.designUrl?.length || 0,
          designUrlStart: req.body.designUrl ? req.body.designUrl.substring(0, 50) + '...' : 'absent',
          isBase64: req.body.designUrl?.startsWith('data:image/') || false,
          isBlobUrl: req.body.designUrl?.startsWith('blob:') || false
        });
        
        // Debug designFile
        this.logger.log('📄 DesignFile dans body:', {
          designFilePresent: !!req.body.designFile,
          designFileType: typeof req.body.designFile,
          designFileKeys: req.body.designFile ? Object.keys(req.body.designFile) : 'absent',
          designFileName: req.body.designFile?.name || 'absent',
          designFileSize: req.body.designFile?.size || 0
        });
        
        // Debug finalImagesBase64
        this.logger.log('🖼️ FinalImagesBase64 dans body:', {
          finalImagesPresent: !!req.body.finalImagesBase64,
          finalImagesType: typeof req.body.finalImagesBase64,
          finalImagesKeys: req.body.finalImagesBase64 ? Object.keys(req.body.finalImagesBase64) : 'absent',
          hasDesignKey: req.body.finalImagesBase64?.['design'] ? true : false,
          hasOriginalKey: req.body.finalImagesBase64?.['original'] ? true : false
        });
        
        // Estimation de la taille du payload
        const payloadSize = JSON.stringify(req.body).length;
        const payloadSizeMB = (payloadSize / 1024 / 1024).toFixed(2);
        this.logger.log(`📊 Taille payload: ${payloadSizeMB}MB (${payloadSize} caractères)`);
        
        if (payloadSize > 50 * 1024 * 1024) { // 50MB
          this.logger.warn('⚠️ Payload très volumineux, risque de timeout');
        }
      } else {
        this.logger.warn('❌ Aucun body reçu');
      }
      
      this.logger.log('🔍 === FIN DEBUG DESIGN ===');
    }
    
    next();
  }
} 