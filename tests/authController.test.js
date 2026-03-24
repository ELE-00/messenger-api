// authController.test.js

const { signup, login } = require("../src/controllers/authController");

jest.mock("bcrypt", () => ({
    hash: jest.fn().mockResolvedValue("hashedPassword"),
    compare: jest.fn()
}));

jest.mock("jsonwebtoken", () => ({
    sign: jest.fn(() => "mockedToken")
}));

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");


// ---- signup ----

describe("signup", () => {
    test("returns 400 if fields are missing", async () => {
        const prismaMock = { user: { findUnique: jest.fn() } };
        const req = { body: { username: "bob", password: "secret" } }; // missing passwordConfirm
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

        await signup(prismaMock)(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: "All fields are required" });
    });

    test("returns 400 if password too short", async () => {
        const prismaMock = { user: { findUnique: jest.fn() } };
        const req = { body: { username: "bob", password: "abc", passwordConfirm: "abc" } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

        await signup(prismaMock)(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: "Password must be at least 6 characters" });
    });

    test("returns 400 if passwords do not match", async () => {
        const prismaMock = { user: { findUnique: jest.fn() } };
        const req = { body: { username: "bob", password: "secret1", passwordConfirm: "secret2" } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

        await signup(prismaMock)(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: "Passwords do not match" });
    });

    test("returns 409 if username already taken", async () => {
        const prismaMock = {
            user: { findUnique: jest.fn().mockResolvedValue({ id: 1, username: "bob" }) }
        };
        const req = { body: { username: "bob", password: "secret1", passwordConfirm: "secret1" } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

        await signup(prismaMock)(req, res);

        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith({ error: "Username already taken" });
    });

    test("creates user and returns 201 on success", async () => {
        const prismaMock = {
            user: {
                findUnique: jest.fn().mockResolvedValue(null),
                create: jest.fn().mockResolvedValue({ id: 1, username: "bob" })
            }
        };
        const req = { body: { username: "bob", password: "secret1", passwordConfirm: "secret1" } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

        await signup(prismaMock)(req, res);

        expect(prismaMock.user.create).toHaveBeenCalledWith({
            data: { username: "bob", name: "bob", password: "hashedPassword" }
        });
        expect(res.status).toHaveBeenCalledWith(201);
    });
});


// ---- login ----

describe("login", () => {
    test("returns 400 if user not found", async () => {
        const prismaMock = {
            user: { findUnique: jest.fn().mockResolvedValue(null) }
        };
        const req = { body: { username: "ghost", password: "secret1" } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

        await login(prismaMock)(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: "Invalid credentials" });
    });

    test("returns 400 if password does not match", async () => {
        const prismaMock = {
            user: { findUnique: jest.fn().mockResolvedValue({ id: 1, username: "bob", password: "hashedPassword" }) }
        };
        const req = { body: { username: "bob", password: "wrongPassword" } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

        bcrypt.compare.mockResolvedValue(false);
        await login(prismaMock)(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: "Invalid credentials" });
    });

    test("returns token on successful login", async () => {
        const prismaMock = {
            user: { findUnique: jest.fn().mockResolvedValue({ id: 1, username: "bob", password: "hashedPassword" }) }
        };
        const req = { body: { username: "bob", password: "correctPassword" } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

        bcrypt.compare.mockResolvedValue(true);
        await login(prismaMock)(req, res);

        expect(jwt.sign).toHaveBeenCalledWith(
            { id: 1, username: "bob" },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            message: "Logged in",
            token: "mockedToken"
        }));
    });
});
