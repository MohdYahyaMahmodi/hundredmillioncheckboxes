// Constants
const TOTAL_CHECKBOXES = 1000000;
const CHECKBOX_SIZE = 24;
const CHECKBOX_MARGIN = 6;
const TOTAL_CHECKBOX_SIZE = CHECKBOX_SIZE + CHECKBOX_MARGIN;
const GRID_PADDING = 20;
const GRID_INNER_PADDING_LEFT = 12;
const GRID_INNER_PADDING_RIGHT = 0;
const VIEWPORT_BUFFER = 2;

// DOM Elements
const checkboxContainer = document.getElementById('checkbox-container');
const checkboxGrid = document.getElementById('checkbox-grid');
const countElement = document.getElementById('count');
const checkboxSearch = document.getElementById('checkbox-search');
const searchButton = document.getElementById('search-button');

// State
let checkedBoxes = new Set();
let columnsPerRow = 0;
let totalRows = 0;
let visibleStartRow = 0;
let visibleEndRow = 0;

// Socket connection
const socket = io();

function updateCheckedCount() {
    countElement.textContent = checkedBoxes.size;
    if (checkedBoxes.size === TOTAL_CHECKBOXES) {
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
        } else {
            checkedBoxes.delete(index);
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
    calculateGridDimensions();
    updateVisibleRows();
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
    checkedBoxes = new Set(initialCheckedBoxes);
    updateCheckedCount();
    calculateGridDimensions();
    updateVisibleRows();
});

// Initial setup
window.addEventListener('load', () => {
    calculateGridDimensions();
    updateVisibleRows();
});