const socket = io();

let currentUser = "";

const messages = document.getElementById("messages");

const input = document.getElementById("message-input");

const sendBtn = document.getElementById("send-btn");

const usersContainer = document.getElementById("users-container");

/* LOGIN */

function showLogin(){

    document.getElementById("register-page").style.display = "none";

    document.getElementById("login-page").style.display = "block";

}

function showRegister(){

    document.getElementById("login-page").style.display = "none";

    document.getElementById("register-page").style.display = "block";

}

async function createAccount(){

    const username = document.getElementById("register-username").value;

    const password = document.getElementById("register-password").value;

    const response = await fetch("/register", {

        method:"POST",

        headers:{

            "Content-Type":"application/json"

        },

        body:JSON.stringify({

            username,
            password

        })

    });

    const data = await response.json();

    alert(data.message);

    if(data.success){

        showLogin();

    }

}

async function login(){

    const username = document.getElementById("login-username").value;

    const password = document.getElementById("login-password").value;

    const response = await fetch("/login", {

        method:"POST",

        headers:{

            "Content-Type":"application/json"

        },

        body:JSON.stringify({

            username,
            password

        })

    });

    const data = await response.json();

    alert(data.message);

    if(data.success){

        currentUser = username;

        document.getElementById("auth-screen").style.display = "none";

        document.getElementById("chat-screen").style.display = "flex";

        document.getElementById("current-user").innerText = currentUser;

        socket.emit("user-joined", currentUser);

    }

}

/* SEND */

sendBtn.addEventListener("click", sendMessage);

input.addEventListener("keypress", function(event){

    if(event.key === "Enter"){

        sendMessage();

    }

});

function sendMessage(){

    const text = input.value;

    if(text.trim() === "") return;

    socket.emit("send-message", {

        user:currentUser,

        text:text

    });

    input.value = "";

}

/* RECEIVE */

socket.on("receive-message", (data) => {

    const div = document.createElement("div");

    div.classList.add("message");

    if(data.user === currentUser){

        div.classList.add("my-message");

    }else{

        div.classList.add("other-message");

    }

    div.innerHTML = `

        <strong>${data.user}</strong><br>
        ${data.text}

    `;

    messages.appendChild(div);

    messages.scrollTop = messages.scrollHeight;

});

/* USERS */

socket.on("user-list", (users) => {

    usersContainer.innerHTML = "";

    users.forEach((user) => {

        const div = document.createElement("div");

        div.classList.add("chat-user");

        div.innerHTML = `

            <div class="avatar">

                ${user.charAt(0).toUpperCase()}

            </div>

            <div>

                <h4>${user}</h4>

                <p>Online</p>

            </div>

        `;

        usersContainer.appendChild(div);

    });

});

/* SYSTEM */

socket.on("system-message", (message) => {

    const div = document.createElement("div");

    div.classList.add("system-message");

    div.innerText = message;

    messages.appendChild(div);

});

/* TYPING */

input.addEventListener("input", () => {

    socket.emit("typing", currentUser);

});

socket.on("typing-status", (msg) => {

    document.getElementById("typing-status").innerText = msg;

    setTimeout(() => {

        document.getElementById("typing-status").innerText = "";

    }, 1000);

});

/* PWA */

let deferredPrompt;

const installBtn = document.getElementById("install-btn");

window.addEventListener("beforeinstallprompt", (e) => {

    e.preventDefault();

    deferredPrompt = e;

});

installBtn.addEventListener("click", async () => {

    if(deferredPrompt){

        deferredPrompt.prompt();

        deferredPrompt = null;

    }

});

/* SERVICE WORKER */

if("serviceWorker" in navigator){

    navigator.serviceWorker.register("service-worker.js");

}