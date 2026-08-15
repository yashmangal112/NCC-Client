const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");
const { success, error } = require("../utils/response");

// POST /api/auth/login
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return error(res, {
        statusCode: 400,
        code: "VALIDATION_ERROR",
        message: "Email and password are required.",
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { unit: true, school: true, deliveryPerson: true },
    });

    if (!user || !user.password) {
      return error(res, {
        statusCode: 401,
        code: "INVALID_CREDENTIALS",
        message: "Invalid email or password.",
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return error(res, {
        statusCode: 401,
        code: "INVALID_CREDENTIALS",
        message: "Invalid email or password.",
      });
    }

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      isAdmin: user.isAdmin,
      isUnit: user.isUnit,
      isSchool: user.isSchool,
      isDeliveryPerson: user.isDeliveryPerson,
      unitId: user.unit?.id || null,
      schoolId: user.school?.id || null,
      driverId: user.deliveryPerson?.id || null,
      name: user.unit?.name || user.school?.name || user.deliveryPerson?.fullName || null,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    });

    return success(res, {
      data: {
        token,
        user: payload,
      },
    });
  } catch (err) {
    return next(err);
  }
}

// GET /api/auth/me  (bonus: return the authenticated profile)
async function me(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        role: true,
        isAdmin: true,
        isUnit: true,
        isSchool: true,
        isDeliveryPerson: true,
        createdAt: true,
        unit: true, 
        school: true,
        deliveryPerson: true,
      },
    });

    if (!user) {
      return error(res, { statusCode: 404, code: "NOT_FOUND", message: "User not found." });
    }

    return success(res, { data: user });
  } catch (err) {
    return next(err);
  }
}

module.exports = { login, me };
