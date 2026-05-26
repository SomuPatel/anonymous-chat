require("dotenv").config();

const express = require("express");

const http = require("http");

const { Server } = require("socket.io");

const mongoose = require("mongoose");

const bcrypt = require("bcrypt");

const path = require("path");

const app = express();

const server = http.createServer(app);

const io = new Server(server);

app.use(express.json());

app.use(express.static(path.join(__dirname, "../public")));

/* =========================
   MONGODB
========================= */

mongoose.connect(process.env.MONGO_URI)

.then(() => {

    console.log("MongoDB Connected");

})

.catch((err) => {

    console.log(err);

});

/* =========================
   USER MODEL
========================= */

const userSchema = new mongoose.Schema({

    username:String,

    password:String

});

const User = mongoose.model("User", userSchema);

/* =========================
   REGISTER
========================= */

app.post("/register", async (req, res) => {

    const { username, password } = req.body;

    const existingUser = await User.findOne({ username });

    if(existingUser){

        return res.json({

            success:false,

            message:"Username already exists"

        });

    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({

        username,

        password:hashedPassword

    });

    await newUser.save();

    res.json({

        success:true,

        message:"Account Created"

    });

});

/* =========================
   LOGIN
========================= */

app.post("/login", async (req, res) => {

    const { username, password } = req.body;

    const user = await User.findOne({ username });

    if(!user){

        return res.json({

            success:false,

            message:"User not found"

        });

    }

    const match = await bcrypt.compare(password, user.password);

    if(!match){

        return res.json({

            success:false,

            message:"Wrong Password"

        });

    }

    res.json({

        success:true,

        message:"Login Success"

    });

});

/* =========================
   SOCKET
========================= */

let connectedUsers = {};

io.on("connection", (socket) => {

    socket.on("user-joined", (username) => {

        connectedUsers[username] = socket.id;

        io.emit("user-list", Object.keys(connectedUsers));

        io.emit("system-message", `${username} joined`);

    });

    socket.on("private-message", (data) => {

    const targetSocketId = connectedUsers[data.targetUser];

    if(targetSocketId){

        io.to(targetSocketId).emit("receive-private-message", {

            user:data.user,

            text:data.text

        });

    }

    io.to(socket.id).emit("receive-private-message", {

        user:data.user,

        text:data.text

    });

});

    socket.on("typing", (username) => {

        socket.broadcast.emit("typing-status", `${username} is typing...`);

    });

    socket.on("disconnect", () => {

        for(let user in connectedUsers){

            if(connectedUsers[user] === socket.id){

                delete connectedUsers[user];

            }

        }

        io.emit("user-list", Object.keys(connectedUsers));

    });

});

server.listen(3000, () => {

    console.log("Server Started");

});