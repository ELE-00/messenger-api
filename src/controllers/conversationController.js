

function getConversations(prisma){
    return async (req, res) => {
        const userId = req.user.id;

        try{
            const conversations = await prisma.conversation.findMany({
                where: {
                    participants: {
                    some: { userId: userId }
                    }
                },
                include: {
                    participants: {
                    include: { user: true }
                    }
                }
                });

            res.json(conversations)

        } catch (err) {
            console.log(err)
            res.status(500).json({error: "Failed to fetch conversations"})

        }  
    }
};




function createConversation(prisma) {
  return async (req, res) => {
    const userId = req.user.id;
    const { recipientId } = req.body;

    try {
      // 1. Create conversation
      const newConversation = await prisma.conversation.create({
        data: {}
      });

      // 2. Add both participants
      await prisma.conversationParticipant.createMany({
        data: [
          { conversationId: newConversation.id, userId },
          { conversationId: newConversation.id, userId: recipientId }
        ]
      });

      res.json({
        conversationId: newConversation.id,
        message: "Conversation created successfully"
      });

    } catch (err) {
      console.log(err);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  };
}


function getMessages(prisma){
    return async (req, res) => {
        const chatId = parseInt(req.params.id);

        console.log("Received chatId: " + chatId)
        try{
            const messages = await prisma.message.findMany({
                where: {conversationId: chatId},
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
        const chatId = parseInt(req.params.id);
        const {senderId, recipientId, content} = req.body;

        try{
        const newMessage = await prisma.message.create({
            data: {senderId: senderId, recipientId: recipientId , content: content, conversationId: chatId}
        })

        res.json(newMessage, { message: "Message written to db" });

        } catch (err) {
            console.log(err)
            res.status(500).json({error: "Failed to send message"})

        }
    }
};


function getAllUsers(prisma){
  return async (req, res) => {

    try{
    const users = await prisma.user.findMany();

    res.json(users)

    } catch (err) {
      console.log(err)
      res.status(500).json({error: "Failed to get all users"})

    }
  }
}



module.exports = { getConversations, createConversation, getMessages, sendMessage, getAllUsers };