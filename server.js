// server.js
console.log("SERVER MODE:", process.env.NODE_ENV)

const express = require("express");
const cors = require("cors");
const cloudinary = require('cloudinary').v2;
require("dotenv").config();


// Configure Cloudinary
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const authRouter = require("./src/routes/authRouter.js");
const conversationRouter = require("./src/routes/conversationRouter.js");
const userRouter = require("./src/routes/userRouter.js");
const authenticationToken = require("./middleware/authenticateToken.js");


const app = express();

app.use(cors());
app.use(express.json());

 
//public routes
app.use("/api/auth", authRouter);

//Protected routes
app.use("/api/conversations", authenticationToken, conversationRouter);
app.use("/api/user", authenticationToken, userRouter);


app.listen(3000, () => console.log("API running at localhost 3000"));


