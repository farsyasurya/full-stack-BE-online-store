import { NextFunction, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middlewares/auth";

const prisma = new PrismaClient();

// Buat produk (admin only)
export async function createProduct(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (req.user?.role !== "admin") {
    res.status(403).json({ message: "Hanya admin yang bisa membuat produk" });
    return;
  }

  const { name, price } = req.body;
  const image = req.file?.filename;

  if (!image) {
    res.status(400).json({ message: "Gambar produk harus diisi" });
    return;
  }

  try {
    const product = await prisma.product.create({
      data: {
        name,
        price: Number(price),
        image,
        userId: req.user.id,
      },
    });

    res.status(201).json({ message: "Produk berhasil dibuat", product });
  } catch (err: any) {
    next(err);
  }
}
//get my product khusus admin
export async function getMyProducts(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.user || req.user.role !== "admin") {
    res
      .status(403)
      .json({ message: "Hanya admin yang bisa melihat produk sendiri" });
    return;
  }

  try {
    const products = await prisma.product.findMany({
      where: {
        userId: req.user.id,
      },
    });

    res.json({ message: "Daftar produk milik admin", products });
  } catch (err: any) {
    next(err);
  }
}
//update product
export async function updateProduct(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const productId = Number(req.params.id);
  const { name, price } = req.body;
  const image = req.file?.filename;

  if (!req.user || req.user.role !== "admin") {
    res.status(403).json({ message: "Hanya admin yang bisa mengubah produk" });
    return;
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      res.status(404).json({ message: "Produk tidak ditemukan" });
      return;
    }

    if (product.userId !== req.user.id) {
      res.status(403).json({
        message: "Anda tidak memiliki izin untuk mengubah produk ini",
      });
      return;
    }

    const updated = await prisma.product.update({
      where: { id: productId },
      data: {
        name: name ?? product.name,
        price: price ? Number(price) : product.price,
        image: image ?? product.image,
      },
    });

    res.json({
      message: "Produk berhasil diperbarui",
      product: updated,
    });
    return;
  } catch (err: any) {
    next(err);
  }
}
//soft delete
export async function softDeleteProduct(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const productId = Number(req.params.id);

  if (!req.user || req.user.role !== "admin") {
    res.status(403).json({ message: "Hanya admin yang bisa menghapus produk" });
    return;
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      res.status(404).json({ message: "Produk tidak ditemukan" });
      return;
    }

    if (product.userId !== req.user.id) {
      res.status(403).json({ message: "Anda tidak punya akses ke produk ini" });
      return;
    }

    const deleted = await prisma.product.update({
      where: { id: productId },
      data: {
        deletedAt: new Date(),
      },
    });

    res.json({
      message: "Produk berhasil dihapus (soft delete)",
      product: deleted,
    });
    return;
  } catch (err: any) {
    next(err);
  }
}
//restore
export async function restoreProduct(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const { id } = req.params;

  const product = await prisma.product.findUnique({
    where: { id: Number(id) },
  });

  if (!product) {
    res.status(404).json({ message: "Produk tidak ditemukan" });
    return;
  }

  if (product.deletedAt === null) {
    res.status(400).json({ message: "Produk tidak ada di recycle bin" });
    return;
  }

  try {
    const product = await prisma.product.update({
      where: { id: Number(id) },
      data: {
        deletedAt: null,
      },
    });

    res.json({ message: "Produk berhasil di-restore", product });
    return;
  } catch (err: any) {
    next(err);
  }
}

export async function hardDeleteProduct(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const productId = Number(req.params.id);

  if (!req.user || req.user.role !== "admin") {
    res.status(403).json({
      message: "Hanya admin yang bisa menghapus produk secara permanen",
    });
    return;
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      res.status(404).json({ message: "Produk tidak ditemukan" });
      return;
    }

    if (product.userId !== req.user.id) {
      res.status(403).json({
        message:
          "Anda tidak punya akses untuk menghapus produk ini secara permanen",
      });
      return;
    }


    await prisma.order.deleteMany({
      where: { productId },
    });

    // 🔥 Hapus produk
    await prisma.product.delete({
      where: { id: productId },
    });

    res.json({ message: "Produk berhasil dihapus secara permanen" });
  } catch (err) {
    next(err);
  }
}

export const getAllProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      page = "1",
      limit = "8",
      search = "",
      sortBy = "id",
      order = "desc",
      minPrice,
      maxPrice,
    } = req.query;

    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);
    const skip = (pageNumber - 1) * limitNumber;
    const validSortFields = ["id", "name", "price"];
    const sortField = validSortFields.includes(sortBy as string)
      ? (sortBy as string)
      : "id";

    const priceFilter: any = {};
    const parsedMin = parseInt(minPrice as string);
    const parsedMax = parseInt(maxPrice as string);

    if (!isNaN(parsedMin)) priceFilter.gte = parsedMin;
    if (!isNaN(parsedMax)) priceFilter.lte = parsedMax;

    const products = await prisma.product.findMany({
      where: {
        deletedAt: null,
        name: {
          contains: search as string,
          mode: "insensitive",
        },
        price: Object.keys(priceFilter).length > 0 ? priceFilter : undefined,
      },
      orderBy: {
        [sortField]: order === "desc" ? "desc" : "asc",
      },
      skip,
      take: limitNumber,
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    res.json({ page: pageNumber, limit: limitNumber, data: products });
  } catch (err: any) {
    next(err);
  }
};
