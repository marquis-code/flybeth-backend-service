import { IsString, IsNotEmpty, IsOptional, IsArray, IsEnum } from 'class-validator';

export class CreateRoomDto {
  @IsArray()
  @IsNotEmpty()
  participants: string[];

  @IsEnum(['direct', 'group'])
  @IsOptional()
  type?: string = 'direct';

  @IsString()
  @IsOptional()
  name?: string;
}

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  roomId: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsOptional()
  type?: string = 'text';

  @IsOptional()
  metadata?: any;

  @IsString()
  @IsOptional()
  replyTo?: string;
}
