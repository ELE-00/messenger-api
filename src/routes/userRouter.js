//conversationRouter.js
const  {Router} = require("express");
const prisma = require("../../script.js")
const {getUserData, sendUserData, uploadProfilePic } = require("../controllers/userController.js");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

const userRouter = Router();

//Get all conversations 
userRouter.get("/", getUserData(prisma));

//created a new conversation
userRouter.post("/", sendUserData(prisma));

userRouter.post("/profilepic", upload.single("profilepic"), uploadProfilePic(prisma));

module.exports = userRouter;