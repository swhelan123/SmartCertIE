// DARK MODE TOGGLE:
const toggleBtn = document.getElementById("darkModeToggle");
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark-mode");
}
toggleBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  // Save user preference
  const theme = document.body.classList.contains("dark-mode") ? "dark" : "light";
  localStorage.setItem("theme", theme);
});

// SIMPLE CHAT SEND (placeholder logic for POC):
const sendBtn = document.getElementById("sendBtn");
const chatWindow = document.getElementById("chat-window");
const questionInput = document.getElementById("questionInput");
sendBtn.addEventListener("click", () => {
  const question = questionInput.value.trim();
  if (!question) return;
  // Display user question in chat window
  const userMsg = document.createElement("div");
  userMsg.className = "message user";
  userMsg.textContent = question;
  chatWindow.appendChild(userMsg);
  // Scroll chat to bottom
  chatWindow.scrollTop = chatWindow.scrollHeight;
  // Clear input
  questionInput.value = "";
  // (In a real implementation, here you'd send the question to the AI API and await a response)
  // For now, just show a placeholder bot response:
  setTimeout(() => {
    const botMsg = document.createElement("div");
    botMsg.className = "message bot";
    botMsg.textContent = "🤖 This is a placeholder answer about: " + question;
    chatWindow.appendChild(botMsg);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }, 1000);
});

// NAVIGATION (showing Notebook/Account sections for POC):
document.querySelectorAll("#sidebar a").forEach((link) => {
  link.addEventListener("click", (evt) => {
    evt.preventDefault();
    const targetId = link.getAttribute("href").substring(1);
    // Hide all sections
    document.querySelectorAll("main, section").forEach((sec) => {
      sec.style.display = "none";
    });
    // Show the target section
    const targetSection = document.getElementById(targetId);
    if (targetSection) {
      targetSection.style.display = "block";
    }
  });
});
