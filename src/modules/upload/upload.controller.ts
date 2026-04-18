// src/modules/upload/upload.controller.ts
import {
  Controller,
  Post,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  Query,
  Body,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
} from "@nestjs/swagger";
import { Public } from "../../common/decorators/public.decorator";
import { UploadService } from "./upload.service";

@ApiTags("Upload")
@Controller("upload")
@Public()
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post("image")
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(FileInterceptor("file"))
  @ApiOperation({ summary: "Upload an image" })
  uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Body("folder") bodyFolder?: string,
    @Query("folder") queryFolder?: string,
    @Body("label") label?: string,
    @Body("category") category?: string,
  ) {
    const folder = queryFolder || bodyFolder || "general";
    return this.uploadService.uploadImage(file, folder, { label, category });
  }

  @Post("document")
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(FileInterceptor("file"))
  @ApiOperation({ summary: "Upload a document (PDF, DOC)" })
  uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body("folder") bodyFolder?: string,
    @Query("folder") queryFolder?: string,
    @Body("label") label?: string,
    @Body("category") category?: string,
  ) {
    const folder = queryFolder || bodyFolder || "documents";
    return this.uploadService.uploadDocument(file, folder, { label, category });
  }

  @Delete(":publicId")
  @ApiOperation({ summary: "Delete a file by public ID" })
  deleteFile(@Param("publicId") publicId: string) {
    return this.uploadService.deleteFile(publicId);
  }
}
