const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

//Write credentials to users db
async function signup() {
    const { username, password } = req.body;

    if(password !== passwordConfirm){
        throw new Error("Passwords do not match");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const existing = await prisma.user.findUnique({ where: { username } });

    if(existing) {
        throw new Error("User already exists");
    }

    const user = await prisma.user.create({
        data: { username: username, name: username, password: hashedPassword }
    });

    res.json({ message: "User created", user });
}

async function login(){
    const { username, password } = req.body;
    
    const user = await prisma.user.findUnique({where: {username}});

    if(!user) return res.status(400).json({error: "Invalid credentials"});

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return  res.status(400).json({error: "Invalid credentials"})
    }

    //Create JWT
    const token = jwt.sign(
        {id: user-id, username: user.username},
        process.nextTick.JWT_SECRET,
        {expiresIn: "7d"}
    );

    res.json({message: "Logged in", token});
    
};


module.exports = {signup, login}