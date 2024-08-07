const socket = io();
const checkboxContainer = document.getElementById('checkbox-container');
const checkedCountElement = document.getElementById('checked-count');
let checkedCount = 0;

function updateCheckedCount() {
    checkedCountElement.textContent = `Checked: ${checkedCount}`;
}

function createCheckbox(index, checked) {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `checkbox-${index}`;
    checkbox.className = 'form-checkbox h-5 w-5 text-primary transition duration-150 ease-in-out m-1';
    checkbox.checked = checked;
    
    checkbox.addEventListener('change', (event) => {
        socket.emit('checkbox update', { index, checked: event.target.checked });
    });
    
    return checkbox;
}

function renderCheckboxes(checkboxes) {
    checkboxContainer.innerHTML = '';
    const fragment = document.createDocumentFragment();
    checkboxes.forEach((checked, index) => {
        fragment.appendChild(createCheckbox(index, checked));
    });
    checkboxContainer.appendChild(fragment);
}

socket.on('initial state', (checkboxes) => {
    checkedCount = checkboxes.filter(Boolean).length;
    updateCheckedCount();
    renderCheckboxes(checkboxes);
});

socket.on('checkbox updated', (data) => {
    const { index, checked } = data;
    const checkbox = document.getElementById(`checkbox-${index}`);
    if (checkbox) {
        checkbox.checked = checked;
        checkedCount += checked ? 1 : -1;
        updateCheckedCount();
    }
});