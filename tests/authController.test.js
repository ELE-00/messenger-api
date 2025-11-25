
// authController.test.js

const { signup, login } = require("../src/controllers/authController");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// //Testing signup
// describe("signup", () => {
//     test("signup", async () => {
//         const prismaMock = {
//             user: {
//             findUnique: jest.fn().mockResolvedValue(null),
//             create: jest.fn().mockResolvedValue({
//                 id: 1,
//                 username: "bob",
//                 password: "123",
//                 passwordConfirm: "123",
//                 })
//             }
//         };

//     const req = {
//       body: { username: "bob", password: "123", passwordConfirm: "123"}
//     };  

//     const res = { json: jest.fn() };

//     await signup(prismaMock)(req,res);

//     expect(prismaMock.user.create).toHaveBeenCalledWith({
//         data: { username: "bob", name: "bob", password: expect.any(String)}
//     })

//     })
// })


//Mock bcrypt 
    jest.mock("bcrypt", () => ({
        compare: jest.fn()
    }));

    jest.mock("jsonwebtoken", () => ({
    sign: jest.fn(() => "mockedToken") // always returns a dummy token
    }));


//Testing login fail
describe("login", () => {
    test("login", async () => {
        const prismaMock = {
            user: {
            // findUnique: jest.fn().mockResolvedValue(null),
            findUnique: jest.fn().mockResolvedValue({
                id: 1,
                username: "bob",
                password: "hashedPassword"
                })
            }
        };



    const req = {body: { username: "bob", password: "wrongPassword"}};  
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    const bcrypt = require("bcrypt")
    bcrypt.compare.mockResolvedValue(false)

    await login(prismaMock)(req,res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({error: "Invalid credentials"})

    })
})

//Testing login sucess
describe("login", () => {
    test("login", async () => {
        const prismaMock = {
            user: {
            // findUnique: jest.fn().mockResolvedValue(null),
            findUnique: jest.fn().mockResolvedValue({
                id: 1,
                username: "bob",
                password: "hashedPassword"
                })
            }
        };



    const req = {body: { username: "bob", password: "hashedPassword"}};  
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    const bcrypt = require("bcrypt")
    bcrypt.compare.mockResolvedValue(true)


    await login(prismaMock)(req,res);



    expect(jwt.sign).toHaveBeenCalledWith(
        {id: 1, username: "bob"},
        process.env.JWT_SECRET,
        {expiresIn: "7d"}
    );
 
    expect(res.json).toHaveBeenCalledWith({message: "Logged in", token: "mockedToken"})
    })
})