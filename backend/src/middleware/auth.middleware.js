const jwt = require("jsonwebtoken");
const { error } = require("../utils/response");

/**
 * Verifies the Bearer JWT and attaches the decoded payload to req.user.
 * Expected payload shape: { id, email, role, isAdmin, isUnit, isSchool }
 */
function authenticate(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return error(res, {
      statusCode: 401,
      code: "UNAUTHORIZED",
      message: "Missing or malformed Authorization header. Expected 'Bearer <token>'.",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    return error(res, {
      statusCode: 401,
      code: "INVALID_TOKEN",
      message: "The provided token is invalid or has expired.",
    });
  }
}

/**
 * Restricts a route to one or more roles, e.g. authorize("SUPER_ADMIN")
 * or authorize("SUPER_ADMIN", "UNIT_OFFICER").
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return error(res, { statusCode: 401, code: "UNAUTHORIZED", message: "Not authenticated." });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return error(res, {
        statusCode: 403,
        code: "FORBIDDEN",
        message: "You do not have permission to perform this action.",
      });
    }
    return next();
  };
}

module.exports = { authenticate, authorize };
