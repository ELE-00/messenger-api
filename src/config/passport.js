//passport.js

const LocalStrategy = require("passport-local").Strategy;
const pool = require("../db")
const bcrypt = require("bcryptjs");
const prisma = require('../script.js');

function initializePassport(passport){
    passport.use(
        new LocalStrategy(async (username, password, done) => {
            try {
            const user = await prisma.user.findUnique({where: {email: username}});

            if (!user) {
                return done(null, false, { message: "Incorrect username" });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return done(null, false, { message: "Incorrect password" });
            }
            return done(null, user);
            } catch(err) {
            return done(err);
            }
        })
    );


    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
    try {
        const user = await prisma.user.findUnique({where: {id: id}});

        done(null, user);
    } catch(err) {
        done(err);
    }
    });
};




module.exports = initializePassport;