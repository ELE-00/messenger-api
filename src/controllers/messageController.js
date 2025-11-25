

function getMessages(prisma){
    return async (req, res) => {
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
    }
};

function sendMessage(prisma){
    return async (req, res) => {
        const userId = req.user.id;
        const {recipientId, content} = req.body;

        try{
        const newMessage = await prisma.message.create({
            data: {senderId: userId, recipientId: recipientId , content: content}
        })

        res.json({ message: "Message written to db" });

        } catch (err) {
            console.log(err)
            res.status(500).json({error: "Failed to send message"})

        }
    }
};


module.exports = { getMessages, sendMessage };