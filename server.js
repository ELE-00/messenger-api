// server.js

const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRouter = require("./routes/authRouter");
const messageRouter = require("./routes/messageRouter");
const authenticationToken = require("./middleware/authenticationToken");


const app = express();

app.use(cors());
app.use(express.json());

 
//public routes
app.use("/api/auth", authRouter);

//Protected routes
app.use("/api/messages", authenticationToken, messageRouter);


app.listen(3000, () => console.log("API running"));


