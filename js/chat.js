/**
 * chat.js
 *
 * This script listens for chat input, sends the query to the DialoGPT model via the Hugging Face Inference API,
 * and displays the response in the chat window.
 */

// Get DOM elements
const sendBtn = document.getElementById("sendBtn");
const chatInput = document.getElementById("chatInput");
const chatMessages = document.getElementById("chatMessages");

// Function to call the Hugging Face Inference API for DialoGPT
async function queryChatbot(question) {
  const apiUrl = "https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium";
  const headers = {
    "Content-Type": "application/json",
    // If you have a Hugging Face API token, uncomment and insert it here:
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
    // The API returns an array with responses; we assume the first one is our answer.
    if (Array.isArray(result) && result.length > 0) {
      return result[0].generated_text;
    } else if (result && result.generated_text) {
      return result.generated_text;
    } else {
      return "Sorry, I didn't quite catch that.";
    }
  } catch (error) {
    console.error("Chatbot API error:", error);
    return "There was an error connecting to the chatbot.";
  }
}

// Listen for clicks on the send button
sendBtn.addEventListener("click", async () => {
  const question = chatInput.value.trim();
  if (!question) return;

  // Display the user's message in the chat window
  const userMsg = document.createElement("div");
  userMsg.className = "chat-message message-user";
  userMsg.textContent = question;
  chatMessages.appendChild(userMsg);
  chatInput.value = "";
  chatMessages.scrollTop = chatMessages.scrollHeight;

  // Create a placeholder for the bot's response
  const botMsg = document.createElement("div");
  botMsg.className = "chat-message message-bot";
  botMsg.textContent = "Thinking...";
  chatMessages.appendChild(botMsg);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  // Query the chatbot API
  const answer = await queryChatbot(question);

  // Update the bot's message with the returned answer
  botMsg.textContent = answer;
  chatMessages.scrollTop = chatMessages.scrollHeight;
});
