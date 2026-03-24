// socket.test.js
// Integration tests for Socket.IO events

const { createServer } = require("http");
const { Server } = require("socket.io");
const { io: Client } = require("socket.io-client");

// Minimal server setup mirroring server.js socket logic
function createTestServer(prismaOverride = {}) {
    const httpServer = createServer();
    const io = new Server(httpServer, { cors: { origin: "*" } });

    const onlineUsers = new Map();
    const defaultPrisma = {
        conversationParticipant: { findFirst: jest.fn().mockResolvedValue({ id: 1 }) },
        message: { create: jest.fn().mockResolvedValue({ id: 99, content: "test", senderId: 1, conversationId: 5 }) },
        ...prismaOverride
    };

    io.use((socket, next) => {
        // Simplified auth for tests: accept any token, set userId from query
        const token = socket.handshake.auth?.token;
        if (!token) return next(new Error("Missing token"));
        socket.data.user = { id: socket.handshake.auth.userId || 1, username: "testuser" };
        next();
    });

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

        socket.on("join-room", (conversationId) => socket.join(String(conversationId)));
        socket.on("leave-room", (conversationId) => socket.leave(String(conversationId)));

        socket.on("typing", ({ chatId }) => {
            socket.to(String(chatId)).emit("user-typing", { userId });
        });

        socket.on("stop-typing", ({ chatId }) => {
            socket.to(String(chatId)).emit("user-stop-typing", { userId });
        });

        socket.on("send-message", async ({ chatId, content }) => {
            if (!content || !content.trim()) return;
            try {
                const participant = await defaultPrisma.conversationParticipant.findFirst({
                    where: { conversationId: parseInt(chatId), userId }
                });
                if (!participant) {
                    socket.emit("message-error", { error: "Not a participant" });
                    return;
                }
                const message = await defaultPrisma.message.create({
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

    return { httpServer, io, defaultPrisma };
}

function connectClient(port, userId = 1) {
    return new Promise((resolve) => {
        const client = Client(`http://localhost:${port}`, {
            auth: { token: "test-token", userId }
        });
        client.on("connect", () => resolve(client));
    });
}


describe("Socket.IO - user-online / user-offline", () => {
    let httpServer, io, port, client;

    beforeAll((done) => {
        ({ httpServer, io } = createTestServer());
        httpServer.listen(() => {
            port = httpServer.address().port;
            done();
        });
    });

    afterAll(() => {
        io.close();
        httpServer.close();
    });

    afterEach(() => {
        if (client?.connected) client.disconnect();
    });

    test("broadcasts online-users when user comes online", (done) => {
        connectClient(port, 1).then((c) => {
            client = c;
            client.on("online-users", (list) => {
                expect(list).toContain(1);
                done();
            });
            client.emit("user-online");
        });
    });

    test("removes user from online list on user-offline", (done) => {
        connectClient(port, 2).then((c) => {
            client = c;
            client.emit("user-online");
            setTimeout(() => {
                client.on("online-users", (list) => {
                    expect(list).not.toContain(2);
                    done();
                });
                client.emit("user-offline");
            }, 50);
        });
    });
});


describe("Socket.IO - send-message", () => {
    let httpServer, io, port, defaultPrisma, client;

    beforeAll((done) => {
        ({ httpServer, io, defaultPrisma } = createTestServer());
        httpServer.listen(() => {
            port = httpServer.address().port;
            done();
        });
    });

    afterAll(() => {
        io.close();
        httpServer.close();
    });

    afterEach(() => {
        if (client?.connected) client.disconnect();
    });

    test("emits new-message to room on valid send", (done) => {
        connectClient(port, 1).then((c) => {
            client = c;
            client.emit("join-room", 5);
            client.on("new-message", (msg) => {
                expect(msg).toMatchObject({ content: "test", senderId: 1 });
                done();
            });
            setTimeout(() => client.emit("send-message", { chatId: 5, content: "test" }), 50);
        });
    });

    test("emits message-error when not a participant", (done) => {
        const { httpServer: hs2, io: io2, defaultPrisma: p2 } = createTestServer({
            conversationParticipant: { findFirst: jest.fn().mockResolvedValue(null) }
        });
        hs2.listen(() => {
            const port2 = hs2.address().port;
            connectClient(port2, 1).then((c2) => {
                c2.on("message-error", (err) => {
                    expect(err.error).toBe("Not a participant");
                    c2.disconnect();
                    io2.close();
                    hs2.close();
                    done();
                });
                c2.emit("send-message", { chatId: 5, content: "Hello" });
            });
        });
    });
});


describe("Socket.IO - typing indicators", () => {
    let httpServer, io, port, client1, client2;

    beforeAll((done) => {
        ({ httpServer, io } = createTestServer());
        httpServer.listen(() => {
            port = httpServer.address().port;
            done();
        });
    });

    afterAll(() => {
        io.close();
        httpServer.close();
    });

    afterEach(() => {
        if (client1?.connected) client1.disconnect();
        if (client2?.connected) client2.disconnect();
    });

    test("user-typing is broadcast to room members", (done) => {
        Promise.all([connectClient(port, 1), connectClient(port, 2)]).then(([c1, c2]) => {
            client1 = c1;
            client2 = c2;

            client2.emit("join-room", 10);
            client1.emit("join-room", 10);

            client2.on("user-typing", ({ userId }) => {
                expect(userId).toBe(1);
                done();
            });

            setTimeout(() => client1.emit("typing", { chatId: 10 }), 50);
        });
    });
});
