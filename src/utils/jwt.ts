import jwt from "jsonwebtoken";

export function generateToken(payload: object): string {
  return jwt.sign(payload, process.env.JWT_SECRET || "jwt-secret", {
    expiresIn: "1h",
  });
}
