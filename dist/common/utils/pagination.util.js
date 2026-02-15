"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginate = paginate;
async function paginate(model, query, pagination, populate, select) {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
    const skip = (page - 1) * limit;
    const sortOptions = {
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
        data: data,
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
//# sourceMappingURL=pagination.util.js.map