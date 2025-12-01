//authRouter.js
const  {Router} = require("express");
const prisma = require("../../script.js")
const { signup, login } = require("../controllers/authController");
const authRouter = Router();

authRouter.post("/signup", signup(prisma));
authRouter.post("/login", login(prisma));


module.exports = authRouter;


