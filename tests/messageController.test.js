

const { getMessages, sendMessage } = require("../src/controllers/messageController");

//Testing sendMessage

describe("sendMessage controller", () => {
  test("saves message to mock db", async () => {
    const prismaMock = {
      message: {
      create: jest.fn().mockResolvedValue({
        id: 10,
        senderId: 1,
        recipientId: 2,
        content: "Hello!"
        })
      }
    };

    const req = {
      user: { id: 1 },
      body: { recipientId: 2, content: "Hello!" }
    };

    const res = { json: jest.fn() };

    await sendMessage(prismaMock)(req,res);

    expect(prismaMock.message.create).toHaveBeenCalledWith({
      data: {senderId: 1, recipientId: 2 , content: "Hello!"}
    });

    expect(res.json).toHaveBeenCalledWith({ message: "Message written to db" });

  })
})


describe("getMessage controller", () => {
  test("message send to mock db", async () => {

    const prismaMock = {
      message: {
      findMany: jest.fn().mockResolvedValue([
        {id: 10, senderId: 1,  recipientId: 2, content: "Hello!"},
        {id: 11, senderId: 2,  recipientId: 1, content: "Hi!"}]
      )
      }
    };

    const req = {
      user: { id: 1 },
    };

    const res = { json: jest.fn() };

    await getMessages(prismaMock)(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ content: "Hi!" })
    ]));



  })
})


