//authRouter.js
const { Router } = require("express");
const prisma = require("../../script.js");
const { signup, login } = require("../controllers/authController");
const rateLimit = require("express-rate-limit");

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    message: { error: "Too many requests, please try again later" },
    standardHeaders: true,
    legacyHeaders: false
});

const authRouter = Router();

authRouter.post("/signup", authLimiter, signup(prisma));
authRouter.post("/login", authLimiter, login(prisma));

module.exports = authRouter;
