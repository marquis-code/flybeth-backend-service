import { UploadService } from './upload.service';
export declare class UploadController {
    private readonly uploadService;
    constructor(uploadService: UploadService);
    uploadImage(file: Express.Multer.File, folder?: string): Promise<{
        url: string;
        publicId: string;
        width: number;
        height: number;
    }>;
    uploadDocument(file: Express.Multer.File, folder?: string): Promise<{
        url: string;
        publicId: string;
    }>;
    deleteFile(publicId: string): Promise<void>;
}
