//userRouter.js
const { Router } = require("express");
const prisma = require("../../script.js");
const { getUserData, sendUserData, uploadProfilePic } = require("../controllers/userController.js");
const multer = require("multer");

const imageFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
        cb(null, true);
    } else {
        cb(new Error("Only image files are allowed"), false);
    }
};

const upload = multer({
    dest: "uploads/",
    fileFilter: imageFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

const userRouter = Router();

userRouter.get("/", getUserData(prisma));
userRouter.post("/", sendUserData(prisma));
userRouter.post("/profilepic", upload.single("profilepic"), uploadProfilePic(prisma));

module.exports = userRouter;
