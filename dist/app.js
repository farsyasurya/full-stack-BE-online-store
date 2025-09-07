"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const client_1 = require("@prisma/client");
const route_1 = require("./routes/route");
const route_2 = require("./routes/route");
const express_session_1 = __importDefault(require("express-session"));
const error_1 = require("./middlewares/error");
dotenv_1.default.config();
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
app.use((0, morgan_1.default)("dev"));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use("/uploads", express_1.default.static("src/uploads"));
app.use((0, express_session_1.default)({
    secret: "rahasia",
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: false, // true jika pakai https
        sameSite: "lax",
        maxAge: 1000 * 60 * 60,
    },
}));
app.use((0, cors_1.default)({
    origin: "http://localhost:5173",
    credentials: true,
}));
app.use("/uploads", express_1.default.static("uploads"));
app.use("/api/auth", route_1.router);
app.use("/api/products", route_2.productRouter);
app.get("/", (req, res) => {
    res.json({ message: "Welcome to FAR SHOP" });
});
app.use(error_1.errorHandler);
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
