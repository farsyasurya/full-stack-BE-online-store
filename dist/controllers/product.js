"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllProducts = void 0;
exports.createProduct = createProduct;
exports.getMyProducts = getMyProducts;
exports.updateProduct = updateProduct;
exports.softDeleteProduct = softDeleteProduct;
exports.restoreProduct = restoreProduct;
exports.hardDeleteProduct = hardDeleteProduct;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Buat produk (admin only)
function createProduct(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== "admin") {
            res.status(403).json({ message: "Hanya admin yang bisa membuat produk" });
            return;
        }
        const { name, price } = req.body;
        const image = (_b = req.file) === null || _b === void 0 ? void 0 : _b.filename;
        if (!image) {
            res.status(400).json({ message: "Gambar produk harus diisi" });
            return;
        }
        try {
            const product = yield prisma.product.create({
                data: {
                    name,
                    price: Number(price),
                    image,
                    userId: req.user.id,
                },
            });
            res.status(201).json({ message: "Produk berhasil dibuat", product });
        }
        catch (err) {
            next(err);
        }
    });
}
//get my product khusus admin
function getMyProducts(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.user || req.user.role !== "admin") {
            res
                .status(403)
                .json({ message: "Hanya admin yang bisa melihat produk sendiri" });
            return;
        }
        try {
            const products = yield prisma.product.findMany({
                where: {
                    userId: req.user.id,
                },
            });
            res.json({ message: "Daftar produk milik admin", products });
        }
        catch (err) {
            next(err);
        }
    });
}
//update product
function updateProduct(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const productId = Number(req.params.id);
        const { name, price } = req.body;
        const image = (_a = req.file) === null || _a === void 0 ? void 0 : _a.filename;
        if (!req.user || req.user.role !== "admin") {
            res.status(403).json({ message: "Hanya admin yang bisa mengubah produk" });
            return;
        }
        try {
            const product = yield prisma.product.findUnique({
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
            const updated = yield prisma.product.update({
                where: { id: productId },
                data: {
                    name: name !== null && name !== void 0 ? name : product.name,
                    price: price ? Number(price) : product.price,
                    image: image !== null && image !== void 0 ? image : product.image,
                },
            });
            res.json({
                message: "Produk berhasil diperbarui",
                product: updated,
            });
            return;
        }
        catch (err) {
            next(err);
        }
    });
}
//soft delete
function softDeleteProduct(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        const productId = Number(req.params.id);
        if (!req.user || req.user.role !== "admin") {
            res.status(403).json({ message: "Hanya admin yang bisa menghapus produk" });
            return;
        }
        try {
            const product = yield prisma.product.findUnique({
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
            const deleted = yield prisma.product.update({
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
        }
        catch (err) {
            next(err);
        }
    });
}
//restore
function restoreProduct(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = req.params;
        const product = yield prisma.product.findUnique({
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
            const product = yield prisma.product.update({
                where: { id: Number(id) },
                data: {
                    deletedAt: null,
                },
            });
            res.json({ message: "Produk berhasil di-restore", product });
            return;
        }
        catch (err) {
            next(err);
        }
    });
}
function hardDeleteProduct(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        const productId = Number(req.params.id);
        if (!req.user || req.user.role !== "admin") {
            res.status(403).json({
                message: "Hanya admin yang bisa menghapus produk secara permanen",
            });
            return;
        }
        try {
            const product = yield prisma.product.findUnique({
                where: { id: productId },
            });
            if (!product) {
                res.status(404).json({ message: "Produk tidak ditemukan" });
                return;
            }
            if (product.userId !== req.user.id) {
                res.status(403).json({
                    message: "Anda tidak punya akses untuk menghapus produk ini secara permanen",
                });
                return;
            }
            yield prisma.order.deleteMany({
                where: { productId },
            });
            // 🔥 Hapus produk
            yield prisma.product.delete({
                where: { id: productId },
            });
            res.json({ message: "Produk berhasil dihapus secara permanen" });
        }
        catch (err) {
            next(err);
        }
    });
}
const getAllProducts = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page = "1", limit = "8", search = "", sortBy = "id", order = "desc", minPrice, maxPrice, } = req.query;
        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);
        const skip = (pageNumber - 1) * limitNumber;
        const validSortFields = ["id", "name", "price"];
        const sortField = validSortFields.includes(sortBy)
            ? sortBy
            : "id";
        const priceFilter = {};
        const parsedMin = parseInt(minPrice);
        const parsedMax = parseInt(maxPrice);
        if (!isNaN(parsedMin))
            priceFilter.gte = parsedMin;
        if (!isNaN(parsedMax))
            priceFilter.lte = parsedMax;
        const products = yield prisma.product.findMany({
            where: {
                deletedAt: null,
                name: {
                    contains: search,
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
    }
    catch (err) {
        next(err);
    }
});
exports.getAllProducts = getAllProducts;
