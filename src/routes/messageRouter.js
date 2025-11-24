//messageRouter.js
const  {Router} = require("express");
const { getMessages, sendMessages } = require("../controllers/messageController");
const messageRouter = Router();

messageRouter.get("/", getMessages);
messageRouter.get("/", sendMessages);

module.exports = messageRouter;