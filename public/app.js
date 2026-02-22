let socket = null;

function initializeSocket() {
  const JWTToken = localStorage.getItem("token");

  socket = io("http://localhost:4000", {
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

    socket.on("userOnline", ({ userId }) => {
    console.log(`User with ID ${userId} is now online`);
  });

  socket.on("userOffline", ({ userId }) => {
    console.log(`User with ID ${userId} is now offline`);
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
    const usernameOrEmail = document.getElementById("login-username-or-email").value;
    const password = document.getElementById("login-password").value;

    fetch("/api/auth/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ usernameOrEmail, password }),
    })
    .then((response) => response.json())
    .then((data) => {
        console.log("Login response:", data);
        if (data.token) {
            localStorage.setItem("token", data.token);
            alert("Login successful!");
            initializeSocket(); // ← Connect socket AFTER login
            document.querySelector(".login-container").classList.add("d-none");
            document.querySelector(".chat-container").classList.remove("d-none");
            document.querySelector(".navbar").classList.remove("d-none");
        } else {
            alert("Login failed: " + data.error);
        }

        const { username, profilePictureUrl } = data; // from your login response

        const avatarDiv = document.getElementById("user-avatar");
        avatarDiv.innerHTML = ""; // Clear previous content

        if (profilePictureUrl) {
        // Show profile picture
        const img = document.createElement("img");
        img.src = profilePictureUrl;
        img.alt = username;
        img.className = "rounded-circle";
        img.style.width = "100%";
        img.style.height = "100%";
        img.style.objectFit = "cover";
        avatarDiv.appendChild(img);
        } else {
        // Show initials or fallback
        avatarDiv.textContent = username[0].toUpperCase();
        }
    })
    .catch((error) => {
        console.error("Error logging in:", error);
        alert("An error occurred while logging in.");
    });
});

// View user profile
document.getElementById("user-avatar").addEventListener("click", () => {
    const JWTToken = localStorage.getItem("token");
    fetch("/api/user/me", {
        headers: {
            "Authorization": `Bearer ${JWTToken}`,
        },
    })
    .then((response) => response.json())
    .then((data) => {
        if (!data.username) {
            alert("Failed to fetch user profile: " + data.error);
        }
    document.querySelector(".login-container").classList.add("d-none");
    document.querySelector(".chat-container").classList.add("d-none");
    document.getElementById("user-profile-container").classList.remove("d-none");
    document.getElementById("profile-info").textContent = `Username: ${data.username}, Email: ${data.email}, Online: ${data.isOnline}, Last Online: ${new Date(data.lastOnline).toLocaleString()}, Profile Picture URL: ${data.profilePictureUrl}`;
    })
    .catch((error) => {
        console.error("Error fetching profile:", error);
        alert("An error occurred while fetching the profile.");
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
