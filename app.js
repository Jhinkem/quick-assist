// 1. Initial Data (The "Starter Pack")
const defaultData = [
    { id: 1701, title: "Password Reset", text: "I have gone ahead and reset your password to the default. Please try logging in with 'ChangeMe123!' (without quotes). You will be prompted to create a new, secure password immediately upon signing in." },
    { id: 1702, title: "Projector Fix", text: "It sounds like the display settings might be desynchronized. Please press the 'Windows' key + 'P' at the same time. Select 'Duplicate' from the menu on the right." },
    { id: 1703, title: "Wifi Refresh", text: "Let's try a quick refresh. Please toggle your Wi-Fi 'Off,' count to five, and toggle it back 'On.' Ensure you are selecting the 'Staff-Secure' network." }
];

// Load from LocalStorage OR use default
let responses = JSON.parse(localStorage.getItem('quickAssistData')) || defaultData;

// DOM Elements
const grid = document.getElementById('card-grid');
const searchInput = document.getElementById('search-bar');
const modal = document.getElementById('modal');
const titleInput = document.getElementById('response-title');
const textInput = document.getElementById('response-text');
const editIdInput = document.getElementById('edit-id');

// 2. Render Function (Draws the cards)
function renderCards(filterText = '') {
    grid.innerHTML = ''; // Clear current grid

    responses.forEach(item => {
        // Filter logic
        if (item.title.toLowerCase().includes(filterText.toLowerCase()) || 
            item.text.toLowerCase().includes(filterText.toLowerCase())) {
            
            const card = document.createElement('div');
            card.className = 'card';
            
            // Truncate text for preview (first 100 chars)
            const preview = item.text.length > 100 ? item.text.substring(0, 100) + '...' : item.text;

            card.innerHTML = `
                <h3>${item.title}</h3>
                <p>${preview}</p>
                <div class="card-actions">
                    <button onclick="editCard(${item.id}, event)" class="action-icon">✎</button>
                    <button onclick="deleteCard(${item.id}, event)" class="action-icon delete-icon">🗑</button>
                </div>
            `;

            // Click to Copy Logic
            card.addEventListener('click', () => copyToClipboard(item.text, card));
            
            grid.appendChild(card);
        }
    });
}

// 3. Copy Functionality
async function copyToClipboard(text, cardElement) {
    try {
        await navigator.clipboard.writeText(text);
        
        // Visual Feedback
        const originalBg = cardElement.style.backgroundColor;
        cardElement.classList.add('copied');
        
        setTimeout(() => {
            cardElement.classList.remove('copied');
        }, 600);
        
    } catch (err) {
        console.error('Failed to copy!', err);
    }
}

// 4. Modal Logic (Add/Edit)
document.getElementById('add-btn').addEventListener('click', () => {
    openModal();
});

document.getElementById('cancel-btn').addEventListener('click', () => {
    modal.classList.add('hidden');
});

document.getElementById('save-btn').addEventListener('click', () => {
    const title = titleInput.value;
    const text = textInput.value;
    const id = editIdInput.value;

    if (!title || !text) return alert("Please fill in both fields.");

    if (id) {
        // Update existing
        const index = responses.findIndex(r => r.id == id);
        responses[index] = { id: parseInt(id), title, text };
    } else {
        // Create new
        const newId = Date.now(); // Simple unique ID based on timestamp
        responses.push({ id: newId, title, text });
    }

    saveAndRender();
    modal.classList.add('hidden');
});

// Helper Functions
function openModal(item = null) {
    modal.classList.remove('hidden');
    if (item) {
        document.getElementById('modal-title').innerText = "Edit Response";
        titleInput.value = item.title;
        textInput.value = item.text;
        editIdInput.value = item.id;
    } else {
        document.getElementById('modal-title').innerText = "New Response";
        titleInput.value = '';
        textInput.value = '';
        editIdInput.value = '';
    }
}

window.editCard = function(id, event) {
    event.stopPropagation(); // Stop the click from triggering the "Copy" action
    const item = responses.find(r => r.id === id);
    openModal(item);
}

window.deleteCard = function(id, event) {
    event.stopPropagation();
    if(confirm('Delete this response?')) {
        responses = responses.filter(r => r.id !== id);
        saveAndRender();
    }
}

function saveAndRender() {
    localStorage.setItem('quickAssistData', JSON.stringify(responses));
    renderCards(searchInput.value);
}

// 5. Search Listener
searchInput.addEventListener('input', (e) => {
    renderCards(e.target.value);
});

// Initial Render
renderCards();

// --- BACKUP SYSTEM ---

// 1. Export (Download your personal JSON file)
function exportData() {
    const dataStr = JSON.stringify(responses, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    // Create a fake link to trigger download
    const a = document.createElement('a');
    a.href = url;
    // Naming the file with today's date
    const date = new Date().toISOString().slice(0, 10);
    a.download = `QuickAssist_Backup_${date}.json`; 
    a.click();
    
    URL.revokeObjectURL(url);
}

// 2. Import (Restore from file)
function importData(inputElement) {
    const file = inputElement.files[0];
    if (!file) return;

    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            if (!Array.isArray(importedData)) {
                alert("This file doesn't look right. Are you sure it's a QuickAssist backup?");
                return;
            }

            // Safety Check: Ask before overwriting
            if (confirm("Restore this backup? \n\n'OK' will Merge (add missing ones).\n'Cancel' will Replace (wipe current and load file).")) {
                // MERGE MODE (Safe)
                const existingIds = new Set(responses.map(r => r.id));
                const newItems = importedData.filter(item => !existingIds.has(item.id));
                responses = [...responses, ...newItems];
                alert(`Backup Restored! Added ${newItems.length} missing responses.`);
            } else {
                // REPLACE MODE (Total Reset)
                responses = importedData;
                alert("Backup Restored! Your list has been replaced.");
            }

            saveAndRender(); // Update the screen immediately
            
        } catch (err) {
            alert("Error reading file: " + err);
        }
    };

    reader.readAsText(file);
    inputElement.value = ''; // Reset so you can load same file again if needed
}