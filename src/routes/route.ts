import express from "express";
import { upload } from "../config/multer";
import {
  loginAdmin,
  loginUser,
  registerAdmin,
  registerUser,
  testAktif,
} from "../controllers/auth";
import {
  createProduct,
  getAllProducts,
  getMyProducts,
  restoreProduct,
  softDeleteProduct,
  updateProduct,
} from "../controllers/product";
import { authenticate } from "../middlewares/auth";
import { getSaldo, orderProduct } from "../controllers/order";

export const router = express.Router();
export const productRouter = express.Router();

router.post("/register", upload.single("profile"), registerUser);
router.post("/login", loginUser);
router.post("/register/admin", upload.single("profile"), registerAdmin);
router.post("/login/admin", loginAdmin);
router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("token");
    res.json({ message: "Logged out" });
  });
});
router.get("/me", authenticate, testAktif);
router.get("/me/saldo", authenticate, getSaldo);

productRouter.post(
  "/create",
  authenticate,
  upload.single("image"),
  createProduct
);
productRouter.get("/mine", authenticate, getMyProducts);
productRouter.put("/:id", authenticate, upload.single("image"), updateProduct);
productRouter.delete("/:id", authenticate, softDeleteProduct);
productRouter.patch("/restore/:id", authenticate, restoreProduct);
productRouter.get("/all-products", authenticate, getAllProducts);
productRouter.post("/order", authenticate, orderProduct);
