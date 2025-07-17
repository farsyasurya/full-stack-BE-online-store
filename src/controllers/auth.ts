/// <reference types="../types/express-session" />
import { Request, Response } from "express";
import { PrismaClient } from "../generated/prisma";
import { hashPassword, comparePassword } from "../utils/hash";
import { generateToken } from "../utils/jwt";
import { AuthRequest } from "../middlewares/auth";
import { authenticate } from "../middlewares/authenticate";

const prisma = new PrismaClient();

// ---------- REGISTER ----------
export async function registerUser(req: Request, res: Response) {
  const { email, password } = req.body;

  const profile = req.file?.filename;

  if (!email || !password) {
    res.status(400).json({ message: "Field wajib diisi semua" });
    return;
  }

  const exist = await prisma.user.findUnique({ where: { email } });
  if (exist) {
    res.status(400).json({ message: "Email sudah terdaftar" });
    return;
  }

  const hashed = await hashPassword(password);

  const user = await prisma.user.create({
    data: { email, password: hashed, profile: profile, role: "user" },
  });

  res.status(201).json({
    message: "Register user berhasil",
    user: { id: user.id, email: user.email, role: user.role },
  });
  return;
}

export async function registerAdmin(req: Request, res: Response) {
  const { name, email, password } = req.body;
  const profile = req.file?.filename;

  const exist = await prisma.user.findUnique({ where: { email } });
  if (exist) {
    res.status(400).json({ message: "Email sudah terdaftar" });
    return;
  }

  const hashed = await hashPassword(password);

  const admin = await prisma.user.create({
    data: { email, password: hashed, profile, role: "admin" },
  });

  res.status(201).json({
    message: "Register admin berhasil",
    admin: { id: admin.id, email: admin.email, role: admin.role },
  });
  return;
}

// ---------- LOGIN ----------
export async function loginUser(req: Request, res: Response) {
  const { email, password } = req.body;
  console.log(`fe : ${email}, ${password}`);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.role !== "user") {
    res.status(404).json({ message: "User tidak ditemukan" });
    return;
  }

  const match = await comparePassword(password, user.password);
  if (!match) {
    res.status(401).json({ message: "Password salah" });
    return;
  }

  const token = generateToken({ id: user.id, role: user.role });

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
}

export async function loginAdmin(req: Request, res: Response) {
  const { email, password } = req.body;

  const admin = await prisma.user.findUnique({ where: { email } });
  if (!admin || admin.role !== "admin") {
    res.status(404).json({ message: "Admin tidak ditemukan" });
    return;
  }

  const match = await comparePassword(password, admin.password);
  if (!match) {
    res.status(401).json({ message: "Password salah" });
    return;
  }

  const token = generateToken({ id: admin.id, role: admin.role });

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
}

export async function testAktif(req: AuthRequest, res: Response) {
  res.json({
    message: "User aktif",
    user: req.user,
  });
}

export async function getProfile(req: AuthRequest, res: Response) {
  const user = await prisma.user.findUnique({
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
}
