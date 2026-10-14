const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 60;

const parsePagination = (query = {}) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(query.limit, 10) || DEFAULT_LIMIT));
  return { page, limit, skip: (page - 1) * limit };
};

const paginatedResponse = (res, { data, total, page, limit, extra = {} }) =>
  res.status(200).json({
    success: true,
    count: data.length,
    total,
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
    data,
    ...extra
  });

module.exports = { parsePagination, paginatedResponse };
