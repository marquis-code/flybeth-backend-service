import { PaginationDto } from '../dto/pagination.dto';
import { Model } from 'mongoose';
export interface PaginatedResult<T> {
    data: T[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
    };
}
export declare function paginate<T>(model: Model<T>, query: any, pagination: PaginationDto, populate?: string | string[] | any[], select?: string): Promise<PaginatedResult<T>>;
