//messageRouter.js
const  {Router} = require("express");
const prisma = require("./script.js")
const { getMessages, sendMessage } = require("../controllers/messageController");
const messageRouter = Router();

messageRouter.get("/", getMessages(prisma));

messageRouter.get("/", sendMessage(prisma));

module.exports = messageRouter;