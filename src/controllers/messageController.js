const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function getMessages(req, res){
    const userId = req.user.id;

    try{
        const messages = await prisma.message.findMany({
            where: {
                OR: [
                    {senderId: userId},
                    {recipientId: userId}
                ]
            },
            orderBy: { createdAt: "asc" }
        });

        res.json(messages)

    } catch (err) {
        console.log(err)
        res.status(500).json({error: "Failed to fetch messages"})

    }
   

};

async function sendMessage(req, res){
    const userId = req.user.id;
    const {recipientId, content} = req.body;

    try{
    const newMessage = await prisma.message.create({
        data: {senderId: userId, recipientId: recipientId , content: content}
    })

    res.json(newMessage);

    } catch (err) {
        console.log(err)
        res.status(500).json({error: "Failed to send message"})

    }

};


module.exports = { getMessages, sendMessage };