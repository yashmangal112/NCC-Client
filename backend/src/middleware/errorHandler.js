const { error } = require("../utils/response");

/**
 * Central error handler. Controllers should call next(err) on unexpected
 * failures; this maps common Prisma error codes to sensible HTTP responses.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error(err);

  // Prisma known request errors (e.g. unique constraint, FK violation)
  if (err.code === "P2002") {
    return error(res, {
      statusCode: 409,
      code: "DUPLICATE_ENTRY",
      message: `A record with this ${Array.isArray(err.meta?.target) ? err.meta.target.join(", ") : "value"} already exists.`,
    });
  }

  if (err.code === "P2025") {
    return error(res, {
      statusCode: 404,
      code: "NOT_FOUND",
      message: "The requested record was not found.",
    });
  }

  if (err.code === "P2003") {
    return error(res, {
      statusCode: 409,
      code: "FOREIGN_KEY_CONSTRAINT",
      message: "This action violates a related-record constraint.",
    });
  }

  return error(res, {
    statusCode: err.statusCode || 500,
    code: err.code || "INTERNAL_SERVER_ERROR",
    message: err.message || "An unexpected error occurred.",
  });
}

function notFoundHandler(req, res) {
  return error(res, {
    statusCode: 404,
    code: "ROUTE_NOT_FOUND",
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
}

module.exports = { errorHandler, notFoundHandler };
