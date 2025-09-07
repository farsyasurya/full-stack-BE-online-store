"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JWT_SECRET = void 0;
exports.authenticate = authenticate;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
exports.JWT_SECRET = process.env.JWT_SECRET || "jwt-secret";
function authenticate(req, res, next) {
    var _a;
    // BACA token dari cookie ATAU header Authorization
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : req.cookies.token || ((_a = req.session) === null || _a === void 0 ? void 0 : _a.token);
    console.log("📦 Token yang diterima:", token);
    if (!token) {
        res.status(401).json({ message: "Silakan login terlebih dahulu" });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, exports.JWT_SECRET);
        req.user = decoded;
        next();
        return;
    }
    catch (err) {
        res.status(401).json({ message: "Token tidak valid atau kadaluarsa" });
        return;
    }
}
