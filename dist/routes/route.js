"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.productRouter = exports.router = void 0;
const express_1 = __importDefault(require("express"));
const multer_1 = require("../config/multer");
const auth_1 = require("../controllers/auth");
const product_1 = require("../controllers/product");
const auth_2 = require("../middlewares/auth");
const order_1 = require("../controllers/order");
exports.router = express_1.default.Router();
exports.productRouter = express_1.default.Router();
exports.router.post("/register", multer_1.upload.single("profile"), auth_1.registerUser);
exports.router.post("/login", auth_1.loginUser);
exports.router.post("/register/admin", multer_1.upload.single("profile"), auth_1.registerAdmin);
exports.router.post("/login/admin", auth_1.loginAdmin);
exports.router.get("/user/profile", auth_2.authenticate, auth_1.getProfile);
exports.router.post("/logout", (req, res) => {
    req.session.destroy(() => {
        res.clearCookie("token");
        res.json({ message: "Logged out" });
    });
});
exports.router.get("/me", auth_2.authenticate, auth_1.testAktif);
exports.router.get("/me/saldo", auth_2.authenticate, order_1.getSaldo);
exports.productRouter.post("/create", auth_2.authenticate, multer_1.upload.single("image"), product_1.createProduct);
exports.productRouter.get("/order/me", auth_2.authenticate, order_1.getOrdersToMe);
exports.productRouter.get("/mine", auth_2.authenticate, product_1.getMyProducts);
exports.productRouter.put("/:id", auth_2.authenticate, multer_1.upload.single("image"), product_1.updateProduct);
exports.productRouter.delete("/:id", auth_2.authenticate, product_1.softDeleteProduct);
exports.productRouter.patch("/restore/:id", auth_2.authenticate, product_1.restoreProduct);
exports.productRouter.delete("/hard-delete/:id", auth_2.authenticate, product_1.hardDeleteProduct);
exports.productRouter.get("/all-products", auth_2.authenticate, product_1.getAllProducts);
exports.productRouter.post("/order", auth_2.authenticate, order_1.orderProduct);
exports.productRouter.get("/order/my", auth_2.authenticate, order_1.getMyOrders);
