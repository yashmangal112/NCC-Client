/**
 * Standard success envelope:
 * { success: true, data, meta? }
 */
function success(res, { data, meta = undefined, statusCode = 200 }) {
  const body = { success: true, data };
  if (meta) body.meta = meta;
  return res.status(statusCode).json(body);
}

/**
 * Standard error envelope:
 * { success: false, error: { code, message } }
 */
function error(res, { statusCode = 400, code = "BAD_REQUEST", message = "Something went wrong." }) {
  return res.status(statusCode).json({
    success: false,
    error: { code, message },
  });
}

/** Builds the { page, limit, total, totalPages } meta block. */
function buildMeta({ page, limit, total }) {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

/** Parses & sanitizes page/limit query params. */
function parsePagination(query, { defaultLimit = 10, maxLimit = 100 } = {}) {
  let page = parseInt(query.page, 10);
  let limit = parseInt(query.limit, 10);

  if (!Number.isInteger(page) || page < 1) page = 1;
  if (!Number.isInteger(limit) || limit < 1) limit = defaultLimit;
  if (limit > maxLimit) limit = maxLimit;

  return { page, limit, skip: (page - 1) * limit };
}

module.exports = { success, error, buildMeta, parsePagination };
