// Constants
const TOTAL_CHECKBOXES = 10000000;
const CHECKBOX_SIZE = 40;
const CHECKBOX_MARGIN = 6;
const TOTAL_CHECKBOX_SIZE = CHECKBOX_SIZE + CHECKBOX_MARGIN;
const GRID_PADDING = 20;
const GRID_INNER_PADDING_LEFT = 12;
const GRID_INNER_PADDING_RIGHT = 0;
const VIEWPORT_BUFFER = 3;

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

// Socket connection
const socket = io();

function updateCheckedCount() {
    const totalChecked = checkedBoxes.size;
    const userChecked = userCheckedBoxes.size;
    
    totalCountElement.textContent = totalChecked;
    userCountElement.textContent = userChecked;
    
    const percentage = (totalChecked / TOTAL_CHECKBOXES) * 100;
    const circumference = 2 * Math.PI * 15.9155; // radius of the circle
    progressCircle.style.strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
    progressPercentage.textContent = `${percentage.toFixed(2)}%`;

    if (totalChecked === TOTAL_CHECKBOXES) {
        alert("YOU DID IT! ALL THE BOXES ARE CHECKED! 🎉");
    }
}

function calculateGridDimensions() {
    const containerWidth = checkboxContainer.clientWidth - (GRID_PADDING + GRID_INNER_PADDING_LEFT + GRID_INNER_PADDING_RIGHT);
    columnsPerRow = Math.floor(containerWidth / TOTAL_CHECKBOX_SIZE);
    totalRows = Math.ceil(TOTAL_CHECKBOXES / columnsPerRow);
    checkboxGrid.style.height = `${totalRows * TOTAL_CHECKBOX_SIZE + 2 * GRID_INNER_PADDING_LEFT}px`;
    checkboxGrid.style.width = `${columnsPerRow * TOTAL_CHECKBOX_SIZE + GRID_INNER_PADDING_LEFT + GRID_INNER_PADDING_RIGHT}px`;
}

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
    checkbox.style.top = `${row * TOTAL_CHECKBOX_SIZE + GRID_INNER_PADDING_LEFT}px`;
    checkbox.style.left = `${col * TOTAL_CHECKBOX_SIZE + GRID_INNER_PADDING_LEFT}px`;

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
        updateCheckedCount();
    });

    return checkbox;
}

function renderVisibleCheckboxes() {
    const fragment = document.createDocumentFragment();
    const startIndex = visibleStartRow * columnsPerRow;
    const endIndex = Math.min((visibleEndRow + 1) * columnsPerRow, TOTAL_CHECKBOXES);

    // Remove checkboxes that are no longer visible
    const children = Array.from(checkboxGrid.children);
    children.forEach(child => {
        const index = parseInt(child.id.split('-')[1]);
        if (index < startIndex || index >= endIndex) {
            checkboxGrid.removeChild(child);
        }
    });

    // Add new visible checkboxes
    for (let i = startIndex; i < endIndex; i++) {
        if (!document.getElementById(`cb-${i}`)) {
            fragment.appendChild(createCheckboxElement(i));
        }
    }

    checkboxGrid.appendChild(fragment);
}

function updateVisibleRows() {
    const scrollTop = checkboxContainer.scrollTop;
    visibleStartRow = Math.floor((scrollTop - GRID_INNER_PADDING_LEFT) / TOTAL_CHECKBOX_SIZE) - VIEWPORT_BUFFER;
    visibleStartRow = Math.max(0, visibleStartRow);
    const viewportHeight = checkboxContainer.clientHeight;
    const visibleRows = Math.ceil((viewportHeight + 2 * GRID_INNER_PADDING_LEFT) / TOTAL_CHECKBOX_SIZE) + 2 * VIEWPORT_BUFFER;
    visibleEndRow = Math.min(visibleStartRow + visibleRows, totalRows - 1);

    renderVisibleCheckboxes();
}

function handleScroll() {
    requestAnimationFrame(updateVisibleRows);
}

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
        checkboxContainer.scrollTop = targetRow * TOTAL_CHECKBOX_SIZE - GRID_INNER_PADDING_LEFT;
        updateVisibleRows();
        
        setTimeout(() => {
            const checkbox = document.getElementById(`cb-${searchIndex}`);
            if (checkbox) {
                checkbox.classList.add('highlight');
                setTimeout(() => checkbox.classList.remove('highlight'), 2000);
            }
        }, 100);
    } else {
        alert("Invalid checkbox number! Try again.");
    }
});

// Socket event handlers
socket.on('connect', () => {
    console.log('Connected to server');
    socket.emit('get initial state');
});

socket.on('checkbox update', ({ index, checked }) => {
    if (checked) {
        checkedBoxes.add(index);
    } else {
        checkedBoxes.delete(index);
    }
    updateCheckedCount();
    
    const checkbox = document.getElementById(`cb-${index}`);
    if (checkbox) {
        checkbox.checked = checked;
    }
});

socket.on('initial state', (initialCheckedBoxes) => {
    console.log('Received initial state');
    checkedBoxes = new Set(initialCheckedBoxes);
    updateCheckedCount();
    calculateGridDimensions();
    updateVisibleRows();
});

// Initial setup
window.addEventListener('load', () => {
    console.log('Page loaded');
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

function toggleChat() {
    isChatOpen = !isChatOpen;
    chatWidget.style.left = isChatOpen ? '0px' : '-300px';
    chatToggle.style.display = isChatOpen ? 'none' : 'block';
}

chatToggle.addEventListener('click', toggleChat);
closeChat.addEventListener('click', toggleChat);

function addChatMessage(userId, message, isOwnMessage = false) {
    const messageElement = document.createElement('div');
    messageElement.className = 'bg-dark-300 p-2 rounded-lg';
    messageElement.innerHTML = `<span class="text-${isOwnMessage ? 'purple' : 'blue'}-400 font-semibold">${isOwnMessage ? 'You' : userId}:</span> ${message}`;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

sendMessage.addEventListener('click', () => {
    const message = chatInput.value.trim();
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

// Clear example messages
chatMessages.innerHTML = '';