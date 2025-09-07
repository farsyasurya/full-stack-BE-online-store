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
exports.registerUser = registerUser;
exports.registerAdmin = registerAdmin;
exports.loginUser = loginUser;
exports.loginAdmin = loginAdmin;
exports.testAktif = testAktif;
exports.getProfile = getProfile;
const client_1 = require("@prisma/client");
const hash_1 = require("../utils/hash");
const jwt_1 = require("../utils/jwt");
const prisma = new client_1.PrismaClient();
// ---------- REGISTER ----------
function registerUser(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const { email, password } = req.body;
        const profile = (_a = req.file) === null || _a === void 0 ? void 0 : _a.filename;
        if (!email || !password) {
            res.status(400).json({ message: "Field wajib diisi semua" });
            return;
        }
        const exist = yield prisma.user.findUnique({ where: { email } });
        if (exist) {
            res.status(400).json({ message: "Email sudah terdaftar" });
            return;
        }
        const hashed = yield (0, hash_1.hashPassword)(password);
        const user = yield prisma.user.create({
            data: { email, password: hashed, profile: profile, role: "user" },
        });
        res.status(201).json({
            message: "Register user berhasil",
            user: { id: user.id, email: user.email, role: user.role },
        });
        return;
    });
}
function registerAdmin(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const { name, email, password } = req.body;
        const profile = (_a = req.file) === null || _a === void 0 ? void 0 : _a.filename;
        const exist = yield prisma.user.findUnique({ where: { email } });
        if (exist) {
            res.status(400).json({ message: "Email sudah terdaftar" });
            return;
        }
        const hashed = yield (0, hash_1.hashPassword)(password);
        const admin = yield prisma.user.create({
            data: { email, password: hashed, profile, role: "admin" },
        });
        res.status(201).json({
            message: "Register admin berhasil",
            admin: { id: admin.id, email: admin.email, role: admin.role },
        });
        return;
    });
}
// ---------- LOGIN ----------
function loginUser(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { email, password } = req.body;
        console.log(`fe : ${email}, ${password}`);
        const user = yield prisma.user.findUnique({ where: { email } });
        if (!user || user.role !== "user") {
            res.status(404).json({ message: "User tidak ditemukan" });
            return;
        }
        const match = yield (0, hash_1.comparePassword)(password, user.password);
        if (!match) {
            res.status(401).json({ message: "Password salah" });
            return;
        }
        const token = (0, jwt_1.generateToken)({ id: user.id, role: user.role });
        req.session.token = token;
        res.cookie("token", token, {
            httpOnly: true,
            maxAge: 1000 * 60 * 60,
            sameSite: "lax",
            secure: false,
        });
        res.json({
            message: "Login user berhasil",
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
            },
        });
        return;
    });
}
function loginAdmin(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { email, password } = req.body;
        const admin = yield prisma.user.findUnique({ where: { email } });
        if (!admin || admin.role !== "admin") {
            res.status(404).json({ message: "Admin tidak ditemukan" });
            return;
        }
        const match = yield (0, hash_1.comparePassword)(password, admin.password);
        if (!match) {
            res.status(401).json({ message: "Password salah" });
            return;
        }
        const token = (0, jwt_1.generateToken)({ id: admin.id, role: admin.role });
        req.session.token = token;
        res.cookie("token", token, {
            httpOnly: true,
            maxAge: 1000 * 60 * 60,
            sameSite: "lax",
            secure: false,
        });
        res.json({
            message: "Login admin berhasil",
            token,
            admin: {
                id: admin.id,
                email: admin.email,
                role: admin.role,
            },
        });
        return;
    });
}
function testAktif(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        res.json({
            message: "User aktif",
            user: req.user,
        });
    });
}
function getProfile(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = yield prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                email: true,
                role: true,
                profile: true,
            },
        });
        if (!user) {
            res.status(404).json({ message: "User tidak ditemukan" });
            return;
        }
        res.json(user);
        return;
    });
}
