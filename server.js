// server.js
console.log("SERVER MODE:", process.env.NODE_ENV)

const express = require("express");
const cors = require("cors");
require("dotenv").config();


const authRouter = require("./src/routes/authRouter.js");
const conversationRouter = require("./src/routes/conversationRouter.js");
const authenticationToken = require("./middleware/authenticateToken.js");


const app = express();

app.use(cors());
app.use(express.json());

 
//public routes
app.use("/api/auth", authRouter);

//Protected routes
app.use("/api/conversations", authenticationToken, conversationRouter);



app.listen(3000, () => console.log("API running at localhost 3000"));


