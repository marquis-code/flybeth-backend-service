// src/modules/upload/upload.controller.ts
import {
    Controller,
    Post,
    Delete,
    Param,
    UseInterceptors,
    UploadedFile,
    Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { UploadService } from './upload.service';

@ApiTags('Upload')
@ApiBearerAuth()
@Controller('upload')
export class UploadController {
    constructor(private readonly uploadService: UploadService) { }

    @Post('image')
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('file'))
    @ApiOperation({ summary: 'Upload an image' })
    uploadImage(
        @UploadedFile() file: Express.Multer.File,
        @Query('folder') folder?: string,
    ) {
        return this.uploadService.uploadImage(file, folder);
    }

    @Post('document')
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('file'))
    @ApiOperation({ summary: 'Upload a document (PDF, DOC)' })
    uploadDocument(
        @UploadedFile() file: Express.Multer.File,
        @Query('folder') folder?: string,
    ) {
        return this.uploadService.uploadDocument(file, folder);
    }

    @Delete(':publicId')
    @ApiOperation({ summary: 'Delete a file by public ID' })
    deleteFile(@Param('publicId') publicId: string) {
        return this.uploadService.deleteFile(publicId);
    }
}
