// src/modules/admin/dto/create-admin-user.dto.ts
import {
  IsString,
  IsEmail,
  MinLength,
  IsOptional,
  IsEnum,
  IsArray,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Role, Permission } from "../../../common/constants/roles.constant";

export class CreateAdminUserDto {
  @ApiProperty({ example: "admin@flybeth.com" })
  @IsEmail()
  email: string;

  @ApiProperty({ example: "StrongP@ss1" })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: "John" })
  @IsString()
  firstName: string;

  @ApiProperty({ example: "Doe" })
  @IsString()
  lastName: string;

  @ApiPropertyOptional({ example: "+1234567890" })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ enum: Role, example: Role.SUPER_ADMIN })
  @IsEnum(Role)
  role: Role;

  @ApiPropertyOptional({ type: [String], enum: Permission })
  @IsOptional()
  @IsArray()
  @IsEnum(Permission, { each: true })
  permissions?: Permission[];
}
