let socket = null;

function initializeSocket() {
  const JWTToken = localStorage.getItem("token");

  socket = io("http://localhost:3000", {
    auth: {
      token: JWTToken,
    },
  });

  socket.on("welcomeMessage", (data) => {
    console.log(data);
  });

  socket.on("MessageFromServerToAllClients", (newMessage) => {
    const newMessageElement = document.createElement("li");
    newMessageElement.textContent = newMessage;
    document.getElementById("messages-container").appendChild(newMessageElement);
  });
}

document.getElementById("show-register").addEventListener("click", () => {
    document.querySelector(".login-container").classList.add("d-none");
    document.querySelector(".register-container").classList.remove("d-none");
});

document.getElementById("show-login").addEventListener("click", () => {
    document.querySelector(".register-container").classList.add("d-none");
    document.querySelector(".login-container").classList.remove("d-none");
});

// Registration
document.getElementById("register-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const username = document.getElementById("register-username").value;
    const email = document.getElementById("register-email").value;
    const password = document.getElementById("register-password").value;

    fetch("/api/auth/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password }),
    })
    .then((response) => response.json())
    .then((data) => {
        if (data.message) {
            alert(data.message);
            document.querySelector(".register-container").classList.add("d-none");
            document.querySelector(".login-container").classList.remove("d-none");
        } else {
            alert("Registration failed: " + data.error);
        }
    })
    .catch((error) => {
        console.error("Error registering:", error);
        alert("An error occurred while registering.");
    });
});

// Login
document.getElementById("login-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    fetch("/api/auth/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
    })
    .then((response) => response.json())
    .then((data) => {
        if (data.token) {
            localStorage.setItem("token", data.token);
            alert("Login successful!");
            initializeSocket(); // ← Connect socket AFTER login
            document.querySelector(".login-container").classList.add("d-none");
            document.querySelector(".chat-container").classList.remove("d-none");
        } else {
            alert("Login failed: " + data.error);
        }
    })
    .catch((error) => {
        console.error("Error logging in:", error);
        alert("An error occurred while logging in.");
    });
});

// Message sending
document.getElementById("messages-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const newMessage = document.getElementById("user-message").value;
  document.getElementById("user-message").value = "";
  // This socket is sending an event to the server...
  socket.emit("messageFromClientToServer", newMessage); // Emit the new message to the server
});
