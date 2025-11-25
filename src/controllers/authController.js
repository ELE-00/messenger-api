// authController.js
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

//Write credentials to users db
function signup(prisma) {
    return async (req, res) => {
        const { username, password, passwordConfirm} = req.body;

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
}

function login(prisma) {
    return async (req, res) => {
        const { username, password } = req.body;
        
        const user = await prisma.user.findUnique({where: {username}});

        if(!user) return res.status(400).json({error: "Invalid credentials"});

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return  res.status(400).json({error: "Invalid credentials"})
        }

        //Create JWT
        const token = jwt.sign(
            {id: user.id, username: user.username},
            process.env.JWT_SECRET,
            {expiresIn: "7d"}
        );

        res.json({message: "Logged in", token});
    } 
};


module.exports = {signup, login}