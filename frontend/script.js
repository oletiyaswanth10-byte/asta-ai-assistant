// ============================================================
// ASTA AI - FRONTEND
// ============================================================

const API_URL = "https://asta-ai-assistant.onrender.com";


// ============================================================
// FIND MESSAGE INPUT
// ============================================================

function getMessageInput() {

    return (
        document.getElementById("messageInput") ||
        document.getElementById("chatInput") ||
        document.getElementById("userInput") ||
        document.getElementById("prompt") ||
        document.querySelector("textarea")
    );
}


// ============================================================
// FIND CHAT CONTAINER
// ============================================================

function getChatContainer() {

    return (
        document.getElementById("chatContainer") ||
        document.getElementById("messages") ||
        document.getElementById("chatMessages") ||
        document.querySelector(".chat-messages") ||
        document.querySelector(".messages")
    );
}


// ============================================================
// FIND WELCOME SCREEN
// ============================================================

function getWelcomeScreen() {

    return (
        document.getElementById("welcomeScreen") ||
        document.querySelector(".welcome-screen")
    );
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
// FORMAT MESSAGE
// ============================================================

function formatMessage(text) {

    if (!text) {
        return "";
    }

    let safeText = escapeHtml(text);

    safeText = safeText.replace(
        /```([\s\S]*?)```/g,
        function(match, code) {

            return `
                <pre class="code-block"><code>${code.trim()}</code></pre>
            `;
        }
    );

    safeText = safeText.replace(
        /`([^`]+)`/g,
        "<code>$1</code>"
    );

    safeText = safeText.replace(
        /\*\*(.*?)\*\*/g,
        "<strong>$1</strong>"
    );

    safeText = safeText.replace(
        /\*(.*?)\*/g,
        "<em>$1</em>"
    );

    safeText = safeText.replace(
        /\n/g,
        "<br>"
    );

    return safeText;
}


// ============================================================
// ADD MESSAGE
// ============================================================

function addMessage(
    role,
    text,
    temporary = false
) {

    const chatContainer =
        getChatContainer();

    if (!chatContainer) {

        console.error(
            "Asta error: chat container not found."
        );

        return null;
    }

    const messageId =
        "message-" +
        Date.now() +
        "-" +
        Math.random()
            .toString(36)
            .substring(2, 8);

    const messageDiv =
        document.createElement("div");

    messageDiv.className =
        `message ${role}-message`;

    messageDiv.id =
        messageId;

    const avatar =
        document.createElement("div");

    avatar.className =
        "message-avatar";

    avatar.textContent =
        role === "user"
            ? "You"
            : "A";

    const content =
        document.createElement("div");

    content.className =
        "message-content";

    const name =
        document.createElement("div");

    name.className =
        "message-name";

    name.textContent =
        role === "user"
            ? "You"
            : "Asta";

    const textElement =
        document.createElement("div");

    textElement.className =
        "message-text";

    textElement.innerHTML =
        formatMessage(text);

    content.appendChild(name);

    content.appendChild(
        textElement
    );

    messageDiv.appendChild(
        avatar
    );

    messageDiv.appendChild(
        content
    );

    chatContainer.appendChild(
        messageDiv
    );

    scrollToBottom();

    return messageId;
}


// ============================================================
// REMOVE MESSAGE
// ============================================================

function removeMessage(
    messageId
) {

    if (!messageId) {
        return;
    }

    const message =
        document.getElementById(
            messageId
        );

    if (message) {
        message.remove();
    }
}


// ============================================================
// SCROLL
// ============================================================

function scrollToBottom() {

    const chatContainer =
        getChatContainer();

    if (!chatContainer) {
        return;
    }

    chatContainer.scrollTop =
        chatContainer.scrollHeight;
}


// ============================================================
// SEND MESSAGE
// ============================================================

async function sendMessage() {

    const messageInput =
        getMessageInput();

    if (!messageInput) {

        console.error(
            "Asta error: message input not found."
        );

        return;
    }

    const message =
        messageInput.value.trim();

    // Don't send empty messages
    if (!message) {
        return;
    }

    // IMPORTANT:
    // Add the user's message BEFORE clearing input.
    addMessage(
        "user",
        message
    );

    // Hide welcome screen
    const welcomeScreen =
        getWelcomeScreen();

    if (welcomeScreen) {
        welcomeScreen.style.display =
            "none";
    }

    // Clear input AFTER saving the message
    messageInput.value = "";

    messageInput.style.height =
        "auto";

    // Show thinking message
    const thinkingId =
        addMessage(
            "assistant",
            "Asta is thinking...",
            true
        );

    try {

        const response =
            await fetch(
                `${API_URL}/chat`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
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

        const data =
            await response.json();

        // Remove thinking message
        removeMessage(
            thinkingId
        );

        // Show Asta response
        addMessage(
            "assistant",
            data.response ||
                "I couldn't generate a response."
        );

    } catch (error) {

        console.error(
            "Chat error:",
            error
        );

        removeMessage(
            thinkingId
        );

        addMessage(
            "assistant",
            "❌ I couldn't connect to Asta. Please try again."
        );
    }

    scrollToBottom();
}


// ============================================================
// HANDLE ENTER KEY
// ============================================================
// This function is used by your HTML:
// onkeydown="handleKey(event)"
//
// IMPORTANT:
// There is NO second keydown event listener.
// This prevents duplicate messages.
// ============================================================

function handleKey(event) {

    if (
        event.key === "Enter" &&
        !event.shiftKey
    ) {

        event.preventDefault();

        sendMessage();

        return false;
    }

    return true;
}


// ============================================================
// SUGGESTION BUTTONS
// ============================================================

function useSuggestion(text) {

    const messageInput =
        getMessageInput();

    if (!messageInput) {

        console.error(
            "Asta error: message input not found."
        );

        return;
    }

    messageInput.value =
        text;

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

        const response =
            await fetch(
                `${API_URL}/new-chat`,
                {
                    method: "POST"
                }
            );

        if (!response.ok) {

            throw new Error(
                "Failed to start new chat"
            );
        }

        const chatContainer =
            getChatContainer();

        if (chatContainer) {

            const messages =
                chatContainer.querySelectorAll(
                    ".message"
                );

            messages.forEach(
                message =>
                    message.remove()
            );
        }

        const welcomeScreen =
            getWelcomeScreen();

        if (welcomeScreen) {

            welcomeScreen.style.display =
                "";
        }

        const messageInput =
            getMessageInput();

        if (messageInput) {

            messageInput.value =
                "";

            messageInput.style.height =
                "auto";
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
        document.getElementById(
            "memoryModal"
        );

    const memoryList =
        document.getElementById(
            "memoryList"
        );

    if (!modal || !memoryList) {
        return;
    }

    modal.style.display =
        "flex";

    memoryList.innerHTML =
        "<p>Loading memories...</p>";

    try {

        const response =
            await fetch(
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
            data.long_term_memory ||
            [];

        if (
            memories.length === 0
        ) {

            memoryList.innerHTML =
                "<p>Asta has no saved memories yet.</p>";

            return;
        }

        memoryList.innerHTML =
            "";

        memories.forEach(
            memory => {

                const item =
                    document.createElement(
                        "div"
                    );

                item.className =
                    "memory-item";

                item.innerHTML = `
                    <div class="memory-text">
                        ${escapeHtml(
                            memory.memory
                        )}
                    </div>

                    <div class="memory-date">
                        ${escapeHtml(
                            memory.created_at || ""
                        )}
                    </div>
                `;

                memoryList.appendChild(
                    item
                );
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
// CLOSE MEMORY
// ============================================================

function closeMemory() {

    const modal =
        document.getElementById(
            "memoryModal"
        );

    if (modal) {

        modal.style.display =
            "none";
    }
}


// ============================================================
// CLOSE MODAL OUTSIDE CLICK
// ============================================================

window.addEventListener(
    "click",
    function(event) {

        const modal =
            document.getElementById(
                "memoryModal"
            );

        if (
            modal &&
            event.target === modal
        ) {

            closeMemory();
        }
    }
);


// ============================================================
// CLEAR MEMORY
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

        const response =
            await fetch(
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
        document.getElementById(
            "systemStatus"
        );

    try {

        const response =
            await fetch(
                `${API_URL}/health`
            );

        if (!response.ok) {

            throw new Error(
                "Health check failed"
            );
        }

        const data =
            await response.json();

        if (
            data.gemini_configured
        ) {

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
// SYSTEM STATUS
// ============================================================

async function showSystemStatus() {

    try {

        const response =
            await fetch(
                `${API_URL}/health`
            );

        if (!response.ok) {

            throw new Error(
                "Health check failed"
            );
        }

        const data =
            await response.json();

        let message = "";

        message +=
            data.api === "online"
                ? "API: 🟢 Online\n"
                : "API: 🔴 Offline\n";

        message +=
            data.gemini_configured
                ? "Gemini: 🟢 Connected\n"
                : "Gemini: 🔴 Not configured\n";

        message +=
            `Model: ${data.model}`;

        alert(message);

    } catch (error) {

        console.error(
            "System status error:",
            error
        );

        alert(
            "❌ Unable to connect to Asta."
        );
    }
}


// ============================================================
// DOM READY
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        const messageInput =
            getMessageInput();

        if (messageInput) {

            // Auto-resize only.
            // DO NOT add another keydown listener here.
            messageInput.addEventListener(
                "input",
                function() {

                    this.style.height =
                        "auto";

                    this.style.height =
                        Math.min(
                            this.scrollHeight,
                            200
                        ) + "px";
                }
            );
        }

        checkHealth();

        console.log(
            "Asta frontend loaded successfully."
        );
    }
);