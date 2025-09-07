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
exports.getSaldo = getSaldo;
exports.orderProduct = orderProduct;
exports.getMyOrders = getMyOrders;
exports.getOrdersToMe = getOrdersToMe;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
//cek saldo
function getSaldo(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const user = yield prisma.user.findUnique({
                where: { id: req.user.id },
                select: { balance: true },
            });
            res.json({ message: "Saldo Anda Tersisa", balance: (user === null || user === void 0 ? void 0 : user.balance) || 0 });
            return;
        }
        catch (err) {
            next(err);
        }
    });
}
//order
function orderProduct(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            const { productId } = req.body;
            if (!productId) {
                res.status(400).json({ message: "productId diperlukan" });
                return;
            }
            const product = yield prisma.product.findUnique({
                where: { id: productId },
                include: { user: true },
            });
            if (!product || product.deletedAt) {
                res.status(404).json({ message: "Produk tidak ditemukan" });
                return;
            }
            const adminId = product.userId;
            const admin = product.user;
            const user = yield prisma.user.findUnique({
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
            const [_, updatedUser] = yield prisma.$transaction([
                prisma.order.create({
                    data: {
                        userId: userId,
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
                        senderId: userId,
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
        }
        catch (err) {
            next(err);
        }
    });
}
//get my order
function getMyOrders(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            const orders = yield prisma.order.findMany({
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
        }
        catch (err) {
            next(err);
        }
    });
}
//yang order product kuu
function getOrdersToMe(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.user || req.user.role !== "admin") {
            res.status(403).json({ message: "Hanya admin yang bisa mengakses ini" });
            return;
        }
        try {
            const orders = yield prisma.order.findMany({
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
        }
        catch (err) {
            next(err);
        }
    });
}
