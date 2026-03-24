const cloudinary = require('cloudinary').v2;

function getUserData(prisma) {
    return async (req, res) => {
        const userId = req.user.id;
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { id: true, username: true, name: true, bio: true, profilepic: true, createdAt: true }
            });
            res.json(user);
        } catch (err) {
            res.status(500).json({ error: "Failed to get user data" });
        }
    };
}

function sendUserData(prisma) {
    return async (req, res) => {
        const userId = req.user.id;
        const { name, bio } = req.body;

        try {
            const user = await prisma.user.update({
                where: { id: userId },
                data: { name, bio }
            });
            res.json(user);
        } catch (err) {
            res.status(500).json({ error: "Failed to update user data" });
        }
    };
}

function uploadProfilePic(prisma) {
    return async (req, res) => {
        const userId = req.user.id;

        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        try {
            const uploadResult = await cloudinary.uploader.upload(req.file.path, {
                folder: "profile_pics",
                resource_type: "image"
            });

            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: { profilepic: uploadResult.secure_url }
            });

            return res.json({
                success: true,
                profilepic: uploadResult.secure_url,
                user: updatedUser
            });
        } catch (err) {
            return res.status(500).json({ error: "Failed to upload image" });
        }
    };
}


module.exports = { getUserData, sendUserData, uploadProfilePic };
