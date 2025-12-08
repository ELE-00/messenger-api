// server.js
console.log("SERVER MODE:", process.env.NODE_ENV)

const express = require("express");
const cors = require("cors");
const cloudinary = require('cloudinary').v2;
require("dotenv").config();
const { Server } = require("socket.io");
const http = require("http");


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
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", // frontend URL
        methods: ["GET", "POST"]
    }
});

//--------- SOCKET.IO ONLINE STATUS ------------------//

const onlineUsers = new Map();

io.on("connection", (socket) =>{
    console.log("Socket connected: ", socket.id);

    socket.on("user-online", (userId) => {
        onlineUsers.set(userId, socket.id);
        io.emit("online-users", [...onlineUsers.keys()]);
    });

    socket.on("disconnect", () => {
        for (const [userId, sId] of onlineUsers.entries()) {
            if(sId === socket.id) onlineUsers.delete(userId);
        }
        io.emit("online-users", [...onlineUsers.keys()])
    });
});


//--------------------------------------------------//


app.use(cors());
app.use(express.json());

 
//public routes
app.use("/api/auth", authRouter);

//Protected routes
app.use("/api/conversations", authenticationToken, conversationRouter);
app.use("/api/user", authenticationToken, userRouter);


server.listen(3000, () => console.log("API + Socket.IO running at localhost 3000"));


