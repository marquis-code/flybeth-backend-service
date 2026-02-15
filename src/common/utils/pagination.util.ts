// src/common/utils/pagination.util.ts
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

export async function paginate<T>(
    model: Model<T>,
    query: any,
    pagination: PaginationDto,
    populate?: string | string[] | any[],
    select?: string,
): Promise<PaginatedResult<T>> {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
    const skip = (page - 1) * limit;

    const sortOptions: Record<string, 1 | -1> = {
        [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    const [data, total] = await Promise.all([
        model
            .find(query)
            .sort(sortOptions)
            .skip(skip)
            .limit(limit)
            .populate(populate || [])
            .select(select || '')
            .lean()
            .exec(),
        model.countDocuments(query).exec(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
        data: data as T[],
        meta: {
            total,
            page,
            limit,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
        },
    };
}
