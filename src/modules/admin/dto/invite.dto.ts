import {
  IsEmail,
  IsEnum,
  IsArray,
  IsOptional,
  IsString,
} from "class-validator";
import { Role, Permission } from "../../../common/constants/roles.constant";

export class InviteDto {
  @IsEmail()
  email: string;

  @IsString()
  role: string;

  @IsArray()
  @IsEnum(Permission, { each: true })
  @IsOptional()
  permissions?: Permission[];

  @IsString()
  @IsOptional()
  tenantId?: string;
}
