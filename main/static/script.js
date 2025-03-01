// On page load, check localStorage for theme
const body = document.body;
const darkModeToggle = document.getElementById("darkModeToggle");
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

// Sidebar Navigation
const sidebarLinks = document.querySelectorAll(".sidebar-nav a");
const chatSection = document.getElementById("chatSection");
const notebookSection = document.getElementById("notebookSection");
const accountSection = document.getElementById("accountSection");

sidebarLinks.forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const target = link.getAttribute("data-section");

    // Hide all sections
    chatSection.classList.add("hidden");
    notebookSection.classList.add("hidden");
    accountSection.classList.add("hidden");

    // Show the chosen section
    document.getElementById(target).classList.remove("hidden");
  });
});

// Basic Chat Functionality (placeholder)
const sendBtn = document.getElementById("sendBtn");
const chatInput = document.getElementById("chatInput");
const chatMessages = document.getElementById("chatMessages");
const savedResponses = document.getElementById("savedResponses");

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
