import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthRequest, JWT_SECRET } from "./auth";

export function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  const token =
    authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : req.cookies.token || req.session?.token;
  console.log("📦 Token yang diterima:", token);

  if (!token) {
    return res.status(401).json({ message: "Silakan login terlebih dahulu" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    return res
      .status(401)
      .json({ message: "Token tidak valid atau kadaluarsa" });
  }
}
