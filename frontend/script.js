// ============================================================
// ASTA AI - FRONTEND
// ============================================================

const API_URL = "https://asta-ai-assistant.onrender.com";


// ============================================================
// DOM ELEMENTS
// ============================================================

const messageInput = document.getElementById("messageInput");
const chatContainer = document.getElementById("chatContainer");
const welcomeScreen = document.getElementById("welcomeScreen");


// ============================================================
// SEND MESSAGE
// ============================================================

async function sendMessage() {

    const message = messageInput.value.trim();

    if (!message) {
        return;
    }

    // Hide welcome screen
    if (welcomeScreen) {
        welcomeScreen.style.display = "none";
    }

    // Show user message
    addMessage("user", message);

    // Clear input
    messageInput.value = "";

    // Reset textarea height
    messageInput.style.height = "auto";

    // Show thinking message
    const thinkingId = addMessage(
        "assistant",
        "Asta is thinking...",
        true
    );

    try {

        const response = await fetch(
            `${API_URL}/chat`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    message: message
                })
            }
        );

        if (!response.ok) {
            throw new Error(
                `Server error: ${response.status}`
            );
        }

        const data = await response.json();

        // Remove thinking message
        removeMessage(thinkingId);

        // Show response
        addMessage(
            "assistant",
            data.response || "I couldn't generate a response."
        );

    } catch (error) {

        console.error("Chat error:", error);

        removeMessage(thinkingId);

        addMessage(
            "assistant",
            "❌ I couldn't connect to Asta. Please try again."
        );
    }

    scrollToBottom();
}


// ============================================================
// ADD MESSAGE
// ============================================================

function addMessage(role, text, temporary = false) {

    const messageId =
        "message-" +
        Date.now() +
        "-" +
        Math.random()
            .toString(36)
            .substring(2, 8);

    const messageDiv = document.createElement("div");

    messageDiv.className =
        `message ${role}-message`;

    messageDiv.id = messageId;

    // Avatar
    const avatar = document.createElement("div");

    avatar.className = "message-avatar";

    avatar.textContent =
        role === "user" ? "You" : "A";

    // Content
    const content = document.createElement("div");

    content.className = "message-content";

    // Name
    const name = document.createElement("div");

    name.className = "message-name";

    name.textContent =
        role === "user" ? "You" : "Asta";

    // Text
    const textElement = document.createElement("div");

    textElement.className = "message-text";

    textElement.innerHTML =
        formatMessage(text);

    content.appendChild(name);
    content.appendChild(textElement);

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);

    chatContainer.appendChild(messageDiv);

    scrollToBottom();

    return messageId;
}


// ============================================================
// FORMAT MESSAGE
// ============================================================

function formatMessage(text) {

    if (!text) {
        return "";
    }

    // Escape HTML
    let safeText = escapeHtml(text);

    // Code blocks
    safeText = safeText.replace(
        /```([\s\S]*?)```/g,
        function(match, code) {

            return `
                <pre class="code-block"><code>${code.trim()}</code></pre>
            `;
        }
    );

    // Inline code
    safeText = safeText.replace(
        /`([^`]+)`/g,
        "<code>$1</code>"
    );

    // Bold
    safeText = safeText.replace(
        /\*\*(.*?)\*\*/g,
        "<strong>$1</strong>"
    );

    // Italic
    safeText = safeText.replace(
        /\*(.*?)\*/g,
        "<em>$1</em>"
    );

    // New lines
    safeText = safeText.replace(
        /\n/g,
        "<br>"
    );

    return safeText;
}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHtml(text) {

    const div = document.createElement("div");

    div.textContent = text;

    return div.innerHTML;
}


// ============================================================
// REMOVE MESSAGE
// ============================================================

function removeMessage(messageId) {

    const message = document.getElementById(messageId);

    if (message) {
        message.remove();
    }
}


// ============================================================
// SCROLL
// ============================================================

function scrollToBottom() {

    if (!chatContainer) {
        return;
    }

    chatContainer.scrollTop =
        chatContainer.scrollHeight;
}


// ============================================================
// ENTER KEY
// ============================================================

if (messageInput) {

    messageInput.addEventListener(
        "keydown",
        function(event) {

            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();

                sendMessage();
            }
        }
    );


    // Auto resize textarea

    messageInput.addEventListener(
        "input",
        function() {

            this.style.height = "auto";

            this.style.height =
                Math.min(
                    this.scrollHeight,
                    200
                ) + "px";
        }
    );
}


// ============================================================
// SUGGESTION BUTTONS
// ============================================================

function useSuggestion(text) {

    if (!messageInput) {
        return;
    }

    messageInput.value = text;

    messageInput.focus();

    messageInput.dispatchEvent(
        new Event("input")
    );
}


// ============================================================
// NEW CHAT
// ============================================================

async function newChat() {

    try {

        const response = await fetch(
            `${API_URL}/new-chat`,
            {
                method: "POST"
            }
        );

        if (!response.ok) {
            throw new Error("Failed to start new chat");
        }

        // Remove messages
        const messages =
            chatContainer.querySelectorAll(
                ".message"
            );

        messages.forEach(
            message => message.remove()
        );

        // Show welcome screen
        if (welcomeScreen) {
            welcomeScreen.style.display = "";
        }

        // Clear input
        if (messageInput) {
            messageInput.value = "";
        }

    } catch (error) {

        console.error(
            "New chat error:",
            error
        );

        alert(
            "Could not start a new chat."
        );
    }
}


// ============================================================
// SHOW LONG-TERM MEMORY
// ============================================================

async function showMemory() {

    const modal =
        document.getElementById("memoryModal");

    const memoryList =
        document.getElementById("memoryList");

    if (!modal || !memoryList) {
        return;
    }

    modal.style.display = "flex";

    memoryList.innerHTML =
        "<p>Loading memories...</p>";

    try {

        const response = await fetch(
            `${API_URL}/long-term-memory`
        );

        if (!response.ok) {
            throw new Error(
                "Failed to load memories"
            );
        }

        const data =
            await response.json();

        const memories =
            data.long_term_memory || [];

        if (memories.length === 0) {

            memoryList.innerHTML =
                "<p>Asta has no saved memories yet.</p>";

            return;
        }

        memoryList.innerHTML = "";

        memories.forEach(
            memory => {

                const item =
                    document.createElement("div");

                item.className =
                    "memory-item";

                item.innerHTML = `
                    <div class="memory-text">
                        ${escapeHtml(memory.memory)}
                    </div>
                    <div class="memory-date">
                        ${escapeHtml(
                            memory.created_at || ""
                        )}
                    </div>
                `;

                memoryList.appendChild(item);
            }
        );

    } catch (error) {

        console.error(
            "Memory error:",
            error
        );

        memoryList.innerHTML =
            "<p>❌ Could not load memories.</p>";
    }
}


// ============================================================
// CLOSE MEMORY MODAL
// ============================================================

function closeMemory() {

    const modal =
        document.getElementById("memoryModal");

    if (modal) {
        modal.style.display = "none";
    }
}


// ============================================================
// CLOSE MODAL WHEN CLICKING OUTSIDE
// ============================================================

window.addEventListener(
    "click",
    function(event) {

        const modal =
            document.getElementById("memoryModal");

        if (
            modal &&
            event.target === modal
        ) {
            closeMemory();
        }
    }
);


// ============================================================
// CLEAR LONG-TERM MEMORY
// ============================================================

async function clearMemory() {

    const confirmed =
        confirm(
            "Are you sure you want to clear Asta's long-term memory?"
        );

    if (!confirmed) {
        return;
    }

    try {

        const response = await fetch(
            `${API_URL}/clear-memory`,
            {
                method: "DELETE"
            }
        );

        if (!response.ok) {
            throw new Error(
                "Failed to clear memory"
            );
        }

        await showMemory();

        alert(
            "Asta's long-term memory has been cleared."
        );

    } catch (error) {

        console.error(
            "Clear memory error:",
            error
        );

        alert(
            "Could not clear memory."
        );
    }
}


// ============================================================
// CHECK ASTA HEALTH
// ============================================================

async function checkHealth() {

    const statusElement =
        document.getElementById("systemStatus");

    try {

        const response = await fetch(
            `${API_URL}/health`
        );

        const data =
            await response.json();

        if (data.gemini_configured) {

            if (statusElement) {
                statusElement.textContent =
                    "🟢 Asta is online";
            }

            return true;
        }

        if (statusElement) {
            statusElement.textContent =
                "🟡 AI configuration incomplete";
        }

        return false;

    } catch (error) {

        console.error(
            "Health check error:",
            error
        );

        if (statusElement) {
            statusElement.textContent =
                "🔴 Asta is offline";
        }

        return false;
    }
}


// ============================================================
// SYSTEM STATUS BUTTON
// ============================================================

async function showSystemStatus() {

    try {

        const response = await fetch(
            `${API_URL}/health`
        );

        const data =
            await response.json();

        let message = "";

        if (data.api === "online") {
            message += "API: 🟢 Online\n";
        } else {
            message += "API: 🔴 Offline\n";
        }

        if (data.gemini_configured) {
            message += "Gemini: 🟢 Connected\n";
        } else {
            message += "Gemini: 🔴 Not configured\n";
        }

        message +=
            `Model: ${data.model}`;

        alert(message);

    } catch (error) {

        alert(
            "❌ Unable to connect to Asta."
        );
    }
}


// ============================================================
// INITIAL HEALTH CHECK
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        checkHealth();

    }
);