const express = require("express");

const http = require("http");

const { Server } = require("socket.io");

const path = require("path");

const mongoose = require("mongoose");

const bcrypt = require("bcrypt");

const app = express();

const server = http.createServer(app);

const io = new Server(server);

app.use(express.json());

app.use(express.static(path.join(__dirname, "../public")));

mongoose.connect("mongodb+srv://Somu_2003:Somu_2003@cluster0.vj7r9er.mongodb.net/?appName=Cluster0")
.then(() => {

    console.log("MongoDB Connected");

})
.catch((err) => {

    console.log(err);

});

const userSchema = new mongoose.Schema({

    username:String,

    password:String

});

const User = mongoose.model("User", userSchema);

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

            message:"Wrong password"

        });

    }

    res.json({

        success:true,

        message:"Login Success"

    });

});

let onlineUsers = 0;

let connectedUsers = {};

io.on("connection", (socket) => {

    onlineUsers++;

    io.emit("online-users", onlineUsers);

    socket.on("user-joined", (username) => {

        socket.username = username;

        connectedUsers[username] = socket.id;

        io.emit("system-message", `${username} joined the chat`);

        io.emit("user-list", Object.keys(connectedUsers));

    });

    socket.on("typing", (username) => {

        socket.broadcast.emit("typing-status", `${username} is typing...`);

    });

    socket.on("send-message", (data) => {

        io.emit("receive-message", data);

    });

    socket.on("private-message", (data) => {

        const targetSocket = connectedUsers[data.targetUser];

        if(targetSocket){

            io.to(targetSocket).emit("receive-private-message", {

                user:data.user,

                text:data.text

            });

        }

    });

    socket.on("disconnect", () => {

        onlineUsers--;

        io.emit("online-users", onlineUsers);

        if(socket.username){

            delete connectedUsers[socket.username];

            io.emit("system-message", `${socket.username} left the chat`);

            io.emit("user-list", Object.keys(connectedUsers));

        }

    });

});

server.listen(3000, () => {

    console.log("Server Started");

});