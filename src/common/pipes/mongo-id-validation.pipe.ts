// src/common/pipes/mongo-id-validation.pipe.ts
import {
    PipeTransform,
    Injectable,
    BadRequestException,
} from '@nestjs/common';
import { Types } from 'mongoose';

@Injectable()
export class MongoIdValidationPipe implements PipeTransform {
    transform(value: string): string {
        if (!Types.ObjectId.isValid(value)) {
            throw new BadRequestException(`Invalid ID format: ${value}`);
        }
        return value;
    }
}
