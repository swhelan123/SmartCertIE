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

      // "Save to Notebook" button
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
        // Save to local list
        // (In real app, store in Firestore if you want persistence)
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

/*******************************************************
 * LOGIN PAGE (login.html) - Real Firebase Login
 *******************************************************/
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
 * SIGN-UP LOGIC (signup.html)
 *******************************************************/
// If you have a signup page with <form id="signupForm">, plus
// <input id="emailInput">, <input id="passwordInput">, <input id="confirmPasswordInput">
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
      // Create user with Firebase
      await createUserWithEmailAndPassword(auth, emailVal, passVal);
      alert("Account created successfully!");
      window.location.href = "setup.html";
    } catch (err) {
      alert("Sign-up error: " + err.message);
    }
  });
}

/*******************************************************
 * SETUP PAGE (setup.html) - Collect Name, Phone, Photo
 *******************************************************/
const setupForm = document.getElementById("setupForm");
if (setupForm) {
  setupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // 1) Ensure user is logged in
    const user = auth.currentUser;
    if (!user) {
      alert("You must be logged in to complete setup.");
      window.location.href = "login.html";
      return;
    }

    try {
      // 2) Gather form inputs
      const firstName = document.getElementById("firstName").value.trim();
      const lastName = document.getElementById("lastName").value.trim();
      const phoneNumber = document.getElementById("phoneNumber").value.trim();
      const file = document.getElementById("profilePicInput").files[0];

      // Basic validation
      if (!firstName || !lastName || !phoneNumber) {
        alert("Please fill in all required fields.");
        return;
      }

      // 3) Upload profile picture to Firebase Storage (if provided)
      let photoURL = "";
      if (file) {
        const storage = getStorage(app);
        // Path: profilePics/{uid}/{filename}
        const storageRef = ref(storage, `profilePics/${user.uid}/${file.name}`);
        // Upload file
        await uploadBytes(storageRef, file);
        // Get download URL
        photoURL = await getDownloadURL(storageRef);
      }

      // 4) Save user profile data to Firestore
      // We'll merge so we don't overwrite if doc already exists
      await setDoc(
        doc(db, "users", user.uid),
        {
          firstName,
          lastName,
          phone: phoneNumber,
          photoURL,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      // 5) Redirect to main page
      alert("Profile setup complete!");
      window.location.href = "index.html";
    } catch (err) {
      console.error("Setup error:", err);
      alert("Error completing setup: " + err.message);
    }
  });
}

// GOOGLE SIGN-UP
const googleSignupBtn = document.getElementById("googleSignupBtn");
if (googleSignupBtn) {
  googleSignupBtn.addEventListener("click", async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      // If it's the user's first time, additionalUserInfo.isNewUser == true
      const isNewUser = result && result.additionalUserInfo?.isNewUser;
      if (isNewUser) {
        // brand-new user, direct them to setup
        alert("Google account created successfully!");
        window.location.href = "setup.html";
      } else {
        // existing user logs in with Google
        // if you want them to do setup anyway, do the same redirect
        // or skip if they already have a profile
        window.location.href = "index.html";
      }
    } catch (err) {
      console.error("Google sign-up error:", err);
      alert("Google sign-up error: " + err.message);
    }
  });
}

/*******************************************************
 * ACCOUNT PAGE - Display & Update Profile
 *******************************************************/
const accountProfilePic = document.getElementById("accountProfilePic");
const accountEmail = document.getElementById("accountEmail");
const accountPhone = document.getElementById("accountPhone");
const updateAccountForm = document.getElementById("updateAccountForm");

onAuthStateChanged(auth, async (user) => {
  // If we're on account.html, we have updateAccountForm
  if (updateAccountForm) {
    if (!user) {
      // Not logged in → redirect to login
      if (accountInfo) {
        accountInfo.textContent = "You are not logged in. Redirecting to login...";
      }
      setTimeout(() => {
        window.location.href = "login.html";
      }, 2000);
    } else {
      // Logged in → fetch user doc from Firestore
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      // If doc exists, populate the page
      if (userSnap.exists()) {
        const data = userSnap.data();

        // 1) Display greeting in #accountInfo
        const displayName = (data.firstName || "") + " " + (data.lastName || "");
        accountInfo.textContent = `Hello, ${displayName.trim()}!`;

        // 2) Show email from Firestore if stored, else from auth
        accountEmail.textContent = data.email || user.email || "";
        // 3) Show phone
        accountPhone.textContent = data.phone || "";

        // 4) Show profile pic if we have a photoURL
        if (data.photoURL) {
          accountProfilePic.src = data.photoURL;
        }

        // 5) Also fill the update form with current data
        document.getElementById("updateFirstName").value = data.firstName || "";
        document.getElementById("updateLastName").value = data.lastName || "";
        document.getElementById("updatePhone").value = data.phone || "";
      } else {
        // If doc doesn't exist, show minimal info
        accountInfo.textContent = `Hello, ${user.email} (no profile data found).`;
        // Optionally direct them to setup.html
      }
    }
  }
});

// Handle "Save Changes" form submission
if (updateAccountForm) {
  updateAccountForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Ensure user is logged in
    const user = auth.currentUser;
    if (!user) {
      alert("Not logged in.");
      return;
    }

    try {
      // Gather new values from the form
      const newFirstName = document.getElementById("updateFirstName").value.trim();
      const newLastName = document.getElementById("updateLastName").value.trim();
      const newPhone = document.getElementById("updatePhone").value.trim();
      const file = document.getElementById("newProfilePic").files[0];

      // (Optional) basic validation
      if (!newFirstName || !newLastName || !newPhone) {
        alert("Please fill in all fields before saving.");
        return;
      }

      // If user chose a new profile pic, upload it to Firebase Storage
      let newPhotoURL = accountProfilePic.src; // fallback to existing pic
      if (file) {
        const storage = getStorage(app);
        const storageRef = ref(storage, `profilePics/${user.uid}/${file.name}`);
        await uploadBytes(storageRef, file);
        newPhotoURL = await getDownloadURL(storageRef);
      }

      // Merge new data into Firestore doc
      await setDoc(
        doc(db, "users", user.uid),
        {
          firstName: newFirstName,
          lastName: newLastName,
          phone: newPhone,
          photoURL: newPhotoURL,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      // Update UI in real-time
      accountInfo.textContent = `Hello, ${newFirstName} ${newLastName}!`;
      accountPhone.textContent = newPhone;
      accountProfilePic.src = newPhotoURL;

      alert("Profile updated successfully!");
    } catch (err) {
      console.error("Update profile error:", err);
      alert("Error updating profile: " + err.message);
    }
  });
}
