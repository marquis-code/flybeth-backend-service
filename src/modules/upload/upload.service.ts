// src/modules/upload/upload.service.ts
import { Injectable, BadRequestException, Logger } from "@nestjs/common";
import { S3Client, DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly region: string;

  constructor(private configService: ConfigService) {
    this.region = this.configService.get<string>("AWS_REGION", "us-east-2");
    this.bucketName = this.configService.get<string>("AWS_S3_BUCKET_NAME", "flybeth");
    
    const accessKeyId = this.configService.get<string>("AWS_ACCESS_KEY_ID");
    const secretAccessKey = this.configService.get<string>("AWS_SECRET_ACCESS_KEY");

    if (!accessKeyId || !secretAccessKey) {
      this.logger.error("AWS credentials are missing. S3 uploads will fail.");
    }

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: accessKeyId || "",
        secretAccessKey: secretAccessKey || "",
      },
    });
  }

  async uploadImage(
    file: Express.Multer.File,
    folder: string = "general",
    metadata?: { label?: string; category?: string },
  ): Promise<{ url: string; publicId: string }> {
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

    return this.uploadToS3(file, folder, metadata);
  }

  async uploadDocument(
    file: Express.Multer.File,
    folder: string = "documents",
    metadata?: { label?: string; category?: string },
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

    return this.uploadToS3(file, folder, metadata);
  }

  private async uploadToS3(
    file: Express.Multer.File,
    folder: string,
    metadata?: { label?: string; category?: string },
  ): Promise<{ url: string; publicId: string }> {
    const filename = `${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`;
    const key = `flight-booking/${folder}/${filename}`;

    const s3Metadata: Record<string, string> = {};
    if (metadata?.label) s3Metadata.label = metadata.label;
    if (metadata?.category) s3Metadata.category = metadata.category;

    try {
      const upload = new Upload({
        client: this.s3Client,
        params: {
          Bucket: this.bucketName,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
          Metadata: s3Metadata,
        },
      });

      await upload.done();

      // Construct the URL. If the bucket is not public, you'd need signed URLs.
      // Assuming public bucket based on Cloudinary replacement.
      const url = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;

      return {
        url,
        publicId: key,
      };
    } catch (error: any) {
      this.logger.error(`S3 Upload failed: ${error.message}`);
      throw new BadRequestException("File upload failed");
    }
  }

  async deleteFile(publicId: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: publicId,
      });
      await this.s3Client.send(command);
      this.logger.log(`File deleted from S3: ${publicId}`);
    } catch (error: any) {
      this.logger.error(`S3 Delete failed: ${error.message}`);
      throw new BadRequestException("File deletion failed");
    }
  }

  async listFiles(folder?: string): Promise<any[]> {
    try {
      const prefix = folder ? `flight-booking/${folder}/` : "flight-booking/";
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: prefix,
      });

      const result = await this.s3Client.send(command);

      return (result.Contents || []).map((item: any) => ({
        publicId: item.Key,
        url: `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${item.Key}`,
        size: item.Size,
        createdAt: item.LastModified,
      }));
    } catch (error: any) {
      this.logger.error(`S3 List failed: ${error.message}`);
      throw new BadRequestException("Failed to fetch storage items");
    }
  }
}
