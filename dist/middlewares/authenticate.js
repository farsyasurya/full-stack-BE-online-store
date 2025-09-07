"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_1 = require("./auth");
function authenticate(req, res, next) {
    var _a;
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : req.cookies.token || ((_a = req.session) === null || _a === void 0 ? void 0 : _a.token);
    console.log("📦 Token yang diterima:", token);
    if (!token) {
        return res.status(401).json({ message: "Silakan login terlebih dahulu" });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, auth_1.JWT_SECRET);
        req.user = decoded;
        return next();
    }
    catch (err) {
        return res
            .status(401)
            .json({ message: "Token tidak valid atau kadaluarsa" });
    }
}
