import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import { PrismaClient } from "../src/generated/prisma";
import { router } from "./routes/route";
import { productRouter } from "./routes/route";
import session from "express-session";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middlewares/error";

dotenv.config();

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("src/uploads"));

app.use(cookieParser());
app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 }, // 1 jam
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
