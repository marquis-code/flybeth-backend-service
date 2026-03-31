// src/modules/upload/upload.service.ts
import { Injectable, BadRequestException, Logger } from "@nestjs/common";
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import { ConfigService } from "@nestjs/config";
import * as streamifier from "streamifier";

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get("CLOUDINARY_CLOUD_NAME"),
      api_key: this.configService.get("CLOUDINARY_API_KEY"),
      api_secret: this.configService.get("CLOUDINARY_API_SECRET"),
    });
  }

  async uploadImage(
    file: Express.Multer.File,
    folder: string = "general",
  ): Promise<{ url: string; publicId: string; width: number; height: number }> {
    if (!file) throw new BadRequestException("No file provided");

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        "Invalid file type. Allowed: JPEG, PNG, GIF, WebP, PDF, DOC, DOCX",
      );
    }

    if (file.size > 25 * 1024 * 1024) {
      throw new BadRequestException("File size exceeds 25MB limit");
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `flight-booking/${folder}`,
          resource_type: "auto",
        },
        (error, result: UploadApiResponse) => {
          if (error) {
            this.logger.error(`Upload failed: ${error.message}`);
            reject(new BadRequestException("File upload failed"));
          } else {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              width: result.width,
              height: result.height,
            });
          }
        },
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  async uploadDocument(
    file: Express.Multer.File,
    folder: string = "documents",
  ): Promise<{ url: string; publicId: string }> {
    if (!file) throw new BadRequestException("No file provided");

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        "Invalid file type. Allowed: PDF, DOC, DOCX, JPEG, PNG, GIF, WebP",
      );
    }

    if (file.size > 25 * 1024 * 1024) {
      throw new BadRequestException("File size exceeds 25MB limit");
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `flight-booking/${folder}`,
          resource_type: "auto",
        },
        (error, result: UploadApiResponse) => {
          if (error) {
            this.logger.error(`Document upload failed: ${error.message}`);
            reject(new BadRequestException("Document upload failed"));
          } else {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
            });
          }
        },
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  async deleteFile(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
      this.logger.log(`File deleted: ${publicId}`);
    } catch (error: any) {
      this.logger.error(`Delete failed: ${error.message}`);
      throw new BadRequestException("File deletion failed");
    }
  }

  async listFiles(folder?: string): Promise<any[]> {
    try {
      const result = await cloudinary.api.resources({
        type: 'upload',
        prefix: folder ? `flight-booking/${folder}` : 'flight-booking/',
        max_results: 500
      });
      
      return result.resources.map((resource: any) => ({
        publicId: resource.public_id,
        url: resource.secure_url,
        format: resource.format,
        size: resource.bytes,
        createdAt: resource.created_at,
        resourceType: resource.resource_type
      }));
    } catch (error: any) {
      this.logger.error(`Failed to list files: ${error.message}`);
      throw new BadRequestException("Failed to fetch storage items");
    }
  }
}
