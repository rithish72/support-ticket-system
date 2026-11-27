export const getPagination = (q: { page?: number; limit?: number }) => {
  const page = q.page ?? 1;
  const limit = q.limit ?? 10;
  return { page, limit, skip: (page - 1) * limit };
};

export const paginationMeta = (total: number, page: number, limit: number) => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
});
