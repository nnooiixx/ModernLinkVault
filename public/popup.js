var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { addUrl, getSortedCategories, getUrlsInCategory, moveUrl, deleteUrlByIndex } from './components/urlList.js';
import { exportToJson } from './components/importExport.js';
console.log("popup.js is loaded");
document.addEventListener('DOMContentLoaded', () => {
    console.log("Popup script loaded");
    // Fullscreen button logic
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', () => {
            const fullScreenUrl = chrome.runtime.getURL('popup.html');
            window.open(fullScreenUrl, '_blank'); // Open in a new tab
        });
    }
    // "+" and "-" button logic for showing/hiding URL form
    const addUrlButton = document.getElementById('add-url-btn');
    if (addUrlButton) {
        addUrlButton.addEventListener('click', () => {
            const form = document.getElementById('url-form');
            if (form) {
                form.classList.toggle('hidden');
                addUrlButton.textContent = form.classList.contains('hidden') ? "+" : "-";
                console.log("Add URL button clicked, form toggled.");
            }
        });
    }
    // Logic to save a URL
    const saveUrlButton = document.getElementById('save-url');
    if (saveUrlButton) {
        saveUrlButton.addEventListener('click', () => __awaiter(void 0, void 0, void 0, function* () {
            const urlName = document.getElementById('url-name').value;
            const category = document.getElementById('url-category').value;
            let url = document.getElementById('url-link').value;
            // Ensure URL starts with http:// or https://
            if (!/^https?:\/\//i.test(url)) {
                url = `http://${url}`; // Add http:// if the URL doesn't start with http or https
            }
            if (urlName && category && url) {
                try {
                    yield addUrl(urlName, category, url); // Add URL to the category
                    console.log(`Name: ${urlName}, URL: ${url}, Category: ${category} saved.`);
                    alert('URL successfully saved!');
                    yield renderCategories(); // Update the category list
                }
                catch (err) {
                    console.error("Failed to save URL", err);
                }
            }
            else {
                console.log("Name, URL, or Category is missing.");
            }
        }));
    }
    // Toggle the "Settings" section
    const settingsLink = document.getElementById('settings-link');
    const settingsSection = document.getElementById('settings-section');
    if (settingsLink && settingsSection) {
        settingsLink.addEventListener('click', () => {
            settingsSection.classList.toggle('hidden');
            console.log("Settings link clicked, toggled settings section.");
        });
    }
    // Export JSON data
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => __awaiter(void 0, void 0, void 0, function* () {
            console.log("Export button clicked.");
            try {
                yield exportToJson();
                alert('Data exported successfully!');
            }
            catch (err) {
                console.error("Failed to export data", err);
            }
        }));
    }
    // Import JSON data
    const importBtn = document.getElementById('import-btn');
    if (importBtn) {
        importBtn.addEventListener('click', () => {
            console.log("Import button clicked.");
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = (event) => __awaiter(void 0, void 0, void 0, function* () {
                const file = event.target.files[0];
                console.log(`File selected for import: ${file.name}`);
                const reader = new FileReader();
                reader.onload = () => __awaiter(void 0, void 0, void 0, function* () {
                    try {
                        const data = JSON.parse(reader.result); // Parse file contents
                        // Check if the data has the expected structure and save to storage
                        if (data.categories && Array.isArray(data.categories)) {
                            for (const category of data.categories) {
                                if (category.name && Array.isArray(category.urls)) {
                                    for (const urlItem of category.urls) {
                                        yield addUrl(urlItem.name, category.name, urlItem.url); // Save each URL
                                    }
                                }
                            }
                        }
                        alert('Data imported successfully!');
                        yield renderCategories(); // Re-render categories after import
                    }
                    catch (err) {
                        console.error("Failed to import data", err);
                    }
                });
                reader.onerror = () => {
                    console.error("Failed to read file");
                };
                reader.readAsText(file); // Read file as text
            });
            input.click();
        });
    }
    // Function to render categories with drag-and-drop for reordering
    function renderCategories() {
        return __awaiter(this, void 0, void 0, function* () {
            const categories = yield getSortedCategories();
            const categoryList = document.getElementById('category-list');
            if (categoryList) {
                categoryList.innerHTML = '';
                categories.forEach((category) => __awaiter(this, void 0, void 0, function* () {
                    const urls = yield getUrlsInCategory(category);
                    const categorySection = document.createElement('div');
                    categorySection.classList.add('category-section');
                    categorySection.innerHTML = `<h3>${category}</h3>`;
                    urls.forEach(({ name, url }, index) => {
                        var _a;
                        const link = document.createElement('div');
                        link.draggable = true; // Make the link draggable
                        link.setAttribute('data-index', index.toString());
                        link.setAttribute('data-category', category);
                        link.innerHTML = `
            <a href="${url}" target="_blank">${name}</a>
            <span class="trash-icon">🗑️</span>
          `;
                        // Add drag events
                        link.addEventListener('dragstart', handleDragStart);
                        link.addEventListener('dragover', handleDragOver);
                        link.addEventListener('drop', handleDrop);
                        // Event listener for deleting a URL
                        (_a = link.querySelector('.trash-icon')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', () => {
                            if (confirm('Are you sure you want to delete this URL?')) {
                                deleteUrlByIndex(category, index);
                                renderCategories();
                            }
                        });
                        categorySection.appendChild(link);
                    });
                    categoryList.appendChild(categorySection);
                }));
            }
        });
    }
    // Drag-and-drop event handlers
    let draggedIndex = null;
    let draggedCategory = null;
    function handleDragStart(event) {
        var _a;
        const target = event.target;
        draggedIndex = Number(target.getAttribute('data-index'));
        draggedCategory = target.getAttribute('data-category');
        (_a = event.dataTransfer) === null || _a === void 0 ? void 0 : _a.setData('text/plain', '');
    }
    function handleDragOver(event) {
        event.preventDefault(); // Allow drop
    }
    function handleDrop(event) {
        return __awaiter(this, void 0, void 0, function* () {
            const target = event.target;
            const dropIndex = Number(target.getAttribute('data-index'));
            const dropCategory = target.getAttribute('data-category');
            // Check if draggedCategory and dropCategory are not null before proceeding
            if (draggedCategory && draggedIndex !== null && dropCategory === draggedCategory) {
                if (draggedIndex !== dropIndex) {
                    yield moveUrl(draggedCategory, draggedIndex, dropIndex); // Call function to reorder URLs
                    renderCategories(); // Re-render categories after drop
                }
            }
            draggedIndex = null;
            draggedCategory = null;
        });
    }
    // Initial render of categories
    renderCategories();
});
