/**************************************
 * chat.js — Using AIMLAPI's OpenAI-compatible endpoint
 **************************************/

// 1) The function to query the AIML API with extended parameters
async function queryAimlApi(question) {
  // Endpoint for AIML API's chat completions
  const apiUrl = "https://api.aimlapi.com/v1/chat/completions";

  // Your AIMLAPI key
  const apiKey = "YOUR_API_KEY_HERE";

  // Provide a system prompt for context
  const systemPrompt = "You are an expert biology tutor for 17-19 year olds.";

  // Standard messages array (OpenAI-style)
  const messages = [
    {
      role: "system",
      content: systemPrompt,
    },
    {
      role: "user",
      content: question,
    },
  ];

  // Merge your advanced fields with the messages array
  const payload = {
    // The model you want to call (example: "o1-mini")
    model: "o1-mini",

    // The standard chat messages
    messages: messages,

    // Example of advanced fields from your snippet:
    frequency_penalty: 1,
    logprobs: true,
    top_logprobs: 1,
    max_tokens: 512,
    max_completion_tokens: 1,
    n: 1,
    presence_penalty: 1,
    seed: 1,
    stream: false,
    top_p: 1,
    temperature: 1,
    parallel_tool_calls: true,
    reasoning_effort: "low",
    logit_bias: {
      ANY_ADDITIONAL_PROPERTY: 1,
    },
    stream_options: {
      include_usage: true,
    },
    stop: "text",
    tool_choice: "none",
    tools: [
      {
        type: "function",
        function: {
          description: "text",
          name: "text",
          parameters: null,
          required: ["text"],
        },
      },
    ],
    response_format: {
      type: "text",
    },
    prediction: {
      type: "content",
      content: "text",
    },
  };

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`, // AIMLAPI uses Bearer tokens
      },
      body: JSON.stringify(payload),
    });

    // Check if the response is valid
    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }

    // Parse JSON data from the API
    const data = await response.json();

    // We expect data.choices[0].message.content in an OpenAI-like response
    if (data.choices && data.choices.length > 0 && data.choices[0].message && data.choices[0].message.content) {
      return data.choices[0].message.content;
    } else {
      return "Sorry, I didn't understand that.";
    }
  } catch (error) {
    console.error("aimlapi error:", error);
    return "Error connecting to AIMLAPI.";
  }
}

// 2) DOM elements for your chat interface
const sendBtn = document.getElementById("sendBtn");
const chatInput = document.getElementById("chatInput");
const chatMessages = document.getElementById("chatMessages");
const savedResponses = document.getElementById("savedResponses");

// 3) Event listener for the "Send" button
if (sendBtn && chatInput && chatMessages) {
  sendBtn.addEventListener("click", async () => {
    const question = chatInput.value.trim();
    if (!question) return;

    // Display the user's message
    const userMsg = document.createElement("div");
    userMsg.className = "chat-message message-user";
    userMsg.textContent = question;
    chatMessages.appendChild(userMsg);

    // Clear the input and scroll to bottom
    chatInput.value = "";
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Show a "Thinking..." placeholder
    const botMsg = document.createElement("div");
    botMsg.className = "chat-message message-bot";
    botMsg.textContent = "Thinking...";
    chatMessages.appendChild(botMsg);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Query AIMLAPI with the user’s question
    const answer = await queryAimlApi(question);
    botMsg.textContent = answer;

    // Add a "Save to Notebook" button to the bot message
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

    // Scroll to bottom again
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });

  // Optionally allow pressing Enter to send
  if (chatInput) {
    chatInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        sendBtn.click();
      }
    });
  }
}
