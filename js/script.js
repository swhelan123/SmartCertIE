let selectedTopic = "";

/*******************************************************
 * FIREBASE v9 SETUP (MODULAR)
 *******************************************************/
// 1) Import Firebase SDK from CDN (using latest stable version)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  confirmPasswordReset,
  sendEmailVerification,
  deleteUser,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, addDoc, collection, query, orderBy, getDocs, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

// 2) Your Firebase configuration - Replace with YOUR_GEMINI_API_KEY placeholder in config.js if needed
const firebaseConfig = {
  apiKey: "AIzaSyDe5pXEGR015hQbXvoSGyJc955hgXO8tio",
  authDomain: "smartcert-f1965.firebaseapp.com",
  projectId: "smartcert-f1965",
  storageBucket: "smartcert-f1965.firebasestorage.app",
  messagingSenderId: "1075815326636",
  appId: "1:1075815326636:web:ffd63ed204d2832e295009",
  measurementId: "G-6CJR44Z4MK",
};

// 3) Initialize Firebase with improved error handling
let app;
let analytics;
try {
  app = initializeApp(firebaseConfig);
  analytics = getAnalytics(app);
  console.log("Firebase initialized successfully");
} catch (error) {
  console.error("Firebase initialization error:", error);
}

// 4) Get Auth & Firestore instances
export const auth = getAuth(app);
export const db = getFirestore(app);

const googleProvider = new GoogleAuthProvider();

/*******************************************************
 * REDIRECT IF LOGGED IN ALREADY
 *******************************************************/
// In script.js
if ((window.location.pathname === "/" || window.location.pathname.endsWith("index.html")) && !window.location.search.includes("showLanding")) {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      // If logged in, redirect to chat.html
      window.location.href = "chat.html";
    }
  });
}

/*******************************************************
 * DARK MODE ICON (SUN/MOON) — syncs desktop + mobile
 *******************************************************/
const body = document.body;
const modeIcon = document.getElementById("modeIcon");
const modeIconMobile = document.getElementById("modeIconMobile");
const modeIconSidebar = document.getElementById("modeIconSidebar");
const modeIconPanel = document.getElementById("modeIconPanel");
const allModeIcons = [modeIcon, modeIconMobile, modeIconSidebar, modeIconPanel].filter(Boolean);

function syncModeIcons(isDark) {
  const src = isDark ? "assets/img/light.png" : "assets/img/dark.png";
  allModeIcons.forEach((icon) => (icon.src = src));
}

if (allModeIcons.length) {
  // On page load
  if (localStorage.getItem("theme") === "dark") {
    body.classList.add("dark-mode");
    syncModeIcons(true);
  } else {
    syncModeIcons(false);
  }

  allModeIcons.forEach((icon) => {
    icon.addEventListener("click", () => {
      body.classList.toggle("dark-mode");
      const isDark = body.classList.contains("dark-mode");
      localStorage.setItem("theme", isDark ? "dark" : "light");
      syncModeIcons(isDark);
    });
  });
}

/*******************************************************
 * NAVIGATION LAYOUT PREFERENCE (top bar vs sidebar)
 *******************************************************/
const savedLayout = localStorage.getItem("smartcert_nav_layout") || "topbar";
if (savedLayout === "sidebar") {
  document.body.classList.add("layout-sidebar");
}

// Account page: layout toggle buttons
const layoutToggle = document.getElementById("layoutToggle");
if (layoutToggle) {
  const layoutBtns = layoutToggle.querySelectorAll("button[data-layout]");

  // Set initial active state from saved preference
  layoutBtns.forEach((btn) => {
    const isActive = btn.getAttribute("data-layout") === savedLayout;
    btn.style.background = isActive ? "#3b82f6" : "#fff";
    btn.style.color = isActive ? "#fff" : "#333";
    btn.style.borderColor = isActive ? "#3b82f6" : "#ccc";
  });

  layoutBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const layout = btn.getAttribute("data-layout");
      localStorage.setItem("smartcert_nav_layout", layout);

      // Update button styles
      layoutBtns.forEach((b) => {
        const active = b.getAttribute("data-layout") === layout;
        b.style.background = active ? "#3b82f6" : "#fff";
        b.style.color = active ? "#fff" : "#333";
        b.style.borderColor = active ? "#3b82f6" : "#ccc";
      });
    });
  });
}

/*******************************************************
 * AUTH STATE & UI TOGGLING
 *******************************************************/
// Elements for desktop + mobile
const loginBtn = document.getElementById("loginBtn");
const loginBtnMobile = document.getElementById("loginBtnMobile");
const profilePic = document.getElementById("profilePic");
const profilePicMobile = document.getElementById("profilePicMobile");
const sidebarPfp = document.getElementById("panelPfp");
const accountLink = document.getElementById("panelAccountLink");
const allLoginBtns = [loginBtn, loginBtnMobile].filter(Boolean);
const allProfilePics = [profilePic, profilePicMobile].filter(Boolean);

// Listen for Firebase auth changes (logged in/out)
onAuthStateChanged(auth, async (user) => {
  // Ensure the chat UI elements exist
  if (!chatContainer || !chatInput || !sendBtn || !chatMessages) return;

  if (user) {
    allLoginBtns.forEach((btn) => btn.classList.add("hidden"));
    allProfilePics.forEach((pic) => pic.classList.remove("hidden"));
    if (accountLink) accountLink.setAttribute("href", "account.html");

    const userDocRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userDocRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      const subscriptionStatus = userData.subscriptionStatus || "not-subscribed";

      // Set global userAvatarUrl using the user's profile photo or fallback
      window.userAvatarUrl = userData.photoURL || "assets/img/pfp.avif";
      if (sidebarPfp) sidebarPfp.src = userData.photoURL || "assets/img/pfp.avif";
      if (userData.photoURL) {
        allProfilePics.forEach((pic) => {
          pic.src = userData.photoURL;
          pic.onerror = function() {
            this.src = "assets/img/pfp.avif";
            window.userAvatarUrl = "assets/img/pfp.avif";
          };
        });
        if (sidebarPfp) {
          sidebarPfp.onerror = function() { this.src = "assets/img/pfp.avif"; };
        }
      } else if (sidebarPfp) {
        sidebarPfp.src = "assets/img/pfp.avif";
      }

      if (subscriptionStatus === "active") {
        chatInput.disabled = false;
        sendBtn.disabled = false;
        const subscribeBtn = document.getElementById("subscribeBtn");
        if (subscribeBtn) subscribeBtn.classList.add("hidden");
        // Load chat history
        cleanupOldSessions().then(() => loadAndRenderChatHistory());
      } else {
        chatInput.disabled = true;
        sendBtn.disabled = true;
        chatMessages.innerHTML = `
          <div class="chat-message message-bot">
            Click subscribe to use SmartCert chat.
          </div>`;
        let subscribeBtn = document.getElementById("subscribeBtn");
        if (!subscribeBtn) {
          subscribeBtn = document.createElement("button");
          subscribeBtn.id = "subscribeBtn";
          subscribeBtn.className = "login-button";
          subscribeBtn.textContent = "Subscribe";
          const container = document.getElementById("topBar") || document.getElementById("topRightContainer");
          if (container) container.appendChild(subscribeBtn);
        } else {
          subscribeBtn.classList.remove("hidden");
        }
      }
    } else {
      window.location.href = "setup.html";
    }
  } else {
    window.userAvatarUrl = "assets/img/pfp.avif";
    chatInput.disabled = true;
    sendBtn.disabled = true;
    chatMessages.innerHTML = `
      <div class="chat-message message-bot">
        You must be logged in to use the chat.
        <a class="click-link" href="login.html">Log in here</a>.
      </div>`;
    allLoginBtns.forEach((btn) => btn.classList.remove("hidden"));
    const subscribeBtn = document.getElementById("subscribeBtn");
    if (subscribeBtn) subscribeBtn.classList.add("hidden");
  }
});

allProfilePics.forEach((pic) => {
  pic.addEventListener("click", () => {
    window.location.href = "account.html";
  });
});

// Event listener for clicking login (desktop + mobile)
allLoginBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    window.location.href = "login.html";
  });
});

/*******************************************************
 * NAV ON chat.html (Top bar + Sidebar, Single-Page Sections)
 *******************************************************/
const sidebarLinks = document.querySelectorAll(".panel-nav-link[data-section]");
const topBarLinks = document.querySelectorAll(".top-bar-link[data-section]");
const allNavLinks = [...sidebarLinks, ...topBarLinks];
const chatSection = document.getElementById("chatSection");
const notebookSection = document.getElementById("notebookSection");

// --- Set default state: show chat and highlight its link ---
if (chatSection && notebookSection) {
  chatSection.classList.remove("hidden");
  notebookSection.classList.add("hidden");
}
const chatLink = document.querySelector(".panel-nav-link[data-section='chatSection']");
if (chatLink) {
  chatLink.classList.add("active");
}

// --- Topic-to-unit mapping for notebook filters ---
const topicToUnit = {};
// We’ll populate this after chapters is defined (below), but define the
// lookup here so the notebook code can use it. It gets filled in later.

// --- Notebook rendering helpers ---
let allNotebookEntries = []; // cache for filtering

function getUnitForTopic(topicName) {
  // Lazy-build the lookup from the chapters object (defined further down)
  if (Object.keys(topicToUnit).length === 0 && typeof chapters !== "undefined") {
    Object.entries(chapters).forEach(([unit, topics]) => {
      topics.forEach((t) => { topicToUnit[t.name] = unit; });
    });
  }
  return topicToUnit[topicName] || null;
}

function renderNotebookGrid(entries) {
  const grid = document.getElementById("notebookGrid");
  if (!grid) return;
  grid.innerHTML = "";

  if (entries.length === 0) {
    grid.innerHTML = "<p style=\"text-align:center;color:#888;\">No saved entries yet. Save responses from the chat to see them here.</p>";
    return;
  }

  entries.forEach((entry) => {
    const card = document.createElement("div");
    card.classList.add("notebook-card");

    const heading = document.createElement("div");
    heading.classList.add("notebook-card-heading");
    heading.textContent = entry.question || "Saved response";

    const preview = document.createElement("div");
    preview.style.cssText = "font-size:0.85rem;color:#666;overflow:hidden;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;";
    preview.textContent = (entry.text || "").substring(0, 150);

    if (entry.topic) {
      const tag = document.createElement("span");
      tag.style.cssText = "display:inline-block;margin-top:0.5rem;font-size:0.75rem;background:#e0e7ff;color:#3b82f6;padding:2px 8px;border-radius:9999px;";
      tag.textContent = entry.topic;
      card.appendChild(heading);
      card.appendChild(preview);
      card.appendChild(tag);
    } else {
      card.appendChild(heading);
      card.appendChild(preview);
    }

    // Click card to open modal
    card.addEventListener("click", () => openNotebookModal(entry));
    grid.appendChild(card);
  });
}

function openNotebookModal(entry) {
  const modal = document.getElementById("notebookModal");
  const questionEl = document.getElementById("notebookModalQuestion");
  const answerEl = document.getElementById("notebookModalAnswer");
  const dateEl = document.getElementById("notebookModalDate");
  const deleteBtn = document.getElementById("notebookModalDelete");
  const editBtn = document.getElementById("notebookModalEdit");
  const closeBtn = document.getElementById("notebookModalClose");
  if (!modal) return;

  questionEl.textContent = entry.question || "Saved response";

  // Render markdown if marked is available
  if (typeof marked !== "undefined") {
    answerEl.innerHTML = marked.parse(entry.text || "");
  } else {
    answerEl.textContent = entry.text || "";
  }

  // Format date
  if (entry.createdAt && entry.createdAt.toDate) {
    dateEl.textContent = entry.createdAt.toDate().toLocaleDateString("en-IE", {
      day: "numeric", month: "short", year: "numeric",
    });
  } else {
    dateEl.textContent = "";
  }

  // Wire edit button (clone to remove old listeners)
  if (editBtn) {
    const newEditBtn = editBtn.cloneNode(true);
    editBtn.parentNode.replaceChild(newEditBtn, editBtn);
    newEditBtn.addEventListener("click", () => {
      // Switch answer area to editable textarea
      const currentText = entry.text || "";
      answerEl.innerHTML = "";
      const textarea = document.createElement("textarea");
      textarea.value = currentText;
      textarea.style.cssText = "width:100%;height:100%;min-height:200px;font-family:inherit;font-size:0.95rem;padding:0.5rem;border:1px solid #ccc;border-radius:8px;resize:vertical;box-sizing:border-box;";
      answerEl.appendChild(textarea);
      textarea.focus();

      // Change edit button to save button
      newEditBtn.textContent = "Save";
      newEditBtn.style.backgroundColor = "#16a34a";

      // Clone again for save handler
      const saveBtn = newEditBtn.cloneNode(true);
      newEditBtn.parentNode.replaceChild(saveBtn, newEditBtn);
      saveBtn.addEventListener("click", async () => {
        const newText = textarea.value.trim();
        if (!newText) {
          customAlert("Note cannot be empty.");
          return;
        }

        try {
          await updateDoc(doc(db, "users", auth.currentUser.uid, "notebook", entry.id), {
            text: newText,
          });
          // Update the cached entry
          entry.text = newText;
          // Re-render the modal in view mode
          if (typeof marked !== "undefined") {
            answerEl.innerHTML = marked.parse(newText);
          } else {
            answerEl.textContent = newText;
          }
          // Reset button
          saveBtn.textContent = "Edit";
          saveBtn.style.backgroundColor = "#3b82f6";
          // Re-render grid to reflect changes
          renderNotebookGrid(currentFilteredEntries());
          customAlert("Note updated!");
        } catch (err) {
          console.error("Error updating note:", err);
          customAlert("Could not save changes: " + err.message);
        }
      });
    });
  }

  // Wire delete button (clone to remove old listeners)
  const newDeleteBtn = deleteBtn.cloneNode(true);
  deleteBtn.parentNode.replaceChild(newDeleteBtn, deleteBtn);
  newDeleteBtn.addEventListener("click", async () => {
    const confirmed = await showCustomConfirm("Are you sure you want to delete this entry?");
    if (!confirmed) return;
    try {
      await deleteDoc(doc(db, "users", auth.currentUser.uid, "notebook", entry.id));
      modal.classList.add("hidden");
      allNotebookEntries = allNotebookEntries.filter((e) => e.id !== entry.id);
      renderNotebookGrid(currentFilteredEntries());
    } catch (err) {
      console.error("Error deleting doc:", err);
      customAlert("Could not delete entry");
    }
  });

  // Wire close button
  const newCloseBtn = closeBtn.cloneNode(true);
  closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
  newCloseBtn.addEventListener("click", () => modal.classList.add("hidden"));

  // Close on backdrop click
  modal.onclick = (e) => {
    if (e.target === modal) modal.classList.add("hidden");
  };

  modal.classList.remove("hidden");
}

// --- Notebook filter state ---
let activeNotebookUnit = "all";
let activeNotebookChapter = null;

function currentFilteredEntries() {
  if (activeNotebookUnit === "all") return allNotebookEntries;
  const unitFiltered = allNotebookEntries.filter((e) => getUnitForTopic(e.topic) === activeNotebookUnit);
  if (!activeNotebookChapter) return unitFiltered;
  return unitFiltered.filter((e) => e.topic === activeNotebookChapter);
}

// --- Notebook filter buttons ---
const notebookUnitBtns = document.querySelectorAll("#notebookUnitContainer .unit-button");
const notebookChapterContainer = document.getElementById("notebookChapterContainer");

notebookUnitBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const unit = btn.getAttribute("data-unit");
    notebookUnitBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    activeNotebookUnit = unit;
    activeNotebookChapter = null;

    // Clear chapter sub-filters
    if (notebookChapterContainer) {
      notebookChapterContainer.innerHTML = "";
      notebookChapterContainer.classList.add("hidden");
    }

    if (unit !== "all" && typeof chapters !== "undefined" && chapters[unit]) {
      // Show chapter sub-filter buttons
      const allChapterBtn = document.createElement("button");
      allChapterBtn.textContent = "All " + (unit === "A" ? "Unit 1" : unit === "B" ? "Unit 2" : "Unit 3");
      allChapterBtn.classList.add("chapter-button", "active");
      if (unit === "A") allChapterBtn.classList.add("unit-green");
      else if (unit === "B") allChapterBtn.classList.add("unit-purple");
      else if (unit === "C") allChapterBtn.classList.add("unit-red");

      allChapterBtn.addEventListener("click", () => {
        activeNotebookChapter = null;
        notebookChapterContainer.querySelectorAll(".chapter-button").forEach((b) => b.classList.remove("active"));
        allChapterBtn.classList.add("active");
        renderNotebookGrid(currentFilteredEntries());
      });
      notebookChapterContainer.appendChild(allChapterBtn);

      chapters[unit].forEach((ch) => {
        const chBtn = document.createElement("button");
        chBtn.textContent = ch.name;
        chBtn.classList.add("chapter-button");
        if (unit === "A") chBtn.classList.add("unit-green");
        else if (unit === "B") chBtn.classList.add("unit-purple");
        else if (unit === "C") chBtn.classList.add("unit-red");

        chBtn.addEventListener("click", () => {
          activeNotebookChapter = ch.name;
          notebookChapterContainer.querySelectorAll(".chapter-button").forEach((b) => b.classList.remove("active"));
          chBtn.classList.add("active");
          renderNotebookGrid(currentFilteredEntries());
        });
        notebookChapterContainer.appendChild(chBtn);
      });

      notebookChapterContainer.classList.remove("hidden");
    }

    renderNotebookGrid(currentFilteredEntries());
  });
});

// --- Shared section-switching handler (works for both top bar + sidebar) ---
async function switchSection(target) {
  if (!chatSection || !notebookSection) return;

  // 1) Hide both sections
  chatSection.classList.add("hidden");
  notebookSection.classList.add("hidden");

  // 2) Show the chosen section
  if (target === "chatSection") {
    chatSection.classList.remove("hidden");
  }
  if (target === "notebookSection") {
    notebookSection.classList.remove("hidden");

    // Load the user’s notebook and render as card grid
    allNotebookEntries = await window.loadNotebookEntries();
    activeNotebookUnit = "all";
    activeNotebookChapter = null;
    renderNotebookGrid(allNotebookEntries);

    // Reset filter to "All"
    notebookUnitBtns.forEach((b) => b.classList.remove("active"));
    const allBtn = document.querySelector("#notebookUnitContainer [data-unit=\"all\"]");
    if (allBtn) allBtn.classList.add("active");

    // Clear chapter sub-filters
    if (notebookChapterContainer) {
      notebookChapterContainer.innerHTML = "";
      notebookChapterContainer.classList.add("hidden");
    }
  }

  // 3) Sync ‘active’ state across ALL nav links (sidebar + top bar)
  allNavLinks.forEach((lnk) => lnk.classList.remove("active"));
  // Highlight matching links in both navs
  allNavLinks.forEach((lnk) => {
    if (lnk.getAttribute("data-section") === target) {
      lnk.classList.add("active");
    }
  });
}

// Attach handler to all nav links (sidebar + top bar)
allNavLinks.forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    switchSection(link.getAttribute("data-section"));
  });
});

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
  A: [
    {name: "The Scientific Method", id: "topic-1-the-scientific-method"},
    {name: "The Characteristics of Life", id: "topic-2-characteristics-of-life"},
    {name: "Nutrition", id: "topic-3-nutrition"},
    {name: "General Principles of Ecology", id: "topic-5-general-principles-of-ecology"},
    {name: "A Study of an Ecosystem", id: "topic-6-study-of-an-ecosystem"},
  ],
  B: [
    {name: "Cell Structure", id: "topic-7-cell-structure"},
    {name: "Cell Metabolism", id: "topic-8-cell-metabolism"},
    {name: "Cell Continuity", id: "topic-9-cell-continuity"},
    {name: "Cell Diversity", id: "topic-10-cell-diversity"},
    {name: "Genetics", id: "topic-11-genetics"},
  ],
  C: [
    {name: "Diversity of Organisms", id: "topic-12-diversity-of-organisms"},
    {name: "Organisation and the Vascular Structures", id: "topic-13-organisation-and-the-vascular-structure"},
    {name: "Transport and Nutrition", id: "topic-14-transport-and-nutrition"},
    {name: "Breathing System and Excretion", id: "topic-15-breathing-system-and-excretion"},
    {name: "Responses to Stimuli", id: "topic-16-responses-to-stimuli"},
    {name: "Reproduction and Growth", id: "topic-17-reproduction-and-growth"},
  ],
};

// Grab only chat topic unit buttons (not notebook filter buttons)
const unitButtons = document.querySelectorAll("#unitContainer .unit-button");

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
      chapters[unit].forEach((chapterObj) => {
        const chapterBtn = document.createElement("button");
        chapterBtn.textContent = chapterObj.name;
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
          // Display the selected chapter name with unit color
          selectedTopicLabel.textContent = chapterObj.name;
          selectedTopicLabel.classList.remove("unit-green", "unit-purple", "unit-red");
          if (unit === "A") selectedTopicLabel.classList.add("unit-green");
          else if (unit === "B") selectedTopicLabel.classList.add("unit-purple");
          else if (unit === "C") selectedTopicLabel.classList.add("unit-red");
          selectedTopic = chapterObj.name;
          window.selectedTopic = chapterObj.name;
          window.currentTopicId = chapterObj.id;
          // Show the container that holds the "Change Topic" button
          selectedTopicContainer.classList.remove("hidden");
          // Update chat history if in "By Topic" mode
          if (panelViewMode === "byTopic") {
            rerenderFilteredHistory();
          }
        });

        chapterContainer.appendChild(chapterBtn);
      });
    }

    // 5) Show the chapter container with the newly created buttons
    chapterContainer.classList.remove("hidden");
  });
});

// Handle the "Change Topic" button — starts a new chat
if (changeTopicBtn) {
  changeTopicBtn.addEventListener("click", () => {
    window.startNewChat();
  });
}

/*******************************************************
 * LOGIN PAGE (login.html) - Real Firebase Login
 *******************************************************/
const loginForm = document.getElementById("loginForm");
const errorMessage = document.getElementById("errorMessage");

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const emailVal = document.getElementById("emailInput")?.value.trim();
    const passVal = document.getElementById("passwordInput")?.value.trim();

    if (!emailVal || !passVal) {
      errorMessage.textContent = "Please enter email and password.";
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, emailVal, passVal);
      window.location.href = "chat.html"; // Successful login, redirect user
    } catch (err) {
      errorMessage.textContent = "Invalid email or password. Please try again.";
    }
  });
}

/*******************************************************
 * ACCOUNT PAGE (account.html)
 *******************************************************/
const accountInfo = document.getElementById("accountInfo");
const logoutBtn = document.getElementById("logoutBtn");
// We'll check auth state to see if user is logged in
const deleteAccountBtn = document.getElementById("deleteAccountBtn");

onAuthStateChanged(auth, (user) => {
  if (accountInfo && logoutBtn) {
    if (!user) {
      accountInfo.textContent = "You are not logged in. Redirecting to login...";
      setTimeout(() => {
        window.location.href = "index.html";
      }, 2000);
    } else {
      accountInfo.textContent = "Welcome to your account page! (Firebase user: " + user.email + ")";
      logoutBtn.addEventListener("click", async () => {
        await signOut(auth);
        customAlert("Logged out!");
      });

      // Delete account handler
      if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener("click", async () => {
          const confirmed = await showCustomConfirm(
            "Are you sure you want to permanently delete your account and all your data? This cannot be undone."
          );
          if (!confirmed) return;

          try {
            const uid = user.uid;
            // Delete notebook subcollection entries
            const notebookRef = collection(db, "users", uid, "notebook");
            const notebookSnap = await getDocs(notebookRef);
            const deletePromises = [];
            notebookSnap.forEach((docSnap) => {
              deletePromises.push(deleteDoc(doc(db, "users", uid, "notebook", docSnap.id)));
            });

            // Delete chat sessions subcollection entries
            const sessionsRef = collection(db, "users", uid, "chatSessions");
            const sessionsSnap = await getDocs(sessionsRef);
            sessionsSnap.forEach((docSnap) => {
              deletePromises.push(deleteDoc(doc(db, "users", uid, "chatSessions", docSnap.id)));
            });

            await Promise.all(deletePromises);

            // Delete user document
            await deleteDoc(doc(db, "users", uid));

            // Delete Firebase auth account
            await deleteUser(user);

            customAlert("Your account has been deleted.");
            window.location.href = "index.html";
          } catch (err) {
            console.error("Error deleting account:", err);
            if (err.code === "auth/requires-recent-login") {
              customAlert("For security, please log out and log back in before deleting your account.");
            } else {
              customAlert("Error deleting account: " + err.message);
            }
          }
        });
      }
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
      customAlert("Please fill in all fields.");
      return;
    }
    if (passVal !== confirmVal) {
      customAlert("Passwords do not match.");
      return;
    }

    try {
      // Create user with Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, emailVal, passVal);
      // Send verification email
      await sendEmailVerification(userCredential.user);
      customAlert("Account created! Please check your email to verify your account.");
      window.location.href = "setup.html";
    } catch (err) {
      customAlert("Sign-up error: " + err.message);
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
      customAlert("You must be logged in!");
      return;
    }

    // 2) Gather form inputs
    const file = document.getElementById("profilePicInput").files[0];
    let photoURL = "";

    // 3) If user selected a file, upload to Storage
    if (file) {
      const storage = getStorage(app);
      // Save under /profilePics/{uid}/{filename}
      const storageRef = ref(storage, `profilePics/${user.uid}/${file.name}`);
      // Upload the file
      await uploadBytes(storageRef, file);
      // Get a download URL to store in Firestore
      photoURL = await getDownloadURL(storageRef);
    }

    // 4) Save user profile data to Firestore (including photoURL)
    await setDoc(
      doc(db, "users", user.uid),
      {
        photoURL,
        // plus any other fields: name, phone, etc.
      },
      { merge: true },
    );

    // 5) Redirect or show success
    customAlert("Profile setup complete!");
    window.location.href = "chat.html";
  });
}

// GOOGLE SIGN-UP
const googleSignupBtn = document.getElementById("googleSignupBtn");
if (googleSignupBtn) {
  googleSignupBtn.addEventListener("click", async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // 1) Check if there's a user doc in Firestore
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // No doc => definitely new user => redirect to setup
        customAlert("Google account created successfully!");
        window.location.href = "setup.html";
      } else {
        // Existing user => go to home (or skip if you want them to do setup anyway)
        window.location.href = "chat.html";
      }
    } catch (err) {
      console.error("Google sign-up error:", err);
      customAlert("Google sign-up error");
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
          // Add error handling for account profile picture loading
          accountProfilePic.onerror = function() {
            this.src = "assets/img/pfp.avif"; // Fallback to default if user image fails to load
          };
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

    const user = auth.currentUser;
    if (!user) {
      customAlert("Not logged in!");
      return;
    }

    try {
      // 1) Check if user selected a new file
      const file = document.getElementById("newProfilePic").files[0];
      let newPhotoURL = ""; // fallback or existing photo

      if (file) {
        // 2) Upload to Storage
        const storage = getStorage(app);
        const storageRef = ref(storage, `profilePics/${user.uid}/${file.name}`);
        await uploadBytes(storageRef, file);
        newPhotoURL = await getDownloadURL(storageRef);
      }

      // 3) Merge new photoURL into Firestore
      await setDoc(
        doc(db, "users", user.uid),
        {
          photoURL: newPhotoURL,
          // plus any other updated fields
        },
        { merge: true },
      );

      // 4) Update the <img> on account page (if you want immediate UI update)
      accountProfilePic.src = newPhotoURL || "assets/img/pfp.avif";
      // Also update the global userAvatarUrl for chat usage
      window.userAvatarUrl = newPhotoURL || "assets/img/pfp.avif";
      // Update the top navigation profile pic if it exists
      if (profilePic) {
        profilePic.src = newPhotoURL || "assets/img/pfp.avif";
      }

      customAlert("Profile updated successfully!");
      window.location.href = "chat.html";
    } catch (err) {
      console.error("Update profile error:", err);
      customAlert("Error updating profile: " + err.message);
    }
  });
}

// Grab references to the chat elements
const chatContainer = document.getElementById("chatSection");
const chatInput = document.getElementById("chatInput");
const sendBtn = document.getElementById("sendBtn");
const chatMessages = document.getElementById("chatMessages");

// FORGOT PASSWORD PAGE
const forgotPassForm = document.getElementById("forgotPassForm");
if (forgotPassForm) {
  forgotPassForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // 1) Grab the email from the resetEmailInput field
    const resetEmailVal = document.getElementById("resetEmailInput")?.value.trim();
    if (!resetEmailVal) {
      customAlert("Please enter your email address.");
      return;
    }

    try {
      // 2) Use Firebase to send the password reset email
      await sendPasswordResetEmail(auth, resetEmailVal);
      customAlert(`Password reset email sent to: ${resetEmailVal}`);

      // Optionally, redirect them to login or show a success message
      window.location.href = "login.html";
    } catch (err) {
      console.error("Password reset error:", err);
      customAlert("Error sending reset email: " + err.message);
    }
  });
}

// On make_new_pass.html
const newPassForm = document.getElementById("newPassForm");
if (newPassForm) {
  // 1) Parse the 'oobCode' from the URL
  const queryParams = new URLSearchParams(window.location.search);
  const oobCode = queryParams.get("oobCode"); // e.g. ?oobCode=abc123

  if (!oobCode) {
    customAlert("Invalid or missing reset code in URL.");
    // optionally redirect them somewhere
  }

  // 2) Add event listener to the form
  newPassForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const newPassword = document.getElementById("newPassword").value.trim();
    const confirmPassword = document.getElementById("confirmPassword").value.trim();

    // Basic checks
    if (!newPassword || !confirmPassword) {
      customAlert("Please fill out both fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      customAlert("Passwords do not match.");
      return;
    }

    try {
      // 3) Confirm the password reset using Firebase
      await confirmPasswordReset(auth, oobCode, newPassword);
      customAlert("Your password has been reset successfully!");

      // Optionally redirect to login or auto-login
      window.location.href = "login.html";
    } catch (error) {
      console.error("confirmPasswordReset error:", error);
      customAlert("Error resetting password: " + error.message);
    }
  });

  // 3) Optional: Toggle password visibility
  const toggleButtons = document.querySelectorAll(".toggle-pass-btn");
  toggleButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-target");
      const targetInput = document.getElementById(targetId);
      if (targetInput.type === "password") {
        targetInput.type = "text";
        btn.textContent = "Hide";
      } else {
        targetInput.type = "password";
        btn.textContent = "Show";
      }
    });
  });
}

/*******************************************************
 * Subscribe button
 *******************************************************/

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userDocRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userDocRef);
    if (userSnap.exists()) {
      const userData = userSnap.data();
      const subscriptionStatus = userData.subscriptionStatus || "not-subscribed";

      if (subscriptionStatus !== "active") {
        // Only create/show button if not subscribed

        let subscribeBtn = document.getElementById("subscribeBtn");
        if (!subscribeBtn) {
          subscribeBtn = document.createElement("button");
          subscribeBtn.id = "subscribeBtn";
          subscribeBtn.className = "login-button"; // Use your desired styling class
          subscribeBtn.textContent = "Subscribe";
          const container = document.getElementById("topBar") || document.getElementById("topRightContainer");
          if (container) container.appendChild(subscribeBtn);
        } else {
          subscribeBtn.classList.remove("hidden");
        }

        // Only attach the event listener once
        if (!subscribeBtn.dataset.listenerAttached) {
          subscribeBtn.addEventListener("click", async () => {
            const currentUser = auth.currentUser;
            if (!currentUser) {
              customAlert("You must be logged in to subscribe.");
              return;
            }

            try {
              const endpointURL = "https://createcheckoutsession-63mubklboq-uc.a.run.app";
              const response = await fetch(endpointURL, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ firebaseUserId: currentUser.uid }),
              });

              const data = await response.json();

              if (data.url) {
                window.location.href = data.url;
              } else {
                console.error("No checkout URL returned:", data);
                customAlert("An error occurred while creating the checkout session.");
              }
            } catch (err) {
              console.error("Error creating checkout session:", err);
              customAlert("An error occurred while processing your subscription.");
            }
          });
          subscribeBtn.dataset.listenerAttached = "true";
        }
      } else {
        // If user is subscribed, ensure the subscribe button is hidden
        const subscribeBtn = document.getElementById("subscribeBtn");
        if (subscribeBtn) subscribeBtn.classList.add("hidden");
      }
    }
  }
});

/*******************************************************
 * Subscribe button for pricing page
 *******************************************************/

// Grab the “Get full access” button from pricing.html
const subscribeCertiBtn = document.getElementById("subscribeCertiBtn");

onAuthStateChanged(auth, async (user) => {
  // If the button doesn’t exist on this page, do nothing
  if (!subscribeCertiBtn) return;

  // Remove any existing click listeners so we don't attach multiple
  // (optional, only needed if user might sign in/out while on the page)
  const newBtn = subscribeCertiBtn.cloneNode(true);
  subscribeCertiBtn.parentNode.replaceChild(newBtn, subscribeCertiBtn);

  // Reassign the new reference
  const finalBtn = document.getElementById("subscribeCertiBtn");

  if (!user) {
    // 1) Not logged in => Clicking button sends them to login
    finalBtn.textContent = "Get full access";
    finalBtn.disabled = false;
    finalBtn.addEventListener("click", () => {
      customAlert("You must be logged in to subscribe.");
      window.location.href = "login.html";
    });
  } else {
    // 2) User is logged in => Check their subscription status
    try {
      const userDocRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userDocRef);

      if (!userSnap.exists()) {
        // If no user doc, direct them to setup or handle accordingly
        finalBtn.textContent = "Complete Setup";
        finalBtn.disabled = false;
        finalBtn.addEventListener("click", () => {
          window.location.href = "setup.html";
        });
        return;
      }

      const userData = userSnap.data();
      const subscriptionStatus = userData.subscriptionStatus || "not-subscribed";

      if (subscriptionStatus === "active") {
        // 3) Already subscribed => Show “Current Plan” + disable
        finalBtn.textContent = "Current Plan";
        finalBtn.disabled = true;
        finalBtn.classList.add("current-plan");
      } else {
        // 4) Not subscribed => Attach your Stripe checkout logic
        finalBtn.textContent = "Get full access";
        finalBtn.disabled = false;

        finalBtn.addEventListener("click", async () => {
          try {
            const endpointURL = "https://createcheckoutsession-63mubklboq-uc.a.run.app";
            const response = await fetch(endpointURL, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ firebaseUserId: user.uid }),
            });

            const data = await response.json();
            if (data.url) {
              window.location.href = data.url; // Stripe checkout
            } else {
              console.error("No checkout URL returned:", data);
              customAlert("An error occurred while creating the checkout session.");
            }
          } catch (err) {
            console.error("Error creating checkout session:", err);
            customAlert("An error occurred while processing your subscription.");
          }
        });
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
      customAlert("An error occurred while checking your subscription status.");
    }
  }
});

/*******************************************************
 * DYNAMIC ROUTING FROM LANDING
 *******************************************************/
const log = getAuth();
const navChatLink = document.getElementById("navChatLink");
if (navChatLink) {
  navChatLink.addEventListener("click", (e) => {
    e.preventDefault();
    const user = log.currentUser;
    if (user) {
      // If logged in, go straight to chat
      window.location.href = "chat.html";
    } else {
      // If not logged in, go to login page
      window.location.href = "login.html";
    }
  });
}

/*******************************************************
 * NOTEBOOK
 *******************************************************/

// We'll define a global function so we can call it from chat.js
window.saveNotebookEntry = async function (answer, question) {
  const user = auth.currentUser;
  if (!user) {
    customAlert("Please log in to save to your notebook!");
    return;
  }

  try {
    // Create a new doc in /users/{uid}/notebook
    await addDoc(collection(db, "users", user.uid, "notebook"), {
      text: answer,
      question: question || "", // Store the question as well
      topic: window.selectedTopic || "",
      createdAt: serverTimestamp(),
    });

    customAlert("Response saved to notebook!");
  } catch (err) {
    console.error("Error saving notebook entry:", err);
    customAlert("Couldn't save to notebook: " + err.message);
  }
};

window.loadNotebookEntries = async function () {
  const user = auth.currentUser;
  if (!user) return [];

  const qRef = query(collection(db, "users", user.uid, "notebook"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(qRef);

  const entries = [];
  snapshot.forEach((docSnap) => {
    // Grab docSnap.id plus the actual data
    entries.push({
      id: docSnap.id,
      ...docSnap.data(),
    });
  });
  return entries;
};

/*******************************************************
 * CHAT HISTORY / SESSIONS
 *******************************************************/

window.currentSessionId = null;
window.currentSessionMessages = [];

// Chat history view mode: "recent" (all) or "byTopic" (filtered by selected topic)
let panelViewMode = "recent";
let allChatSessions = []; // cached for filtering

// Load all chat sessions for the current user
async function loadChatSessions() {
  const user = auth.currentUser;
  if (!user) return [];

  const sessionsRef = collection(db, "users", user.uid, "chatSessions");
  const q = query(sessionsRef, orderBy("updatedAt", "desc"));
  const snapshot = await getDocs(q);

  const sessions = [];
  snapshot.forEach((docSnap) => {
    sessions.push({ id: docSnap.id, ...docSnap.data() });
  });
  return sessions;
}

// Clean up sessions older than 7 days that aren't favourited
async function cleanupOldSessions() {
  const user = auth.currentUser;
  if (!user) return;

  try {
    const sessions = await loadChatSessions();
    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;

    for (const session of sessions) {
      if (session.favourited) continue;

      let createdAt;
      if (session.createdAt && session.createdAt.toDate) {
        createdAt = session.createdAt.toDate().getTime();
      } else if (session.createdAt && session.createdAt.seconds) {
        createdAt = session.createdAt.seconds * 1000;
      } else {
        continue;
      }

      if (now - createdAt > sevenDays) {
        await deleteDoc(doc(db, "users", user.uid, "chatSessions", session.id));
      }
    }
  } catch (err) {
    console.error("Error cleaning up old sessions:", err);
  }
}

// Render chat history in the panel
function renderChatHistory(sessions) {
  const listEl = document.getElementById("chatHistoryList");
  if (!listEl) return;

  listEl.innerHTML = "";

  if (sessions.length === 0) {
    listEl.innerHTML = '<p class="chat-history-empty">No previous chats</p>';
    return;
  }

  // Group by time period
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const sevenDaysAgo = new Date(today.getTime() - 7 * 86400000);

  const groups = { today: [], yesterday: [], week: [], older: [] };

  sessions.forEach((session) => {
    let sessionDate;
    if (session.updatedAt && session.updatedAt.toDate) {
      sessionDate = session.updatedAt.toDate();
    } else if (session.createdAt && session.createdAt.toDate) {
      sessionDate = session.createdAt.toDate();
    } else {
      sessionDate = new Date(0);
    }

    if (sessionDate >= today) {
      groups.today.push(session);
    } else if (sessionDate >= yesterday) {
      groups.yesterday.push(session);
    } else if (sessionDate >= sevenDaysAgo) {
      groups.week.push(session);
    } else {
      groups.older.push(session);
    }
  });

  function addGroup(label, items) {
    if (items.length === 0) return;

    const groupLabel = document.createElement("div");
    groupLabel.className = "chat-history-group-label";
    groupLabel.textContent = label;
    listEl.appendChild(groupLabel);

    items.forEach((session) => {
      const item = document.createElement("div");
      item.className = "chat-session-item";
      if (session.id === window.currentSessionId) {
        item.classList.add("active");
      }

      const titleSpan = document.createElement("span");
      titleSpan.className = "session-title";
      titleSpan.textContent = session.title || "New Chat";
      titleSpan.addEventListener("click", () => window.loadChatSession(session.id));

      const actions = document.createElement("div");
      actions.className = "session-actions";

      const renameBtn = document.createElement("button");
      renameBtn.className = "session-rename-btn";
      renameBtn.innerHTML = "&#9998;";
      renameBtn.title = "Rename chat";
      renameBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        // Turn title into an editable input
        const input = document.createElement("input");
        input.type = "text";
        input.className = "session-rename-input";
        input.value = session.title || "";
        input.maxLength = 60;

        titleSpan.replaceWith(input);
        input.focus();
        input.select();

        const saveRename = async () => {
          const newTitle = input.value.trim();
          if (newTitle && newTitle !== session.title) {
            await window.renameSession(session.id, newTitle);
          } else {
            // Revert if empty or unchanged
            input.replaceWith(titleSpan);
          }
        };

        input.addEventListener("keydown", (ev) => {
          if (ev.key === "Enter") {
            ev.preventDefault();
            saveRename();
          }
          if (ev.key === "Escape") {
            input.replaceWith(titleSpan);
          }
        });
        input.addEventListener("blur", saveRename);
      });

      const favBtn = document.createElement("button");
      favBtn.className = "session-fav-btn" + (session.favourited ? " favourited" : "");
      favBtn.innerHTML = session.favourited ? "&#9733;" : "&#9734;";
      favBtn.title = session.favourited ? "Unfavourite" : "Favourite";
      favBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        window.toggleFavourite(session.id);
      });

      const delBtn = document.createElement("button");
      delBtn.className = "session-delete-btn";
      delBtn.innerHTML = "&times;";
      delBtn.title = "Delete chat";
      delBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const confirmed = await showCustomConfirm("Delete this chat?");
        if (confirmed) window.deleteChatSession(session.id);
      });

      actions.appendChild(renameBtn);
      actions.appendChild(favBtn);
      actions.appendChild(delBtn);
      item.appendChild(titleSpan);
      item.appendChild(actions);
      listEl.appendChild(item);
    });
  }

  addGroup("Today", groups.today);
  addGroup("Yesterday", groups.yesterday);
  addGroup("Previous 7 Days", groups.week);
  addGroup("Older", groups.older);
}

// Filter sessions based on current view mode + selected topic
function getFilteredSessions() {
  if (panelViewMode === "recent") return allChatSessions;

  if (panelViewMode === "favourites") {
    return allChatSessions.filter((s) => s.favourited);
  }

  // "byTopic" mode — filter by the currently selected topic in the main chat area
  const currentTopic = window.selectedTopic || "";
  const currentTopicId = window.currentTopicId || "";

  if (!currentTopic && !currentTopicId) return allChatSessions;

  return allChatSessions.filter((s) => {
    // Match by topic name or topic ID
    if (currentTopic && s.topicName === currentTopic) return true;
    if (currentTopicId && s.topicId === currentTopicId) return true;
    return false;
  });
}

// Load and render chat history
async function loadAndRenderChatHistory() {
  allChatSessions = await loadChatSessions();
  renderChatHistory(getFilteredSessions());
}
window.loadAndRenderChatHistory = loadAndRenderChatHistory;

// Re-render with current filter (no re-fetch)
function rerenderFilteredHistory() {
  renderChatHistory(getFilteredSessions());
}

// Create a new chat session
window.createChatSession = async function (title) {
  const user = auth.currentUser;
  if (!user) return null;

  const sessionRef = await addDoc(collection(db, "users", user.uid, "chatSessions"), {
    title: (title || "New Chat").substring(0, 60),
    messages: [],
    topicId: window.currentTopicId || "",
    topicName: window.selectedTopic || "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    favourited: false,
  });

  window.currentSessionId = sessionRef.id;
  window.currentSessionMessages = [];
  await loadAndRenderChatHistory();
  return sessionRef.id;
};

// Save messages to current session
window.saveSessionMessages = async function (messages) {
  const user = auth.currentUser;
  if (!user || !window.currentSessionId) return;

  try {
    await updateDoc(doc(db, "users", user.uid, "chatSessions", window.currentSessionId), {
      messages: messages,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("Error saving session messages:", err);
  }
};

// Rename a chat session
window.renameSession = async function (sessionId, newTitle) {
  const user = auth.currentUser;
  if (!user) return;

  try {
    await updateDoc(doc(db, "users", user.uid, "chatSessions", sessionId), {
      title: newTitle.substring(0, 60),
    });
    await loadAndRenderChatHistory();
  } catch (err) {
    console.error("Error renaming session:", err);
  }
};

// Toggle favourite status
window.toggleFavourite = async function (sessionId) {
  const user = auth.currentUser;
  if (!user) return;

  const ref = doc(db, "users", user.uid, "chatSessions", sessionId);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const current = snap.data().favourited || false;
    await updateDoc(ref, { favourited: !current });
    await loadAndRenderChatHistory();
  }
};

// Delete a chat session
window.deleteChatSession = async function (sessionId) {
  const user = auth.currentUser;
  if (!user) return;

  await deleteDoc(doc(db, "users", user.uid, "chatSessions", sessionId));

  if (window.currentSessionId === sessionId) {
    window.startNewChat();
  }
  await loadAndRenderChatHistory();
};

// Load a specific chat session
window.loadChatSession = async function (sessionId) {
  const user = auth.currentUser;
  if (!user) return;

  const ref = doc(db, "users", user.uid, "chatSessions", sessionId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const data = snap.data();
  window.currentSessionId = sessionId;
  window.currentSessionMessages = data.messages || [];

  // Set topic if the session has one
  if (data.topicId) {
    window.currentTopicId = data.topicId;
    window.selectedTopic = data.topicName || "";
    const topicLabel = document.getElementById("selectedTopicLabel");
    const topicContainer = document.getElementById("selectedTopicContainer");
    const unitCont = document.getElementById("unitContainer");
    const chapCont = document.getElementById("chapterContainer");
    if (topicLabel && data.topicName) {
      topicLabel.textContent = data.topicName;
      // Apply unit color based on topicId
      topicLabel.classList.remove("unit-green", "unit-purple", "unit-red");
      const topicUnit = Object.entries(chapters).find(([, chs]) =>
        chs.some((ch) => ch.id === data.topicId)
      );
      if (topicUnit) {
        const unitKey = topicUnit[0];
        if (unitKey === "A") topicLabel.classList.add("unit-green");
        else if (unitKey === "B") topicLabel.classList.add("unit-purple");
        else if (unitKey === "C") topicLabel.classList.add("unit-red");
      }
      if (topicContainer) topicContainer.classList.remove("hidden");
      if (unitCont) unitCont.classList.add("hidden");
      if (chapCont) chapCont.classList.add("hidden");
    }
  }

  // Switch to chat section
  switchSection("chatSection");

  // Display the messages in the chat
  if (typeof window.displaySessionMessages === "function") {
    window.displaySessionMessages(data.messages || []);
  }

  // Set conversation history for API context
  if (typeof window.setConversationHistory === "function") {
    window.setConversationHistory(data.messages || []);
  }

  // Update active highlighting
  await loadAndRenderChatHistory();

  // Close panel on mobile
  closeChatHistoryPanel();
};

// Start a new chat
window.startNewChat = function () {
  window.currentSessionId = null;
  window.currentSessionMessages = [];

  if (typeof window.clearConversationHistoryFn === "function") {
    window.clearConversationHistoryFn();
  }

  // Reset topic selection
  selectedTopic = "";
  window.selectedTopic = "";
  window.currentTopicId = "";
  const topicLabel = document.getElementById("selectedTopicLabel");
  const topicContainer = document.getElementById("selectedTopicContainer");
  const unitCont = document.getElementById("unitContainer");
  const chapCont = document.getElementById("chapterContainer");
  if (topicLabel) topicLabel.textContent = "";
  if (topicContainer) topicContainer.classList.add("hidden");
  if (unitCont) unitCont.classList.remove("hidden");
  if (chapCont) {
    chapCont.innerHTML = "";
    chapCont.classList.add("hidden");
  }

  const chatMsgs = document.getElementById("chatMessages");
  if (chatMsgs) {
    chatMsgs.innerHTML = `
      <div class="chat-message message-bot overlay-row">
        <div class="bubble-container">
          <img class="chat-avatar" src="assets/img/certi.png" alt="Bot Avatar" />
          <div class="chat-bubble">
            Hi there, I'm Certi, your personal Leaving Cert biology tutor!
          </div>
        </div>
      </div>
    `;
  }

  // Switch to chat section
  switchSection("chatSection");
  loadAndRenderChatHistory();
  closeChatHistoryPanel();
};

// Panel toggle functions
function openChatHistoryPanel() {
  const panel = document.getElementById("chatHistoryPanel");
  const overlay = document.getElementById("chatHistoryOverlay");
  if (panel) panel.classList.add("show");
  if (overlay) overlay.classList.add("show");
}

function closeChatHistoryPanel() {
  const panel = document.getElementById("chatHistoryPanel");
  const overlay = document.getElementById("chatHistoryOverlay");
  if (panel) panel.classList.remove("show");
  if (overlay) overlay.classList.remove("show");
}

// Wire up New Chat button
const newChatBtn = document.getElementById("newChatBtn");
if (newChatBtn) {
  newChatBtn.addEventListener("click", () => {
    window.startNewChat();
  });
}

// Wire up chat history overlay close
const chatHistoryOverlay = document.getElementById("chatHistoryOverlay");
if (chatHistoryOverlay) {
  chatHistoryOverlay.addEventListener("click", closeChatHistoryPanel);
}

// Close panel when panel nav links are clicked (for mobile)
document.querySelectorAll(".panel-nav-link").forEach((link) => {
  link.addEventListener("click", () => {
    closeChatHistoryPanel();
  });
});

// Close panel when account link is clicked
const panelAccountLinkEl = document.getElementById("panelAccountLink");
if (panelAccountLinkEl) {
  panelAccountLinkEl.addEventListener("click", () => {
    closeChatHistoryPanel();
  });
}

// --- Panel view toggle (Recent / By Topic) ---
const panelViewBtns = document.querySelectorAll(".panel-view-btn");

panelViewBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const view = btn.getAttribute("data-view");
    panelViewMode = view;

    panelViewBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    rerenderFilteredHistory();
  });
});

/**************************************
 * custom alerts
 **************************************/

function customAlert(message) {
  // Create the overlay and modal elements
  const overlay = document.createElement("div");
  overlay.className = "custom-alert-overlay";

  const modalBox = document.createElement("div");
  modalBox.className = "custom-alert-box";

  const msgParagraph = document.createElement("p");
  msgParagraph.textContent = message;

  const closeBtn = document.createElement("button");
  closeBtn.className = "custom-alert-button";
  closeBtn.textContent = "OK";

  // Append elements together
  modalBox.appendChild(msgParagraph);
  modalBox.appendChild(closeBtn);
  overlay.appendChild(modalBox);

  // Append overlay to the body (or a designated container)
  document.body.appendChild(overlay);

  // Close the modal when button is clicked
  closeBtn.addEventListener("click", () => {
    document.body.removeChild(overlay);
  });
}

/**************************************
 * custom confirms
 **************************************/

window.showCustomConfirm = function (message) {
  return new Promise((resolve) => {
    // 1) Create overlay
    const overlay = document.createElement("div");
    overlay.classList.add("custom-confirm-overlay");

    // 2) Create the modal
    const modal = document.createElement("div");
    modal.classList.add("custom-confirm-modal");

    // 3) The text
    const msg = document.createElement("p");
    msg.textContent = message;

    // 4) Buttons container
    const btnContainer = document.createElement("div");
    btnContainer.classList.add("custom-confirm-buttons");

    // 5) "Yes" button
    const yesBtn = document.createElement("button");
    yesBtn.textContent = "Yes";

    yesBtn.addEventListener("click", () => {
      document.body.removeChild(overlay);
      resolve(true); // user confirmed
    });

    // 6) "No" button
    const noBtn = document.createElement("button");
    noBtn.textContent = "No";
    noBtn.classList.add("custom-confirm-no");

    noBtn.addEventListener("click", () => {
      document.body.removeChild(overlay);
      resolve(false); // user canceled
    });

    // 7) Assemble
    btnContainer.appendChild(yesBtn);
    btnContainer.appendChild(noBtn);
    modal.appendChild(msg);
    modal.appendChild(btnContainer);
    overlay.appendChild(modal);

    // 8) Append overlay to body
    document.body.appendChild(overlay);
  });
};

// script.js (simplified snippet)
document.addEventListener("DOMContentLoaded", () => {
  const hamburgerBtn = document.getElementById("hamburgerBtn");
  const navLinks = document.getElementById("navLinks");

  if (hamburgerBtn) {
    hamburgerBtn.addEventListener("click", () => {
      // Toggle the "show" class on the nav-links
      navLinks.classList.toggle("show");
    });
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const hamburgerBtnChat = document.getElementById("hamburgerBtnChat");
  const panel = document.getElementById("chatHistoryPanel");
  const panelOverlay = document.getElementById("chatHistoryOverlay");

  if (hamburgerBtnChat && panel && panelOverlay) {
    hamburgerBtnChat.addEventListener("click", () => {
      // Toggle the 'show' class on the chat history panel
      const isOpen = panel.classList.contains("show");
      if (isOpen) {
        panel.classList.remove("show");
        panelOverlay.classList.remove("show");
      } else {
        panel.classList.add("show");
        panelOverlay.classList.add("show");
      }
    });

    // Clicking the overlay also closes the panel
    panelOverlay.addEventListener("click", () => {
      panel.classList.remove("show");
      panelOverlay.classList.remove("show");
    });

    // Auto-close the panel if a link is clicked
    const panelLinks = panel.querySelectorAll("a");
    panelLinks.forEach((link) => {
      link.addEventListener("click", () => {
        panel.classList.remove("show");
        panelOverlay.classList.remove("show");
      });
    });
  }
});
