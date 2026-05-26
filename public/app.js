let selectedUser = "";

const socket = io();

let currentUser = "";

/* AUTO LOGIN */

window.onload = () => {

    const savedUser = localStorage.getItem("username");

    if(savedUser){

        currentUser = savedUser;

        document.getElementById("auth-screen").style.display = "none";

        document.getElementById("chat-screen").style.display = "flex";

        document.getElementById("current-user").innerText = currentUser;

        socket.emit("user-joined", currentUser);

    }

};

const messages = document.getElementById("messages");

const input = document.getElementById("message-input");

const sendBtn = document.getElementById("send-btn");

const usersContainer = document.getElementById("users-container");

/* =========================
   LOGIN / REGISTER
========================= */

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

        localStorage.setItem("username", username);

        currentUser = username;

        document.getElementById("auth-screen").style.display = "none";

        document.getElementById("chat-screen").style.display = "flex";

        document.getElementById("current-user").innerText = currentUser;

        socket.emit("user-joined", currentUser);

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

        localStorage.setItem("username", username);

        currentUser = username;

        document.getElementById("auth-screen").style.display = "none";

        document.getElementById("chat-screen").style.display = "flex";

        document.getElementById("current-user").innerText = currentUser;

        socket.emit("user-joined", currentUser);

    }

}

/* =========================
   SEND MESSAGE
========================= */

sendBtn.addEventListener("click", sendMessage);

input.addEventListener("keypress", function(event){

    if(event.key === "Enter"){

        sendMessage();

    }

});

function sendMessage(){

    const text = input.value;

    if(text.trim() === "") return;

    if(selectedUser === ""){

        alert("Select user first");

        return;

    }

    socket.emit("private-message", {

        user:currentUser,

        targetUser:selectedUser,

        text:text

    });

    input.value = "";

}

/* =========================
   RECEIVE PRIVATE MESSAGE
========================= */

socket.on("receive-private-message", (data) => {

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

/* =========================
   USER LIST
========================= */

socket.on("user-list", (users) => {

    usersContainer.innerHTML = "";

    users.forEach((user) => {

        if(user === currentUser) return;

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

        div.addEventListener("click", () => {

            selectedUser = user;

            document.getElementById("current-user").innerText = user;

            messages.innerHTML = "";

        });

        usersContainer.appendChild(div);

    });

});

/* =========================
   SYSTEM MESSAGE
========================= */

socket.on("system-message", (message) => {

    const div = document.createElement("div");

    div.classList.add("system-message");

    div.innerText = message;

    messages.appendChild(div);

});

/* =========================
   TYPING STATUS
========================= */

input.addEventListener("input", () => {

    socket.emit("typing", currentUser);

});

socket.on("typing-status", (msg) => {

    document.getElementById("typing-status").innerText = msg;

    setTimeout(() => {

        document.getElementById("typing-status").innerText = "";

    }, 1000);

});

/* =========================
   PWA INSTALL
========================= */

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

/* =========================
   SERVICE WORKER
========================= */

if("serviceWorker" in navigator){

    navigator.serviceWorker.register("service-worker.js");

}

/* =========================
   LOGOUT
========================= */

function logout(){

    localStorage.removeItem("username");

    location.reload();

}