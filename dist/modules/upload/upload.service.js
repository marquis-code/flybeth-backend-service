"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var UploadService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadService = void 0;
const common_1 = require("@nestjs/common");
const cloudinary_1 = require("cloudinary");
const config_1 = require("@nestjs/config");
const streamifier = __importStar(require("streamifier"));
let UploadService = UploadService_1 = class UploadService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(UploadService_1.name);
        cloudinary_1.v2.config({
            cloud_name: this.configService.get('CLOUDINARY_CLOUD_NAME'),
            api_key: this.configService.get('CLOUDINARY_API_KEY'),
            api_secret: this.configService.get('CLOUDINARY_API_SECRET'),
        });
    }
    async uploadImage(file, folder = 'general') {
        if (!file)
            throw new common_1.BadRequestException('No file provided');
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.mimetype)) {
            throw new common_1.BadRequestException('Invalid file type. Allowed: JPEG, PNG, GIF, WebP');
        }
        if (file.size > 10 * 1024 * 1024) {
            throw new common_1.BadRequestException('File size exceeds 10MB limit');
        }
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary_1.v2.uploader.upload_stream({
                folder: `flight-booking/${folder}`,
                resource_type: 'image',
                transformation: [
                    { width: 1200, crop: 'limit' },
                    { quality: 'auto', fetch_format: 'auto' },
                ],
            }, (error, result) => {
                if (error) {
                    this.logger.error(`Upload failed: ${error.message}`);
                    reject(new common_1.BadRequestException('File upload failed'));
                }
                else {
                    resolve({
                        url: result.secure_url,
                        publicId: result.public_id,
                        width: result.width,
                        height: result.height,
                    });
                }
            });
            streamifier.createReadStream(file.buffer).pipe(uploadStream);
        });
    }
    async uploadDocument(file, folder = 'documents') {
        if (!file)
            throw new common_1.BadRequestException('No file provided');
        const allowedTypes = ['application/pdf', 'application/msword'];
        if (!allowedTypes.includes(file.mimetype)) {
            throw new common_1.BadRequestException('Invalid file type. Allowed: PDF, DOC');
        }
        if (file.size > 25 * 1024 * 1024) {
            throw new common_1.BadRequestException('File size exceeds 25MB limit');
        }
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary_1.v2.uploader.upload_stream({
                folder: `flight-booking/${folder}`,
                resource_type: 'raw',
            }, (error, result) => {
                if (error) {
                    this.logger.error(`Document upload failed: ${error.message}`);
                    reject(new common_1.BadRequestException('Document upload failed'));
                }
                else {
                    resolve({
                        url: result.secure_url,
                        publicId: result.public_id,
                    });
                }
            });
            streamifier.createReadStream(file.buffer).pipe(uploadStream);
        });
    }
    async deleteFile(publicId) {
        try {
            await cloudinary_1.v2.uploader.destroy(publicId);
            this.logger.log(`File deleted: ${publicId}`);
        }
        catch (error) {
            this.logger.error(`Delete failed: ${error.message}`);
            throw new common_1.BadRequestException('File deletion failed');
        }
    }
};
exports.UploadService = UploadService;
exports.UploadService = UploadService = UploadService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], UploadService);
//# sourceMappingURL=upload.service.js.map