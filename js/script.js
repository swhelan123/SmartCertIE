/*******************************************************
 * FIREBASE v9 SETUP (MODULAR)
 *******************************************************/
// 1) Import only what you need from the CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-analytics.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";
import { doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-storage.js";

// 2) Your Firebase configuration (replace with your real config)
const firebaseConfig = {
  apiKey: "AIzaSyDe5pXEGR015hQbXvoSGyJc955hgXO8tio",
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

const googleProvider = new GoogleAuthProvider();

/*******************************************************
 * DARK MODE ICON (SUN/MOON)
 *******************************************************/
const body = document.body;
const modeIcon = document.getElementById("modeIcon");

if (modeIcon) {
  // On page load, see if theme is 'dark'
  if (localStorage.getItem("theme") === "dark") {
    body.classList.add("dark-mode");
    modeIcon.src = "assets/img/light.png"; // show sun
  } else {
    modeIcon.src = "assets/img/dark.png"; // show moon
  }

  // When icon is clicked
  modeIcon.addEventListener("click", () => {
    body.classList.toggle("dark-mode");
    const isDark = body.classList.contains("dark-mode");
    localStorage.setItem("theme", isDark ? "dark" : "light");
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
      // Logged in
      loginBtn.classList.add("hidden");
      profilePic.classList.remove("hidden");
      accountLink.setAttribute("href", "account.html");
    } else {
      // Logged out
      loginBtn.classList.remove("hidden");
      profilePic.classList.add("hidden");
      accountLink.setAttribute("href", "login.html");
    }
  }
});

//Event listener for pfp -> account
if (profilePic) {
  profilePic.addEventListener("click", () => {
    window.location.href = "account.html";
  });
}

//Event listener for clicking login
if (loginBtn) {
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
 * Dropdown topic menu
 *******************************************************/

// References to the DOM elements
const unitContainer = document.getElementById("unitContainer");
const chapterContainer = document.getElementById("chapterContainer");
const selectedTopicContainer = document.getElementById("selectedTopicContainer");
const selectedTopicLabel = document.getElementById("selectedTopicLabel");
const changeTopicBtn = document.getElementById("changeTopicBtn");

// Define chapters for each unit (A, B, C)
const chapters = {
  A: ["The Scientific Method", "The Characteristics of Life", "Nutrition", "General Principles of Ecology", "A Study of an Ecosystem"],
  B: ["Cell Structure", "Cell Metabolism", "Cell Continuity", "Cell Diversity", "Genetics"],
  C: ["Diversity of Organisms", "Organisation and the Vascular Structures", "Transport and Nutrition", "Breathing System and Excretion", "Responses to Stimuli", "Reproduction and Growth"],
};

// Grab all unit buttons (A/B/C)
const unitButtons = document.querySelectorAll(".unit-button");

// For each unit button, when clicked:
unitButtons.forEach((button) => {
  button.addEventListener("click", () => {
    // 1) Identify which unit was chosen (A/B/C)
    const unit = button.getAttribute("data-unit");

    // 2) Hide the unit container
    unitContainer.classList.add("hidden");

    // 3) Clear any existing chapter buttons
    chapterContainer.innerHTML = "";

    // 4) Create new buttons for each chapter in that unit
    if (chapters[unit]) {
      chapters[unit].forEach((chapter) => {
        const chapterBtn = document.createElement("button");
        chapterBtn.textContent = chapter;
        chapterBtn.classList.add("chapter-button");

        // Apply color styling based on the unit
        if (unit === "A") {
          chapterBtn.classList.add("unit-green");
        } else if (unit === "B") {
          chapterBtn.classList.add("unit-purple");
        } else if (unit === "C") {
          chapterBtn.classList.add("unit-red");
        }

        // When a chapter is selected:
        chapterBtn.addEventListener("click", () => {
          // Hide the chapter container
          chapterContainer.classList.add("hidden");
          // Display the selected chapter name
          selectedTopicLabel.textContent = chapter;
          // Show the container that holds the "Change Topic" button
          selectedTopicContainer.classList.remove("hidden");
        });

        chapterContainer.appendChild(chapterBtn);
      });
    }

    // 5) Show the chapter container with the newly created buttons
    chapterContainer.classList.remove("hidden");
  });
});

// Handle the "Change Topic" button (reset selection)
if (changeTopicBtn) {
  changeTopicBtn.addEventListener("click", () => {
    // Hide the selected topic container
    selectedTopicContainer.classList.add("hidden");
    // Clear the label
    selectedTopicLabel.textContent = "";
    // Show the unit container again so user can pick a new unit
    unitContainer.classList.remove("hidden");
    // Clear and hide the chapter container
    chapterContainer.innerHTML = "";
    chapterContainer.classList.add("hidden");
  });
}
