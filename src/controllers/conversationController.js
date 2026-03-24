const cloudinary = require('cloudinary').v2;

function getConversations(prisma) {
    return async (req, res) => {
        const userId = req.user.id;
        try {
            const conversations = await prisma.conversation.findMany({
                where: {
                    participants: { some: { userId } }
                },
                include: {
                    participants: { include: { user: true } }
                }
            });
            res.json(conversations);
        } catch (err) {
            res.status(500).json({ error: "Failed to fetch conversations" });
        }
    };
}


function createConversation(prisma) {
    return async (req, res) => {
        const userId = req.user.id;
        let { groupName, participants } = req.body;

        if (typeof participants === "string") {
            try {
                participants = JSON.parse(participants);
            } catch (err) {
                return res.status(400).json({ error: "Invalid participants format" });
            }
        }

        if (!Array.isArray(participants) || participants.length === 0) {
            return res.status(400).json({ error: "participants must be a non-empty array" });
        }

        // Ensure the requesting user is always included
        if (!participants.includes(userId)) {
            participants = [userId, ...participants];
        }

        const isGroup = participants.length > 2;
        let avatarUrl = null;

        try {
            if (isGroup && req.file) {
                const uploadResult = await cloudinary.uploader.upload(req.file.path, {
                    folder: "group_pics",
                    resource_type: "image"
                });
                avatarUrl = uploadResult.secure_url;
            }

            const newConversation = await prisma.conversation.create({
                data: {
                    type: isGroup ? "GROUP" : "DIRECT",
                    name: isGroup ? groupName : null,
                    avatar: avatarUrl
                }
            });

            await prisma.conversationParticipant.createMany({
                data: participants.map(pId => ({
                    conversationId: newConversation.id,
                    userId: pId
                }))
            });

            res.json({
                conversationId: newConversation.id,
                message: "Conversation created successfully"
            });
        } catch (err) {
            res.status(500).json({ error: "Failed to create conversation" });
        }
    };
}


function getMessages(prisma) {
    return async (req, res) => {
        const chatId = parseInt(req.params.id);
        const userId = req.user.id;

        try {
            const participant = await prisma.conversationParticipant.findFirst({
                where: { conversationId: chatId, userId }
            });

            if (!participant) {
                return res.status(403).json({ error: "Access denied" });
            }

            const messages = await prisma.message.findMany({
                where: { conversationId: chatId },
                orderBy: { createdAt: "asc" }
            });

            res.json(messages);
        } catch (err) {
            res.status(500).json({ error: "Failed to fetch messages" });
        }
    };
}


function sendMessage(prisma) {
    return async (req, res) => {
        const chatId = parseInt(req.params.id);
        const userId = req.user.id;
        const { content } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({ error: "Message content is required" });
        }

        if (content.length > 2000) {
            return res.status(400).json({ error: "Message too long (max 2000 characters)" });
        }

        try {
            const participant = await prisma.conversationParticipant.findFirst({
                where: { conversationId: chatId, userId }
            });

            if (!participant) {
                return res.status(403).json({ error: "Access denied" });
            }

            const newMessage = await prisma.message.create({
                data: { senderId: userId, content: content.trim(), conversationId: chatId }
            });

            res.json(newMessage);
        } catch (err) {
            res.status(500).json({ error: "Failed to send message" });
        }
    };
}


function getAllUsers(prisma) {
    return async (req, res) => {
        try {
            const users = await prisma.user.findMany({
                select: { id: true, name: true, username: true, profilepic: true }
            });
            res.json(users);
        } catch (err) {
            res.status(500).json({ error: "Failed to get users" });
        }
    };
}


module.exports = { getConversations, createConversation, getMessages, sendMessage, getAllUsers };
