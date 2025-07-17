import { AuthRequest } from "../middlewares/auth";
import { NextFunction, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
//cek saldo
export async function getSaldo(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { balance: true },
    });

    res.json({ message: "Saldo Anda Tersisa", balance: user?.balance || 0 });
    return;
  } catch (err: any) {
    next(err);
  }
}

//order
export async function orderProduct(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user?.id;
    const { productId } = req.body;

    if (!productId) {
      res.status(400).json({ message: "productId diperlukan" });
      return;
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { user: true },
    });

    if (!product || product.deletedAt) {
      res.status(404).json({ message: "Produk tidak ditemukan" });
      return;
    }

    const adminId = product.userId;
    const admin = product.user;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({ message: "User tidak ditemukan" });
      return;
    }

    if (user.balance < product.price) {
      res.status(400).json({ message: "Saldo tidak cukup" });
      return;
    }

    // Transaksi
    const [_, updatedUser] = await prisma.$transaction([
      prisma.order.create({
        data: {
          userId: userId!,
          productId,
          quantity: 1,
        },
      }),

      prisma.user.update({
        where: { id: userId },
        data: {
          balance: { decrement: product.price },
        },
      }),

      prisma.user.update({
        where: { id: adminId },
        data: {
          balance: { increment: product.price },
        },
      }),

      prisma.transfer.create({
        data: {
          senderId: userId!,
          receiverId: adminId,
          amount: product.price,
        },
      }),
    ]);

    res.json({
      message: "Order berhasil dan saldo ditransfer ke admin",
      detail: {
        produk: {
          nama: product.name,
          harga: product.price,
        },
        saldoDikirim: product.price,
        saldoSisaUser: updatedUser.balance,
        penerima: {
          id: admin.id,
          email: admin.email,
        },
      },
    });
  } catch (err: any) {
    next(err);
  }
}

//get my order

export async function getMyOrders(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user?.id;

    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        product: {
          select: {
            name: true,
            price: true,
            user: {
              // admin pemilik produk
              select: { email: true },
            },
          },
        },
      },
    });

    res.json({
      message: "Daftar order milik user",
      orders: orders.map((order) => ({
        id: order.id,
        tanggal: order.createdAt,
        produk: order.product.name,
        harga: order.product.price,
        admin: order.product.user.email,
      })),
    });
  } catch (err) {
    next(err);
  }
}
//yang order product kuu
export async function getOrdersToMe(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.user || req.user.role !== "admin") {
    res.status(403).json({ message: "Hanya admin yang bisa mengakses ini" });
    return;
  }

  try {
    const orders = await prisma.order.findMany({
      where: {
        product: {
          userId: req.user.id,
        },
      },
      include: {
        user: true,
        product: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formatted = orders.map((o) => ({
      id: o.id,
      tanggal: o.createdAt,
      produk: o.product.name,
      harga: o.product.price,
      pembeli: o.user.email,
    }));

    res.json({
      message: "Daftar order ke admin",
      orders: formatted,
    });
  } catch (err) {
    next(err);
  }
}
