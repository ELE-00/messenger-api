// messageController.test.js
// Tests for message-related functions in conversationController

const { sendMessage, getMessages } = require("../src/controllers/conversationController");


describe("sendMessage via HTTP", () => {
    test("saves message and returns it", async () => {
        const mockMessage = { id: 10, senderId: 1, content: "Hello!", conversationId: 5 };
        const prismaMock = {
            conversationParticipant: {
                findFirst: jest.fn().mockResolvedValue({ id: 1 })
            },
            message: {
                create: jest.fn().mockResolvedValue(mockMessage)
            }
        };

        const req = {
            user: { id: 1 },
            params: { id: "5" },
            body: { content: "Hello!" }
        };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

        await sendMessage(prismaMock)(req, res);

        expect(prismaMock.message.create).toHaveBeenCalledWith({
            data: { senderId: 1, content: "Hello!", conversationId: 5 }
        });
        expect(res.json).toHaveBeenCalledWith(mockMessage);
    });
});


describe("getMessages", () => {
    test("returns array of messages for participant", async () => {
        const mockMessages = [
            { id: 10, senderId: 1, content: "Hello!" },
            { id: 11, senderId: 2, content: "Hi!" }
        ];
        const prismaMock = {
            conversationParticipant: {
                findFirst: jest.fn().mockResolvedValue({ id: 1 })
            },
            message: {
                findMany: jest.fn().mockResolvedValue(mockMessages)
            }
        };

        const req = { user: { id: 1 }, params: { id: "5" } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

        await getMessages(prismaMock)(req, res);

        expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([
            expect.objectContaining({ content: "Hi!" })
        ]));
    });
});
