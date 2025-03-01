// chat.js

// 1) Function to query the BlenderBot model on Hugging Face
async function queryChatbot(question) {
  // Replace the model path here with the BlenderBot model
  const apiUrl = "https://api-inference.huggingface.co/models/facebook/blenderbot-400M-distill";

  const headers = {
    "Content-Type": "application/json",
    // If you have a Hugging Face API token, uncomment and add it:
    // "Authorization": "Bearer YOUR_HF_API_TOKEN"
  };

  // "inputs" is the user query; "options" can force waiting for model
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

    // The returned result can be an array or object
    if (Array.isArray(result) && result.length > 0 && result[0].generated_text) {
      return result[0].generated_text;
    } else if (result && result.generated_text) {
      return result.generated_text;
    } else if (result.error) {
      // If the API returns an "error" field, show it
      console.error("BlenderBot error:", result.error);
      return "Sorry, I'm having trouble responding right now.";
    } else {
      return "Sorry, I didn't understand that.";
    }
  } catch (error) {
    console.error("Chatbot API error:", error);
    return "Error connecting to the chatbot API.";
  }
}

// 2) DOM elements from your chat window
const sendBtn = document.getElementById("sendBtn");
const chatInput = document.getElementById("chatInput");
const chatMessages = document.getElementById("chatMessages");
const savedResponses = document.getElementById("savedResponses");

// 3) Event listener for the "Send" button
if (sendBtn && chatInput && chatMessages) {
  sendBtn.addEventListener("click", async () => {
    const question = chatInput.value.trim();
    if (!question) return;

    // Display user message
    const userMsg = document.createElement("div");
    userMsg.className = "chat-message message-user";
    userMsg.textContent = question;
    chatMessages.appendChild(userMsg);

    // Clear the input box and scroll down
    chatInput.value = "";
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Show a placeholder "Thinking..."
    const botMsg = document.createElement("div");
    botMsg.className = "chat-message message-bot";
    botMsg.textContent = "Thinking...";
    chatMessages.appendChild(botMsg);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Call the BlenderBot API via Hugging Face
    const answer = await queryChatbot(question);
    botMsg.textContent = answer;

    // 4) Optional: let users save the bot response to a "Notebook"
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

    // When "Save" is clicked, append the bot's text to #savedResponses
    saveBtn.addEventListener("click", () => {
      const li = document.createElement("li");
      li.textContent = answer;
      savedResponses.appendChild(li);
      alert("Response saved to notebook!");
    });

    botMsg.appendChild(saveBtn);

    // Ensure chat window stays scrolled to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });
}
