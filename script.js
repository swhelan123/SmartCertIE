/*******************************************************
 * FIREBASE v9 SETUP (MODULAR)
 *******************************************************/
// 1) Import only what you need from the CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-analytics.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";

// 2) Your Firebase configuration (replace with your real config)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "smartcert-f1965.firebaseapp.com",
  projectId: "smartcert-f1965",
  storageBucket: "smartcert-f1965.appspot.com",
  messagingSenderId: "1075815326636",
  appId: "1:1075815326636:web:ffd63ed204d2832e295009",
  measurementId: "G-6CJR44Z4MK",
};

// 3) Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// 4) Get Auth & Firestore instances
const auth = getAuth(app);
const db = getFirestore(app);

/*******************************************************
 * DARK MODE ICON (SUN/MOON)
 *******************************************************/
const body = document.body;
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

/*******************************************************
 * AUTH STATE & UI TOGGLING
 *******************************************************/
// Elements for top-right container
const loginBtn = document.getElementById("loginBtn");
const profilePic = document.getElementById("profilePic");
const accountLink = document.getElementById("accountLink");

// Listen for Firebase auth changes (logged in/out)
onAuthStateChanged(auth, (user) => {
  if (loginBtn && profilePic && accountLink) {
    if (user) {
      // User is logged in
      loginBtn.classList.add("hidden");
      profilePic.classList.remove("hidden");
      accountLink.setAttribute("href", "account.html");
    } else {
      // User is logged out
      loginBtn.classList.remove("hidden");
      profilePic.classList.add("hidden");
      accountLink.setAttribute("href", "login.html");
    }
  }
});

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
        // In a real app, you'd store it in Firestore if you want persistence
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
 * LOGIN PAGE (login.html) - Real Firebase Login
 *******************************************************/
// We expect an <form id="loginForm"> with <input id="emailInput">, <input id="passwordInput">
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const emailVal = document.getElementById("emailInput")?.value.trim();
    const passVal = document.getElementById("passwordInput")?.value.trim();
    if (!emailVal || !passVal) {
      alert("Please enter email and password");
      return;
    }

    try {
      // Attempt to sign in with Firebase
      await signInWithEmailAndPassword(auth, emailVal, passVal);
      alert("Logged in successfully!");
      window.location.href = "index.html"; // go back to home
    } catch (err) {
      alert("Login error: " + err.message);
    }
  });
}

/*******************************************************
 * ACCOUNT PAGE (account.html)
 *******************************************************/
// We expect <p id="accountInfo"> and <button id="logoutBtn">
const accountInfo = document.getElementById("accountInfo");
const logoutBtn = document.getElementById("logoutBtn");

// We'll check auth state to see if user is logged in
onAuthStateChanged(auth, (user) => {
  if (accountInfo && logoutBtn) {
    if (!user) {
      accountInfo.textContent = "You are not logged in. Redirecting to login...";
      setTimeout(() => {
        window.location.href = "login.html";
      }, 2000);
    } else {
      accountInfo.textContent = "Welcome to your account page! (Firebase user: " + user.email + ")";
      logoutBtn.addEventListener("click", async () => {
        await signOut(auth);
        alert("Logged out!");
        window.location.href = "index.html";
      });
    }
  }
});

/*******************************************************
 * SIGN-UP PAGE (signup.html)
 *******************************************************/

const signupForm = document.getElementById("signupForm");
if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const emailVal = document.getElementById("emailInput")?.value.trim();
    const passVal = document.getElementById("passwordInput")?.value.trim();
    const confirmVal = document.getElementById("confirmPasswordInput")?.value.trim();

    if (!emailVal || !passVal || !confirmVal) {
      alert("Please fill in all fields.");
      return;
    }
    if (passVal !== confirmVal) {
      alert("Passwords do not match.");
      return;
    }

    try {
      // Create the user with Firebase Auth
      await createUserWithEmailAndPassword(auth, emailVal, passVal);
      alert("Account created successfully!");
      window.location.href = "index.html"; // go to main page
    } catch (err) {
      alert("Sign-up error: " + err.message);
    }
  });
}
