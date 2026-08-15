const bcrypt = require("bcryptjs");
const prisma = require("../lib/prisma");
const { success, error, buildMeta, parsePagination } = require("../utils/response");

// GET /api/admin/delivery-persons
async function getDeliveryPersons(req, res, next) {
  try {
    const persons = await prisma.deliveryPerson.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { assignedOrders: { where: { status: "PENDING" } } },
        },
      },
    });

    const data = persons.map((p) => ({
      id: p.id,
      fullName: p.fullName,
      phone: p.phone,
      email: p.email,
      vehicleNo: p.vehicleNo,
      status: p.status,
      assignedOrdersCount: p._count.assignedOrders,
      createdAt: p.createdAt.toISOString().slice(0, 10),
    }));

    return res.json({ success: true, data });
  } catch (err) {
    return next(err);
  }
}

// POST /api/admin/delivery-persons
async function createDeliveryPerson(req, res, next) {
  try {
    const { fullName, phone, email, vehicleNo, password } = req.body;

    if (!fullName || !phone || !password) {
      return res.status(400).json({
        success: false,
        error: { message: "fullName, phone, and password are required." },
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userEmail = email || `${phone.replace(/\D/g, "")}@logistics.in`;

    // Create User & DeliveryPerson profile in transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: userEmail,
          password: hashedPassword,
          role: "DELIVERY_PERSON",
        },
      });

      const deliveryPerson = await tx.deliveryPerson.create({
        data: {
          userId: user.id,
          fullName,
          phone,
          email: userEmail,
          vehicleNo: vehicleNo || null,
          status: "ACTIVE",
        },
      });

      return deliveryPerson;
    });

    return res.status(201).json({ success: true, data: result });
  } catch (err) {
    return next(err);
  }
}

// PUT /api/admin/delivery-persons/:id
async function updateDeliveryPerson(req, res, next) {
  try {
    const { id } = req.params;
    const { fullName, phone, email, vehicleNo, password } = req.body;

    const person = await prisma.deliveryPerson.findUnique({ where: { id } });
    if (!person) return res.status(404).json({ success: false, message: "Agent not found." });

    const finalEmail = email || person.email;

    const updated = await prisma.$transaction(async (tx) => {
      const userUpdateData = {
        ...(email !== undefined && { email: finalEmail }),
      };

      if (password) {
        userUpdateData.password = await bcrypt.hash(password, 10);
      }

      if (Object.keys(userUpdateData).length > 0) {
        await tx.user.update({
          where: { id: person.userId },
          data: userUpdateData,
        });
      }

      return tx.deliveryPerson.update({
        where: { id },
        data: {
          fullName,
          phone,
          email: email !== undefined ? finalEmail : undefined,
          vehicleNo: vehicleNo || null,
        },
      });
    });

    return res.json({ success: true, data: updated });
  } catch (err) {
    return next(err);
  }
}

// DELETE /api/admin/delivery-persons/:id
async function deleteDeliveryPerson(req, res, next) {
  try {
    const { id } = req.params;
    const person = await prisma.deliveryPerson.findUnique({ where: { id } });
    if (person) {
      await prisma.user.delete({ where: { id: person.userId } });
    }
    return res.json({ success: true, message: "Delivery agent removed." });
  } catch (err) {
    return next(err);
  }
}

module.exports = { getDeliveryPersons, createDeliveryPerson, updateDeliveryPerson, deleteDeliveryPerson };