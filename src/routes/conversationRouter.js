//conversationRouter.js
const  {Router} = require("express");
const prisma = require("../../script.js")
const { getConversations, createConversation, getMessages, sendMessage, getAllUsers } = require("../controllers/conversationController.js");
const conversationRouter = Router();


//Get all conversations 
conversationRouter.get("/", getConversations(prisma));

//created a new conversation
conversationRouter.post("/", createConversation(prisma));

//get all users
conversationRouter.get("/users", getAllUsers(prisma));

//Get all conversation messages
conversationRouter.get("/:id", getMessages(prisma));

//create a message in a conversation
conversationRouter.post("/:id", sendMessage(prisma));



module.exports = conversationRouter;