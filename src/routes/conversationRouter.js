//conversationRouter.js
const { Router } = require("express");
const prisma = require("../../script.js");
const { getConversations, createConversation, getMessages, sendMessage, getAllUsers } = require("../controllers/conversationController.js");
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

const conversationRouter = Router();

conversationRouter.get("/", getConversations(prisma));
conversationRouter.post("/", (req, res, next) => {
    upload.single("groupprofilepic")(req, res, (err) => {
        if (err) {
            if (err.code === "LIMIT_FILE_SIZE") {
                return res.status(400).json({ error: "File too large. Maximum size is 5MB." });
            }
            return res.status(400).json({ error: err.message });
        }
        next();
    });
}, createConversation(prisma));
conversationRouter.get("/users", getAllUsers(prisma));
conversationRouter.get("/:id", getMessages(prisma));
conversationRouter.post("/:id", sendMessage(prisma));

module.exports = conversationRouter;
