// Constants
const TOTAL_CHECKBOXES = 100000000; // 100 million
const CHECKBOX_SIZE = 22;
const CHECKBOX_MARGIN = 2;
const TOTAL_CHECKBOX_SIZE = CHECKBOX_SIZE + CHECKBOX_MARGIN;
const GRID_PADDING = 5;
const GRID_INNER_PADDING_LEFT = 12;
const GRID_INNER_PADDING_RIGHT = 18;
const VIEWPORT_BUFFER = 1;
const MAX_MESSAGE_LENGTH = 100;
const RENDER_CHUNK_SIZE = 100;
const SERVER_CHUNK_SIZE = 1000000; // 1 million checkboxes per server chunk

// DOM Elements
const checkboxContainer = document.getElementById('checkbox-container');
const checkboxGrid = document.getElementById('checkbox-grid');
const totalCountElement = document.getElementById('total-count');
const userCountElement = document.getElementById('user-count');
const progressCircle = document.getElementById('progress-circle');
const progressPercentage = document.getElementById('progress-percentage');
const checkboxSearch = document.getElementById('checkbox-search');
const searchButton = document.getElementById('search-button');

// State
let checkedBoxes = new Set();
let userCheckedBoxes = new Set();
let columnsPerRow = 0;
let totalRows = 0;
let visibleStartRow = 0;
let visibleEndRow = 0;
let totalCheckedBoxes = 0;

// Socket connection
const socket = io();

/**
 * Update the UI with the latest checked count
 * @param {number} totalChecked - The total number of checked boxes
 */
function updateCheckedCount(totalChecked) {
    totalCheckedBoxes = totalChecked;
    const userChecked = userCheckedBoxes.size;
    
    totalCountElement.textContent = totalChecked;
    userCountElement.textContent = userChecked;
    
    const percentage = (totalChecked / TOTAL_CHECKBOXES) * 100;
    const circumference = 2 * Math.PI * 15.9155; // radius of the circle
    progressCircle.style.strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
    progressPercentage.textContent = `${percentage.toFixed(2)}%`;

    if (totalChecked === TOTAL_CHECKBOXES) {
        alert("WE DID IT! ALL THE BOXES ARE CHECKED! 🎉");
    }
}

/**
 * Calculate and set the grid dimensions based on the container size
 */
function calculateGridDimensions() {
    const containerWidth = checkboxContainer.clientWidth - (GRID_PADDING + GRID_INNER_PADDING_LEFT + GRID_INNER_PADDING_RIGHT);
    columnsPerRow = Math.floor(containerWidth / TOTAL_CHECKBOX_SIZE);
    totalRows = Math.ceil(TOTAL_CHECKBOXES / columnsPerRow);
    
    const totalHeight = totalRows * TOTAL_CHECKBOX_SIZE + 2 * GRID_INNER_PADDING_LEFT;
    const totalWidth = columnsPerRow * TOTAL_CHECKBOX_SIZE + GRID_INNER_PADDING_LEFT + GRID_INNER_PADDING_RIGHT;
    
    checkboxGrid.style.height = `${totalHeight}px`;
    checkboxGrid.style.width = `${totalWidth}px`;
}

/**
 * Create a checkbox element
 * @param {number} index - The index of the checkbox
 * @returns {HTMLInputElement} The created checkbox element
 */
function createCheckboxElement(index) {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `cb-${index}`;
    checkbox.className = 'checkbox-item';
    checkbox.style.width = `${CHECKBOX_SIZE}px`;
    checkbox.style.height = `${CHECKBOX_SIZE}px`;
    checkbox.checked = checkedBoxes.has(index);

    const row = Math.floor(index / columnsPerRow);
    const col = index % columnsPerRow;
    
    const top = row * TOTAL_CHECKBOX_SIZE + GRID_INNER_PADDING_LEFT;
    const left = col * TOTAL_CHECKBOX_SIZE + GRID_INNER_PADDING_LEFT;
    
    checkbox.style.transform = `translate(${left}px, ${top}px)`;
    checkbox.style.position = 'absolute';

    checkbox.addEventListener('change', (e) => {
        const checked = e.target.checked;
        socket.emit('checkbox update', { index, checked });
        if (checked) {
            checkedBoxes.add(index);
            userCheckedBoxes.add(index);
        } else {
            checkedBoxes.delete(index);
            userCheckedBoxes.delete(index);
        }
        updateCheckedCount(totalCheckedBoxes + (checked ? 1 : -1));
    });

    return checkbox;
}

/**
 * Render visible checkboxes in the viewport
 */
function renderVisibleCheckboxes() {
    const fragment = document.createDocumentFragment();
    const startIndex = visibleStartRow * columnsPerRow;
    const endIndex = Math.min((visibleEndRow + 1) * columnsPerRow, TOTAL_CHECKBOXES);

    const children = Array.from(checkboxGrid.children);
    children.forEach(child => {
        const index = parseInt(child.id.split('-')[1]);
        if (index < startIndex || index >= endIndex) {
            checkboxGrid.removeChild(child);
        }
    });

    let currentIndex = startIndex;
    function renderChunk() {
        const chunkEndIndex = Math.min(currentIndex + RENDER_CHUNK_SIZE, endIndex);
        for (let i = currentIndex; i < chunkEndIndex; i++) {
            if (!document.getElementById(`cb-${i}`)) {
                fragment.appendChild(createCheckboxElement(i));
            }
        }
        checkboxGrid.appendChild(fragment);
        currentIndex = chunkEndIndex;

        if (currentIndex < endIndex) {
            requestAnimationFrame(renderChunk);
        }
    }
    renderChunk();

    // Request checkbox state for visible range
    const startChunk = Math.floor(startIndex / SERVER_CHUNK_SIZE);
    const endChunk = Math.floor((endIndex - 1) / SERVER_CHUNK_SIZE);
    for (let i = startChunk; i <= endChunk; i++) {
        socket.emit('request checkbox chunk', i);
    }
}

/**
 * Update the visible rows based on the current scroll position
 */
function updateVisibleRows() {
    const scrollTop = checkboxContainer.scrollTop;
    visibleStartRow = Math.floor(scrollTop / TOTAL_CHECKBOX_SIZE) - VIEWPORT_BUFFER;
    visibleStartRow = Math.max(0, visibleStartRow);
    const viewportHeight = checkboxContainer.clientHeight;
    const visibleRows = Math.ceil(viewportHeight / TOTAL_CHECKBOX_SIZE) + 2 * VIEWPORT_BUFFER;
    visibleEndRow = Math.min(visibleStartRow + visibleRows, totalRows - 1);

    renderVisibleCheckboxes();
}

/**
 * Handle scroll events
 */
function handleScroll() {
    requestAnimationFrame(updateVisibleRows);
}

/**
 * Handle window resize events
 */
function handleResize() {
    calculateGridDimensions();
    updateVisibleRows();
}

// Event Listeners
checkboxContainer.addEventListener('scroll', handleScroll);
window.addEventListener('resize', handleResize);

searchButton.addEventListener('click', () => {
    const searchIndex = parseInt(checkboxSearch.value) - 1;
    if (searchIndex >= 0 && searchIndex < TOTAL_CHECKBOXES) {
        const targetRow = Math.floor(searchIndex / columnsPerRow);
        checkboxContainer.scrollTop = targetRow * TOTAL_CHECKBOX_SIZE;
        updateVisibleRows();
        
        setTimeout(() => {
            const checkbox = document.getElementById(`cb-${searchIndex}`);
            if (checkbox) {
                checkbox.classList.add('highlight');
                checkbox.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setTimeout(() => checkbox.classList.remove('highlight'), 2000);
            }
        }, 100);
    } else {
        alert("Invalid checkbox number! Try again.");
    }
});

// Socket event handlers
socket.on('connect', () => {
    socket.emit('get initial state');
});

socket.on('checkbox update', ({ index, checked, totalChecked }) => {
    if (checked) {
        checkedBoxes.add(index);
    } else {
        checkedBoxes.delete(index);
    }
    updateCheckedCount(totalChecked);
    
    const checkbox = document.getElementById(`cb-${index}`);
    if (checkbox) {
        checkbox.checked = checked;
    }
});

socket.on('initial state', ({ totalChecked, totalCheckboxes, checkedBoxes: initialCheckedBoxes }) => {
    if (TOTAL_CHECKBOXES !== totalCheckboxes) {
        console.warn(`Server reported ${totalCheckboxes} checkboxes, but client expected ${TOTAL_CHECKBOXES}. Using server value.`);
    }
    checkedBoxes = new Set(initialCheckedBoxes);
    updateCheckedCount(totalChecked);
    calculateGridDimensions();
    updateVisibleRows();
});

socket.on('checkbox chunk', ({ chunkIndex, checkedBoxes: chunkCheckedBoxes }) => {
    const startIndex = chunkIndex * SERVER_CHUNK_SIZE;
    chunkCheckedBoxes.forEach(index => {
        checkedBoxes.add(startIndex + index);
        const checkbox = document.getElementById(`cb-${startIndex + index}`);
        if (checkbox) {
            checkbox.checked = true;
        }
    });
    updateCheckedCount(checkedBoxes.size);
});

// Initial setup
window.addEventListener('load', () => {
    calculateGridDimensions();
    updateVisibleRows();
});

// Chat functionality
const chatWidget = document.getElementById('chat-widget');
const chatToggle = document.getElementById('chat-toggle');
const closeChat = document.getElementById('close-chat');
const chatInput = document.getElementById('chat-input');
const sendMessage = document.getElementById('send-message');
const chatMessages = document.querySelector('.chat-messages');

let isChatOpen = false;

/**
 * Toggle the chat widget visibility
 */
function toggleChat() {
    isChatOpen = !isChatOpen;
    updateChatPosition();
    chatToggle.style.display = isChatOpen ? 'none' : 'block';
    if (isChatOpen) {
        chatInput.focus();
    }
}

/**
 * Update the chat widget position based on screen size
 */
function updateChatPosition() {
    if (window.innerWidth <= 640) {
        chatWidget.style.left = isChatOpen ? '0' : '-100%';
    } else {
        chatWidget.style.left = isChatOpen ? '0' : '-300px';
    }
}

/**
 * Close the chat widget on mobile devices
 */
function closeChatOnMobile() {
    isChatOpen = false;
    updateChatPosition();
    chatToggle.style.display = 'block';
}

chatToggle.addEventListener('click', toggleChat);
closeChat.addEventListener('click', closeChatOnMobile);

/**
 * Add a chat message to the chat widget
 * @param {string} userId - The user ID of the message sender
 * @param {string} message - The message content
 * @param {boolean} isOwnMessage - Whether the message is from the current user
 */
function addChatMessage(userId, message, isOwnMessage = false) {
    const messageElement = document.createElement('div');
    messageElement.className = 'bg-dark-300 p-2 rounded-lg';
    messageElement.innerHTML = `<span class="text-${isOwnMessage ? 'purple' : 'blue'}-400 font-semibold">${isOwnMessage ? 'You' : userId}:</span> ${message}`;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

sendMessage.addEventListener('click', () => {
    const message = chatInput.value.trim();
    if (message.length > MAX_MESSAGE_LENGTH) {
        alert(`Message exceeds maximum length of ${MAX_MESSAGE_LENGTH} characters.`);
        return;
    }
    if (message) {
        socket.emit('chat message', message);
        addChatMessage('You', message, true);
        chatInput.value = '';
    }
});

chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage.click();
    }
});

socket.on('chat message', ({ userId, message }) => {
    addChatMessage(userId, message, false);
});

socket.on('chat error', (error) => {
    alert(error);
});

// Clear example messages
chatMessages.innerHTML = '';

// Handle window resize for mobile responsiveness
window.addEventListener('resize', updateChatPosition);

// Prevent zooming on input focus for mobile devices
document.addEventListener('touchstart', (event) => {
    if (event.touches.length > 1) {
        event.preventDefault();
    }
}, { passive: false });

let lastTouchEnd = 0;
document.addEventListener('touchend', (event) => {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
}, false);