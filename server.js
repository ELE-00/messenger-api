// server.js

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
const authenticateSocket = require("./middleware/authenticateSocket.js");
const prisma = require("./script.js");

const app = express();
const server = http.createServer(app);

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

const io = new Server(server, {
    cors: {
        origin: FRONTEND_URL,
        methods: ["GET", "POST"]
    }
});

//--------- SOCKET.IO ------------------//

const onlineUsers = new Map();

io.use(authenticateSocket);

io.on("connection", (socket) => {
    const userId = socket.data.user.id;

    socket.on("user-online", () => {
        onlineUsers.set(userId, socket.id);
        io.emit("online-users", [...onlineUsers.keys()]);
    });

    socket.on("user-offline", () => {
        onlineUsers.delete(userId);
        io.emit("online-users", [...onlineUsers.keys()]);
    });

    socket.on("join-room", (conversationId) => {
        socket.join(String(conversationId));
    });

    socket.on("leave-room", (conversationId) => {
        socket.leave(String(conversationId));
    });

    socket.on("typing", ({ chatId }) => {
        socket.to(String(chatId)).emit("user-typing", { userId });
    });

    socket.on("stop-typing", ({ chatId }) => {
        socket.to(String(chatId)).emit("user-stop-typing", { userId });
    });

    socket.on("send-message", async ({ chatId, content }) => {
        if (!content || !content.trim()) return;
        if (content.length > 2000) return;

        try {
            const participant = await prisma.conversationParticipant.findFirst({
                where: { conversationId: parseInt(chatId), userId }
            });

            if (!participant) {
                socket.emit("message-error", { error: "Not a participant in this conversation" });
                return;
            }

            const message = await prisma.message.create({
                data: { content: content.trim(), senderId: userId, conversationId: parseInt(chatId) }
            });

            io.to(String(chatId)).emit("new-message", message);
        } catch (err) {
            socket.emit("message-error", { error: "Failed to send message" });
        }
    });

    socket.on("disconnect", () => {
        onlineUsers.delete(userId);
        io.emit("online-users", [...onlineUsers.keys()]);
    });
});

//--------------------------------------//

app.use(cors({ origin: FRONTEND_URL }));
app.use(express.json());

// Public routes
app.use("/api/auth", authRouter);

// Protected routes
app.use("/api/conversations", authenticationToken, conversationRouter);
app.use("/api/user", authenticationToken, userRouter);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`API + Socket.IO running on port ${PORT}`));
