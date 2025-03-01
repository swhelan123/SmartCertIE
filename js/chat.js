// chat.js

// Function to query the DialoGPT model via Hugging Face API
async function queryChatbot(question) {
  const apiUrl = "https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium";
  const headers = {
    "Content-Type": "application/json",
    // If you have a Hugging Face API token, uncomment the line below:
    // "Authorization": "Bearer YOUR_HF_API_TOKEN"
  };

  const payload = {
    inputs: question,
    options: { wait_for_model: true },
  };

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (Array.isArray(result) && result.length > 0) {
      return result[0].generated_text;
    } else if (result && result.generated_text) {
      return result.generated_text;
    } else {
      return "Sorry, I didn't understand that.";
    }
  } catch (error) {
    console.error("Chatbot API error:", error);
    return "Error connecting to chatbot API.";
  }
}

// Get DOM elements
const sendBtn = document.getElementById("sendBtn");
const chatInput = document.getElementById("chatInput");
const chatMessages = document.getElementById("chatMessages");
const savedResponses = document.getElementById("savedResponses");

// Attach event listener for chat messages
if (sendBtn && chatInput && chatMessages) {
  sendBtn.addEventListener("click", async () => {
    const question = chatInput.value.trim();
    if (!question) return;

    // Display user's message
    const userMsg = document.createElement("div");
    userMsg.className = "chat-message message-user";
    userMsg.textContent = question;
    chatMessages.appendChild(userMsg);

    // Clear input and scroll
    chatInput.value = "";
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Display a placeholder for the bot's response
    const botMsg = document.createElement("div");
    botMsg.className = "chat-message message-bot";
    botMsg.textContent = "Thinking...";
    chatMessages.appendChild(botMsg);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Get answer from chatbot API
    const answer = await queryChatbot(question);
    botMsg.textContent = answer;

    // Add "Save to Notebook" button to the bot message
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
      const li = document.createElement("li");
      li.textContent = botMsg.textContent;
      savedResponses.appendChild(li);
      alert("Response saved to notebook!");
    });
    botMsg.appendChild(saveBtn);

    chatMessages.scrollTop = chatMessages.scrollHeight;
  });
}
