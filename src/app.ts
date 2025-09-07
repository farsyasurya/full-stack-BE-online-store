import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import { PrismaClient } from "@prisma/client";
import { router } from "./routes/route";
import { productRouter } from "./routes/route";
import session from "express-session";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middlewares/error";

dotenv.config();

const app = express();
const prisma = new PrismaClient();

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("src/uploads"));

app.use(
  session({
    secret: "rahasia",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // true jika pakai https
      sameSite: "lax",
      maxAge: 1000 * 60 * 60,
    },
  })
);

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use("/uploads", express.static("uploads"));

app.use("/api/auth", router);
app.use("/api/products", productRouter);

app.get("/", (req, res) => {
  res.json({ message: "Welcome to FAR SHOP" });
});

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
