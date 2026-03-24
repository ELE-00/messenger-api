// userController.test.js

const { getUserData, sendUserData, uploadProfilePic } = require("../src/controllers/userController");

jest.mock("cloudinary", () => ({
    v2: {
        uploader: {
            upload: jest.fn()
        }
    }
}));

const cloudinary = require("cloudinary").v2;


// ---- getUserData ----

describe("getUserData", () => {
    test("returns user data with safe fields", async () => {
        const mockUser = { id: 1, username: "bob", name: "Bob", bio: "Hello", profilepic: null, createdAt: new Date() };
        const prismaMock = {
            user: { findUnique: jest.fn().mockResolvedValue(mockUser) }
        };
        const req = { user: { id: 1 } };
        const res = { json: jest.fn() };

        await getUserData(prismaMock)(req, res);

        expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
            where: { id: 1 },
            select: { id: true, username: true, name: true, bio: true, profilepic: true, createdAt: true }
        });
        expect(res.json).toHaveBeenCalledWith(mockUser);
    });

    test("returns 500 on db error", async () => {
        const prismaMock = {
            user: { findUnique: jest.fn().mockRejectedValue(new Error("DB error")) }
        };
        const req = { user: { id: 1 } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

        await getUserData(prismaMock)(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});


// ---- uploadProfilePic ----

describe("uploadProfilePic", () => {
    test("returns 400 if no file uploaded", async () => {
        const prismaMock = {};
        const req = { user: { id: 1 }, file: null };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

        await uploadProfilePic(prismaMock)(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: "No file uploaded" });
    });

    test("returns 500 on cloudinary error", async () => {
        cloudinary.uploader.upload.mockRejectedValue(new Error("Cloudinary failed"));
        const prismaMock = {};
        const req = { user: { id: 1 }, file: { path: "/tmp/test.jpg" } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

        await uploadProfilePic(prismaMock)(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: "Failed to upload image" });
    });

    test("updates profilepic on success", async () => {
        cloudinary.uploader.upload.mockResolvedValue({ secure_url: "https://cdn.example.com/pic.jpg" });
        const mockUpdatedUser = { id: 1, profilepic: "https://cdn.example.com/pic.jpg" };
        const prismaMock = {
            user: { update: jest.fn().mockResolvedValue(mockUpdatedUser) }
        };
        const req = { user: { id: 1 }, file: { path: "/tmp/test.jpg" } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

        await uploadProfilePic(prismaMock)(req, res);

        expect(res.json).toHaveBeenCalledWith({
            success: true,
            profilepic: "https://cdn.example.com/pic.jpg",
            user: mockUpdatedUser
        });
    });
});
