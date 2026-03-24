// authController.js
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

function signup(prisma) {
    return async (req, res) => {
        const { username, password, passwordConfirm } = req.body;

        if (!username || !password || !passwordConfirm) {
            return res.status(400).json({ error: "All fields are required" });
        }

        const trimmedUsername = username.trim();

        if (trimmedUsername.length < 3 || trimmedUsername.length > 30) {
            return res.status(400).json({ error: "Username must be between 3 and 30 characters" });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: "Password must be at least 6 characters" });
        }

        if (password !== passwordConfirm) {
            return res.status(400).json({ error: "Passwords do not match" });
        }

        try {
            const existing = await prisma.user.findUnique({ where: { username: trimmedUsername } });

            if (existing) {
                return res.status(409).json({ error: "Username already taken" });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const user = await prisma.user.create({
                data: { username: trimmedUsername, name: trimmedUsername, password: hashedPassword }
            });

            res.status(201).json({ message: "User created", user: { id: user.id, username: user.username } });
        } catch (err) {
            res.status(500).json({ error: "Failed to create account" });
        }
    };
}

function login(prisma) {
    return async (req, res) => {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: "Username and password are required" });
        }

        try {
            const user = await prisma.user.findUnique({ where: { username } });

            if (!user) return res.status(400).json({ error: "Invalid credentials" });

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ error: "Invalid credentials" });
            }

            const token = jwt.sign(
                { id: user.id, username: user.username },
                process.env.JWT_SECRET,
                { expiresIn: "7d" }
            );

            res.json({ message: "Logged in", user: { id: user.id, username: user.username }, token });
        } catch (err) {
            res.status(500).json({ error: "Login failed" });
        }
    };
}


module.exports = { signup, login };
