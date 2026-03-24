// conversationController.test.js

const { getMessages, sendMessage, getAllUsers } = require("../src/controllers/conversationController");

// ---- getMessages ----

describe("getMessages", () => {
    test("returns 403 if user is not a participant", async () => {
        const prismaMock = {
            conversationParticipant: {
                findFirst: jest.fn().mockResolvedValue(null)
            }
        };
        const req = { params: { id: "5" }, user: { id: 1 } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

        await getMessages(prismaMock)(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ error: "Access denied" });
    });

    test("returns messages for valid participant", async () => {
        const mockMessages = [
            { id: 1, content: "Hello", senderId: 1 },
            { id: 2, content: "Hi", senderId: 2 }
        ];
        const prismaMock = {
            conversationParticipant: {
                findFirst: jest.fn().mockResolvedValue({ id: 1 })
            },
            message: {
                findMany: jest.fn().mockResolvedValue(mockMessages)
            }
        };
        const req = { params: { id: "5" }, user: { id: 1 } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

        await getMessages(prismaMock)(req, res);

        expect(res.json).toHaveBeenCalledWith(mockMessages);
    });
});


// ---- sendMessage ----

describe("sendMessage", () => {
    test("returns 400 if content is empty", async () => {
        const prismaMock = {};
        const req = { params: { id: "5" }, user: { id: 1 }, body: { content: "   " } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

        await sendMessage(prismaMock)(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: "Message content is required" });
    });

    test("returns 400 if content exceeds 2000 characters", async () => {
        const prismaMock = {};
        const req = { params: { id: "5" }, user: { id: 1 }, body: { content: "a".repeat(2001) } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

        await sendMessage(prismaMock)(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: "Message too long (max 2000 characters)" });
    });

    test("returns 403 if user is not a participant", async () => {
        const prismaMock = {
            conversationParticipant: {
                findFirst: jest.fn().mockResolvedValue(null)
            }
        };
        const req = { params: { id: "5" }, user: { id: 1 }, body: { content: "Hello" } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

        await sendMessage(prismaMock)(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ error: "Access denied" });
    });

    test("creates message for valid participant", async () => {
        const mockMessage = { id: 10, senderId: 1, content: "Hello", conversationId: 5 };
        const prismaMock = {
            conversationParticipant: {
                findFirst: jest.fn().mockResolvedValue({ id: 1 })
            },
            message: {
                create: jest.fn().mockResolvedValue(mockMessage)
            }
        };
        const req = { params: { id: "5" }, user: { id: 1 }, body: { content: "Hello" } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

        await sendMessage(prismaMock)(req, res);

        expect(prismaMock.message.create).toHaveBeenCalledWith({
            data: { senderId: 1, content: "Hello", conversationId: 5 }
        });
        expect(res.json).toHaveBeenCalledWith(mockMessage);
    });
});


// ---- getAllUsers ----

describe("getAllUsers", () => {
    test("returns only safe user fields", async () => {
        const mockUsers = [
            { id: 1, name: "Bob", username: "bob", profilepic: null },
            { id: 2, name: "Alice", username: "alice", profilepic: "https://cdn.example.com/pic.jpg" }
        ];
        const prismaMock = {
            user: {
                findMany: jest.fn().mockResolvedValue(mockUsers)
            }
        };
        const req = {};
        const res = { json: jest.fn() };

        await getAllUsers(prismaMock)(req, res);

        expect(prismaMock.user.findMany).toHaveBeenCalledWith({
            select: { id: true, name: true, username: true, profilepic: true }
        });
        expect(res.json).toHaveBeenCalledWith(mockUsers);
    });
});
