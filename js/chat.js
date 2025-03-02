/**************************************
 * chat.js — Using AIMLAPI's OpenAI-compatible endpoint
 **************************************/

// --- NEW: Define topic-specific context data ---
const topicData = {
  "The Scientific Method": "Context: Review key steps of the scientific method, including hypothesis formulation, experimentation, and analysis.",
  "The Characteristics of Life": "Context: Cover cellular organization, metabolism, growth, reproduction, and homeostasis in living organisms.",
  "Nutrition t": "Context: Focus on the role of nutrients, digestion, absorption, and the importance of a balanced diet.",
  "General Principles of Ecology": "Context: Emphasize ecosystems, energy flow, nutrient cycling, and population dynamics.",
  "A Study of an Ecosystem": "Context: Consider real-life case studies of ecosystems, interactions among species, and environmental factors.",
  "Cell Structure": "Context: Dive into the details of organelles, membrane structures, and the differences between prokaryotic and eukaryotic cells.",
  "Cell Metabolism": "Context: Review key metabolic pathways, enzyme activity, and energy production within cells.",
  "Cell Continuity": "Context: Explore cell cycle regulation, mitosis, meiosis, and mechanisms that ensure continuity of life.",
  "Cell Diversity": "Context: Understand the variety of cell types and their specialized functions within an organism.",
  "Genetics t": "Context: Cover DNA structure, replication, gene expression, and basic genetic inheritance patterns.",
  "Diversity of Organisms": "Context: Examine the classification, evolution, and diversity of life forms on Earth.",
  "Organisation and the Vascular Structures": "Context: Focus on how organisms are organized, including tissue types and the role of vascular systems.",
  "Transport and Nutrition": "Context: Explain mechanisms for nutrient and gas transport in organisms.",
  "Breathing System and Excretion": "Context: Detail the processes of respiration and excretion, and how organisms maintain internal balance.",
  "Responses to Stimuli": "Context: Review the ways organisms detect and respond to environmental changes.",
  "Reproduction and Growth": "Context: Discuss sexual and asexual reproduction, developmental biology, and growth processes.",
};

// 1) The function to query the AIML API with OpenAI-compatible parameters
async function queryAimlApi(question) {
  const apiUrl = "https://api.aimlapi.com/v1/chat/completions";
  const apiKey = "6f38c7556ee5413694304b0be2c3fa33";

  let systemPrompt = "You are a fun and bubbly leaving certificate biology tutor named Certi";

  // If a topic is selected, append that context
  if (window.selectedTopic && topicData[window.selectedTopic]) {
    systemPrompt += "\n\n" + topicData[window.selectedTopic];
  }

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: question },
  ];

  const payload = {
    model: "mistralai/Mistral-7B-Instruct-v0.2",
    messages: messages,
    temperature: 0.7,
    max_tokens: 256,
  };

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }

    const data = await response.json();

    if (data.choices && data.choices.length > 0 && data.choices[0].message && data.choices[0].message.content) {
      return data.choices[0].message.content;
    } else {
      return "Sorry, I didn’t understand that.";
    }
  } catch (error) {
    console.error("aimlapi error:", error);
    return "Daily credits are all gone!";
  }
}

// --- Typed text helper function ---
function typeText(element, text, speed = 30) {
  let index = 0;
  return new Promise((resolve) => {
    const timer = setInterval(() => {
      element.textContent += text.charAt(index);
      index++;
      if (index >= text.length) {
        clearInterval(timer);
        resolve();
      }
    }, speed);
  });
}

// 2) Grab DOM elements from your chat interface
const sendBtn = document.getElementById("sendBtn");
const chatInput = document.getElementById("chatInput");
const chatMessages = document.getElementById("chatMessages");
const savedResponses = document.getElementById("savedResponses");

// 3) Setup the event listener for the "Send" button
if (sendBtn && chatInput && chatMessages) {
  sendBtn.addEventListener("click", async () => {
    const question = chatInput.value.trim();
    if (!question) return;

    // === CREATE USER MESSAGE ROW ===
    const userRow = document.createElement("div");
    userRow.classList.add("chat-message", "message-user", "chat-row");

    // user avatar
    const userAvatar = document.createElement("img");
    userAvatar.classList.add("chat-avatar");
    userAvatar.src = "assets/img/pfp.avif"; // user avatar
    userAvatar.alt = "User Avatar";

    // user bubble
    const userBubble = document.createElement("div");
    userBubble.classList.add("chat-bubble");
    userBubble.textContent = question;

    // place them in row (remember row-reverse for user in CSS)
    userRow.appendChild(userBubble);
    userRow.appendChild(userAvatar);

    chatMessages.appendChild(userRow);

    // Clear input
    chatInput.value = "";
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // === CREATE BOT MESSAGE ROW ===
    const botRow = document.createElement("div");
    botRow.classList.add("chat-message", "message-bot", "chat-row");

    // bot avatar
    const botAvatar = document.createElement("img");
    botAvatar.classList.add("chat-avatar");
    botAvatar.src = "assets/img/certi.png"; // bot avatar
    botAvatar.alt = "Bot Avatar";

    // bubble for typed text
    const botBubble = document.createElement("div");
    botBubble.classList.add("chat-bubble");
    botBubble.textContent = ""; // we’ll fill this with typed text

    botRow.appendChild(botAvatar);
    botRow.appendChild(botBubble);
    chatMessages.appendChild(botRow);

    chatMessages.scrollTop = chatMessages.scrollHeight;

    // === Query the AIML API ===
    const answer = await queryAimlApi(question);

    // === Use typed effect for the bot's reply ===
    await typeText(botBubble, answer, 2);

    // === Add the "Save to Notebook" button after typed text finishes ===
    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Save to Notebook";
    saveBtn.style.marginLeft = "10px";
    saveBtn.style.paddin