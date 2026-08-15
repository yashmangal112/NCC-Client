const bcrypt = require("bcryptjs");
const prisma = require("../lib/prisma");
const { success, error, buildMeta, parsePagination } = require("../utils/response");

function serialize(school) {
  const lifetimeOrders = school.orders.length;
  const lifetimeRevenue = school.orders.reduce((sum, o) => sum + o.totalAmount, 0);

  return {
    id: school.id,
    code: school.code,
    name: school.name,
    address: school.address,
    headName: school.headName,
    headDesignation: school.headDesignation,
    headEmail: school.headEmail,
    headPhone: school.headPhone,
    unitAllocations: school.unitAllocations.map((a) => ({
      unitName: a.unit.name,
      studentCount: a.studentCount,
    })),
    lifetimeOrders,
    lifetimeRevenue: Math.round(lifetimeRevenue * 100) / 100,
    createdAt: school.createdAt,
  };
}

// GET /api/admin/schools
async function getSchools(req, res, next) {
  try {
    const { unit, search } = req.query;
    const { page, limit, skip } = parsePagination(req.query);

    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
      ];
    }
    if (unit) {
      where.unitAllocations = { some: { unit: { name: unit } } };
    }

    const [schools, total] = await Promise.all([
      prisma.school.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          unitAllocations: { include: { unit: true } },
          orders: { select: { totalAmount: true } },
        },
      }),
      prisma.school.count({ where }),
    ]);

    return success(res, { data: schools.map(serialize), meta: buildMeta({ page, limit, total }) });
  } catch (err) {
    return next(err);
  }
}

// GET /api/admin/schools/:id
async function getSchoolById(req, res, next) {
  try {
    const school = await prisma.school.findUnique({
      where: { id: req.params.id },
      include: {
        unitAllocations: { include: { unit: true } },
        orders: { select: { totalAmount: true } },
      },
    });
    if (!school) return error(res, { statusCode: 404, code: "NOT_FOUND", message: "School not found." });
    return success(res, { data: serialize(school) });
  } catch (err) {
    return next(err);
  }
}

// POST /api/admin/schools
async function createSchool(req, res, next) {
  try {
    const {
      institutionalCode: rawInstitutionalCode,
      schoolCode: rawSchoolCode,
      code: rawCode,
      schoolName: rawSchoolName,
      name: rawName,
      address,
      headName,
      headDesignation,
      headEmail,
      headPhone,
      password,
      unitAllocations,
    } = req.body;

    // 💡 Resolve field aliases flexibly
    const institutionalCode = rawInstitutionalCode || rawSchoolCode || rawCode;
    const schoolName = rawSchoolName || rawName;

    if (
      !institutionalCode ||
      !schoolName ||
      !address ||
      !headName ||
      !headEmail ||
      !headPhone ||
      !password ||
      !Array.isArray(unitAllocations) ||
      unitAllocations.length === 0
    ) {
      return error(res, {
        statusCode: 400,
        code: "VALIDATION_ERROR",
        message:
          "institutionalCode, schoolName, address, headName, headEmail, headPhone, password and a non-empty unitAllocations[] are required.",
      });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: headEmail } });
    if (existingUser) {
      return error(res, {
        statusCode: 409,
        code: "DUPLICATE_ENTRY",
        message: "A user with this email already exists.",
      });
    }

    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const school = await prisma.$transaction(async (tx) => {
      // Resolve each unitName to an existing Unit — fail fast if a name doesn't exist.
      const resolvedUnits = [];
      for (const allocation of unitAllocations) {
        const unit = await tx.unit.findFirst({ where: { name: allocation.unitName } });
        if (!unit) {
          const notFoundErr = new Error(`Unit "${allocation.unitName}" does not exist.`);
          notFoundErr.statusCode = 404;
          notFoundErr.code = "UNIT_NOT_FOUND";
          throw notFoundErr;
        }
        resolvedUnits.push({ unitId: unit.id, studentCount: allocation.studentCount || 0 });
      }

      const user = await tx.user.create({
        data: {
          email: headEmail,
          password: hashedPassword,
          role: "SCHOOL_HEAD",
          isSchool: true,
        },
      });

      return tx.school.create({
        data: {
          code: institutionalCode,
          name: schoolName,
          address,
          headName,
          headDesignation: headDesignation || "Principal",
          headEmail,
          headPhone,
          userId: user.id,
          unitAllocations: {
            create: resolvedUnits,
          },
        },
        include: {
          unitAllocations: { include: { unit: true } },
          orders: { select: { totalAmount: true } },
        },
      });
    });

    return success(res, { data: serialize(school), statusCode: 201 });
  } catch (err) {
    return next(err);
  }
}

// PUT /api/admin/schools/:id
async function updateSchool(req, res, next) {
  try {
    const { id } = req.params;
    const { schoolName, address, headName, headDesignation, headEmail, headPhone, unitAllocations } = req.body;

    const school = await prisma.$transaction(async (tx) => {
      if (Array.isArray(unitAllocations)) {
        await tx.schoolUnitAllocation.deleteMany({ where: { schoolId: id } });

        for (const allocation of unitAllocations) {
          const unit = await tx.unit.findFirst({ where: { name: allocation.unitName } });
          if (!unit) {
            const notFoundErr = new Error(`Unit "${allocation.unitName}" does not exist.`);
            notFoundErr.statusCode = 404;
            notFoundErr.code = "UNIT_NOT_FOUND";
            throw notFoundErr;
          }
          await tx.schoolUnitAllocation.create({
            data: { schoolId: id, unitId: unit.id, studentCount: allocation.studentCount || 0 },
          });
        }
      }

      return tx.school.update({
        where: { id },
        data: {
          ...(schoolName !== undefined && { name: schoolName }),
          ...(address !== undefined && { address }),
          ...(headName !== undefined && { headName }),
          ...(headDesignation !== undefined && { headDesignation }),
          ...(headEmail !== undefined && { headEmail }),
          ...(headPhone !== undefined && { headPhone }),
        },
        include: {
          unitAllocations: { include: { unit: true } },
          orders: { select: { totalAmount: true } },
        },
      });
    });

    return success(res, { data: serialize(school) });
  } catch (err) {
    return next(err);
  }
}

module.exports = { getSchools, getSchoolById, createSchool, updateSchool };
