/*******************************************************
 * DARK MODE
 *******************************************************/
const body = document.body;
const darkModeToggle = document.getElementById("darkModeToggle");
if (darkModeToggle) {
  if (localStorage.getItem("theme") === "dark") {
    body.classList.add("dark-mode");
    darkModeToggle.textContent = "Light Mode";
  }

  darkModeToggle.addEventListener("click", () => {
    body.classList.toggle("dark-mode");
    const isDark = body.classList.contains("dark-mode");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    darkModeToggle.textContent = isDark ? "Light Mode" : "Dark Mode";
  });
}

/*******************************************************
 * LOGIN STATE UI TOGGLING
 *******************************************************/
// We track user login with localStorage key "isLoggedIn" = "true" or null.
const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

// On index.html, top-right container:
const loginBtn = document.getElementById("loginBtn");
const profilePic = document.getElementById("profilePic");
const accountLink = document.getElementById("accountLink");

if (loginBtn && profilePic && accountLink) {
  // If user is logged in, show profile pic & link to account page
  // Otherwise, show login button & link to login page
  if (isLoggedIn) {
    loginBtn.classList.add("hidden");
    profilePic.classList.remove("hidden");
    accountLink.setAttribute("href", "account.html");
  } else {
    loginBtn.classList.remove("hidden");
    profilePic.classList.add("hidden");
    accountLink.setAttribute("href", "login.html");
  }

  // Clicking login button (if shown) -> login page
  loginBtn.addEventListener("click", () => {
    window.location.href = "login.html";
  });
}

/*******************************************************
 * SIDEBAR NAV ON index.html (Single-Page Sections)
 *******************************************************/
const sidebarLinks = document.querySelectorAll(".sidebar-nav a[data-section]");
const chatSection = document.getElementById("chatSection");
const notebookSection = document.getElementById("notebookSection");

if (sidebarLinks && chatSection && notebookSection) {
  sidebarLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const target = link.getAttribute("data-section");
      // Hide both sections
      chatSection.classList.add("hidden");
      notebookSection.classList.add("hidden");
      // Show the chosen section
      if (target === "chatSection") chatSection.classList.remove("hidden");
      if (target === "notebookSection") notebookSection.classList.remove("hidden");
    });
  });
}

/*******************************************************
 * BASIC CHAT FUNCTIONALITY (PLACEHOLDER)
 *******************************************************/
const sendBtn = document.getElementById("sendBtn");
const chatInput = document.getElementById("chatInput");
const chatMessages = document.getElementById("chatMessages");
const savedResponses = document.getElementById("savedResponses");

if (sendBtn && chatInput && chatMessages) {
  sendBtn.addEventListener("click", () => {
    const question = chatInput.value.trim();
    if (!question) return;

    // User message
    const userMsg = document.createElement("div");
    userMsg.className = "chat-message message-user";
    userMsg.textContent = question;
    chatMessages.appendChild(userMsg);

    chatInput.value = "";
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Placeholder bot response
    setTimeout(() => {
      const botMsg = document.createElement("div");
      botMsg.className = "chat-message message-bot";
      botMsg.textContent = "This is a placeholder answer about: " + question;

      // Add a "Save" button to the bot response
      const saveBtn = document.createElement("button");
      saveBtn.textContent = "Save to Notebook";
      saveBtn.style.marginLeft = "10px";
      saveBtn.style.padding = "2px 6px";
      saveBtn.style.fontSize = "0.8rem";
      saveBtn.style.cursor = "pointer";
      saveBtn.style.borderRadius = "6px";
      saveBtn.style.border = "none";
      saveBtn.style.backgroundColor = "var(--primary-color)";
      saveBtn.style.color = "#fff";
      saveBtn.addEventListener("click", () => {
        // Save this response to the notebook
        const li = document.createElement("li");
        li.textContent = botMsg.textContent;
        savedResponses.appendChild(li);
        alert("Response saved to notebook!");
      });

      botMsg.appendChild(saveBtn);
      chatMessages.appendChild(botMsg);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 1000);
  });
}

/*******************************************************
 * LOGIN PAGE (login.html)
 *******************************************************/
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    // For demo, any username/pw logs you in
    // In reality, you'd fetch() to a server, verify credentials, etc.
    localStorage.setItem("isLoggedIn", "true");
    alert("Logged in successfully (demo)!");
    // Redirect to home or account page
    window.location.href = "index.html";
  });
}

/*******************************************************
 * ACCOUNT PAGE (account.html)
 *******************************************************/
const accountInfo = document.getElementById("accountInfo");
const logoutBtn = document.getElementById("logoutBtn");

if (accountInfo && logoutBtn) {
  // Display some user info (in real life, you'd fetch from server)
  if (!isLoggedIn) {
    accountInfo.textContent = "You are not logged in. Redirecting to login...";
    setTimeout(() => {
      window.location.href = "login.html";
    }, 2000);
  } else {
    accountInfo.textContent = "Welcome to your account page! (Demo text)";
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("isLoggedIn");
      alert("Logged out!");
      window.location.href = "index.html";
    });
  }
}
/*******************************************************
 * DARK MODE ICON
 *******************************************************/
const modeIcon = document.getElementById("modeIcon");
if (modeIcon) {
  // On page load, see if theme is 'dark'
  if (localStorage.getItem("theme") === "dark") {
    body.classList.add("dark-mode");
    // If currently dark, show sun icon (light.png)
    modeIcon.src = "assets/img/light.png";
  } else {
    // If currently light, show moon icon (dark.png)
    modeIcon.src = "assets/img/dark.png";
  }

  // When the icon is clicked
  modeIcon.addEventListener("click", () => {
    body.classList.toggle("dark-mode");
    const isDark = body.classList.contains("dark-mode");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    // Switch icon accordingly
    modeIcon.src = isDark ? "assets/img/light.png" : "assets/img/dark.png";
  });
}
