import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../users/enums/user-role.enum';
import { Storage } from '@google-cloud/storage';

const ALLOWED_MIME_TYPES: string[] = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

// Nom du bucket GCS (variable d'env ou fallback)
const GCS_BUCKET = process.env.GCS_BUCKET_NAME ?? 'spotgourmand-uploads';

@Controller('upload')
@UseGuards(RolesGuard)
export class UploadController {
  private readonly logger = new Logger(UploadController.name);
  private readonly storage = new Storage();

  /**
   * Upload une image vers Google Cloud Storage
   * POST /api/upload/image
   * Retourne { url: "https://storage.googleapis.com/bucket/filename" }
   */
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @Post('image')
  @UseInterceptors(
    FileInterceptor('file', {
      // memoryStorage : on ne touche pas le disque local (Cloud Run est éphémère)
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          cb(
            new BadRequestException(
              'Format non supporté. Utilisez JPG, PNG, WebP ou GIF.',
            ),
            false,
          );
          return;
        }
        cb(null, true);
      },
    }),
  )
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Aucun fichier reçu');
    }

    const filename = `${uuidv4()}${extname(file.originalname)}`;

    try {
      const bucket = this.storage.bucket(GCS_BUCKET);
      const gcsFile = bucket.file(filename);

      await gcsFile.save(file.buffer, {
        contentType: file.mimetype,
        // Le fichier est public — le bucket doit avoir "allUsers" en lecteur
        predefinedAcl: 'publicRead',
      });

      const url = `https://storage.googleapis.com/${GCS_BUCKET}/${filename}`;
      this.logger.log(`Image uploadée vers GCS : ${url}`);
      return { url, filename, size: file.size };
    } catch (err) {
      this.logger.error(
        `Erreur upload GCS : ${err instanceof Error ? err.message : String(err)}`,
      );
      throw new InternalServerErrorException(
        "Échec de l'upload vers Google Cloud Storage",
      );
    }
  }
}
