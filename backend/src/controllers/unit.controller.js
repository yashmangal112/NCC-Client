const bcrypt = require("bcryptjs");
const prisma = require("../lib/prisma");
const { success, error, buildMeta, parsePagination } = require("../utils/response");
const { generateUnitCode } = require("../utils/generateCode");

function serialize(unit) {
  const totalStudents = unit.schoolAllocations.reduce((sum, a) => sum + a.studentCount, 0);
  return {
    id: unit.id,
    unitCode: unit.unitCode,
    name: unit.name,
    spocName: unit.spocName,
    spocPhone: unit.spocPhone,
    spocEmail: unit.spocEmail,
    schoolCount: unit.schoolAllocations.length,
    totalStudents,
    mappedSchools: unit.schoolAllocations.map((a) => ({
      schoolId: a.school.code,
      schoolName: a.school.name,
      studentCount: a.studentCount,
    })),
    createdAt: unit.createdAt,
  };
}

// GET /api/admin/units
async function getUnits(req, res, next) {
  try {
    const { search } = req.query;
    const { page, limit, skip } = parsePagination(req.query);

    const where = search
      ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { unitCode: { contains: search, mode: "insensitive" } }] }
      : {};

    const [units, total] = await Promise.all([
      prisma.unit.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { schoolAllocations: { include: { school: true } } },
      }),
      prisma.unit.count({ where }),
    ]);

    return success(res, { data: units.map(serialize), meta: buildMeta({ page, limit, total }) });
  } catch (err) {
    return next(err);
  }
}

// GET /api/admin/units/:id
async function getUnitById(req, res, next) {
  try {
    const unit = await prisma.unit.findUnique({
      where: { id: req.params.id },
      include: { schoolAllocations: { include: { school: true } } },
    });
    if (!unit) return error(res, { statusCode: 404, code: "NOT_FOUND", message: "Unit not found." });
    return success(res, { data: serialize(unit) });
  } catch (err) {
    return next(err);
  }
}

// POST /api/admin/units
async function createUnit(req, res, next) {
  try {
    const { unitCode, name, spocName, spocPhone, spocEmail, password } = req.body;

    if (!name || !spocName || !spocPhone || !spocEmail || !password) {
      return error(res, {
        statusCode: 400,
        code: "VALIDATION_ERROR",
        message: "name, spocName, spocPhone, spocEmail and password are required.",
      });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: spocEmail } });
    if (existingUser) {
      return error(res, {
        statusCode: 409,
        code: "DUPLICATE_ENTRY",
        message: "A user with this email already exists.",
      });
    }

    const finalUnitCode = unitCode || (await generateUnitCode());
    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const unit = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: spocEmail,
          password: hashedPassword,
          role: "UNIT_OFFICER",
          isUnit: true,
        },
      });

      return tx.unit.create({
        data: {
          unitCode: finalUnitCode,
          name,
          spocName,
          spocPhone,
          spocEmail,
          userId: user.id,
        },
        include: { schoolAllocations: { include: { school: true } } },
      });
    });

    return success(res, { data: serialize(unit), statusCode: 201 });
  } catch (err) {
    return next(err);
  }
}

// PUT /api/admin/units/:id
async function updateUnit(req, res, next) {
  try {
    const { id } = req.params;
    const { name, spocName, spocPhone, spocEmail } = req.body;

    const unit = await prisma.unit.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(spocName !== undefined && { spocName }),
        ...(spocPhone !== undefined && { spocPhone }),
        ...(spocEmail !== undefined && { spocEmail }),
      },
      include: { schoolAllocations: { include: { school: true } } },
    });

    return success(res, { data: serialize(unit) });
  } catch (err) {
    return next(err);
  }
}

module.exports = { getUnits, getUnitById, createUnit, updateUnit };
