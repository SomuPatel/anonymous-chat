const socket = io();

let username = localStorage.getItem("anonymousID");

if(!username){

    const randomNumber = Math.floor(Math.random() * 99999);

    username = "ANON_" + randomNumber;

    localStorage.setItem("anonymousID", username);

}

document.getElementById("user-id").innerText = username;

socket.emit("user-joined", username);

function sendMessage(){

    const input = document.getElementById("message-input");

    const messageText = input.value;

    if(messageText.trim() === ""){
        return;
    }

    socket.emit("send-message", {
        user: username,
        text: messageText
    });

    input.value = "";

}

socket.on("receive-message", (data) => {

    const chatBox = document.querySelector(".chat-box");

    const newMessage = document.createElement("div");

    newMessage.classList.add("message");

    if(data.user === username){

        newMessage.classList.add("my-message");

    }

    newMessage.innerText = data.user + ": " + data.text;

    chatBox.appendChild(newMessage);

    chatBox.scrollTop = chatBox.scrollHeight;

});

socket.on("system-message", (message) => {

    const chatBox = document.querySelector(".chat-box");

    const newMessage = document.createElement("div");

    newMessage.classList.add("system-message");

    newMessage.innerText = message;

    chatBox.appendChild(newMessage);

    chatBox.scrollTop = chatBox.scrollHeight;

});

socket.on("online-users", (count) => {

    document.getElementById("online-count").innerText = count;

});

document.getElementById("message-input").addEventListener("keypress", function(event){

    if(event.key === "Enter"){

        sendMessage();

    }

});