const express = require("express");

const http = require("http");

const { Server } = require("socket.io");

const path = require("path");

const app = express();

const server = http.createServer(app);

const io = new Server(server);

app.use(express.static(path.join(__dirname, "../public")));

let onlineUsers = 0;

io.on("connection", (socket) => {

    onlineUsers++;

    io.emit("online-users", onlineUsers);

    console.log("User Connected");

    socket.on("user-joined", (username) => {

        socket.username = username;

        io.emit("system-message", `${username} joined the chat`);

    });

    socket.on("send-message", (data) => {

        io.emit("receive-message", data);

    });

    socket.on("disconnect", () => {

        onlineUsers--;

        io.emit("online-users", onlineUsers);

        if(socket.username){

            io.emit("system-message", `${socket.username} left the chat`);

        }

        console.log("User Disconnected");

    });

});

server.listen(3000, () => {

    console.log("Server Started");

});