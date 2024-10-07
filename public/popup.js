var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { addUrl, getSortedCategories, getUrlsInCategory, moveUrl, deleteUrlByIndex, deleteCategory } from './components/urlList.js';
console.log("popup.js is loaded");
document.addEventListener('DOMContentLoaded', () => {
    console.log("Popup script loaded");
    // Fullscreen button logic
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', () => {
            const fullScreenUrl = chrome.runtime.getURL('popup.html');
            window.open(fullScreenUrl, '_blank');
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
            }
        });
    }
    // Logic to save a URL (Removed the 'URL successfully saved!' message)
    const saveUrlButton = document.getElementById('save-url');
    if (saveUrlButton) {
        saveUrlButton.addEventListener('click', () => __awaiter(void 0, void 0, void 0, function* () {
            const urlName = document.getElementById('url-name').value;
            const category = document.getElementById('url-category').value.trim(); // Remove spaces
            let url = document.getElementById('url-link').value;
            // Ensure URL starts with http:// or https://
            if (!/^https?:\/\//i.test(url)) {
                url = `http://${url}`;
            }
            // Check if category is valid (non-null and not an empty string)
            if (urlName && category && url && category !== "") {
                try {
                    yield addUrl(urlName, category, url);
                    yield renderCategories();
                }
                catch (err) {
                    console.error("Failed to save URL", err);
                }
            }
        }));
    }
    // Function to render categories with drag-and-drop for reordering
    function renderCategories() {
        return __awaiter(this, void 0, void 0, function* () {
            let categories = yield getSortedCategories(); // Ensure unique categories
            // Remove duplicates and null/empty categories
            categories = categories.filter((category, index, self) => {
                return category && category.trim() !== "" && self.indexOf(category) === index;
            });
            const categoryList = document.getElementById('category-list');
            if (categoryList) {
                categoryList.innerHTML = ''; // Clear the existing list
                categories.forEach((category) => __awaiter(this, void 0, void 0, function* () {
                    // Skip empty or null categories
                    if (!category || category.trim() === "")
                        return;
                    const urls = yield getUrlsInCategory(category);
                    const categorySection = document.createElement('div');
                    categorySection.classList.add('category-section');
                    categorySection.innerHTML = `
          <h3>${category}
            <span class="delete-category" data-category="${category}" style="cursor: pointer;">🗑️</span>
          </h3>
        `;
                    // If category is empty, allow dragging into it
                    categorySection.addEventListener('dragover', (event) => {
                        event.preventDefault();
                    });
                    categorySection.addEventListener('drop', (event) => __awaiter(this, void 0, void 0, function* () {
                        if (draggedCategory && draggedIndex !== null) {
                            const url = (yield getUrlsInCategory(draggedCategory))[draggedIndex];
                            yield deleteUrlByIndex(draggedCategory, draggedIndex);
                            yield addUrl(url.name, category, url.url);
                            yield renderCategories();
                        }
                    }));
                    urls.forEach(({ name, url }, index) => {
                        var _a;
                        const link = document.createElement('div');
                        link.draggable = true;
                        link.setAttribute('data-index', index.toString());
                        link.setAttribute('data-category', category);
                        link.classList.add('draggable-item');
                        link.innerHTML = `
            <div class="drag-handle" style="cursor: grab; display: inline-block; vertical-align: middle;">&#x2630;</div>
            <a href="${url}" target="_blank" style="display: inline-block; vertical-align: middle;">${name}</a>
            <span class="trash-icon" data-index="${index}" data-category="${category}" style="cursor: pointer; vertical-align: middle;">🗑️</span>
          `;
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
                // Add delete category functionality
                const deleteCategoryButtons = document.querySelectorAll('.delete-category');
                deleteCategoryButtons.forEach(button => {
                    button.addEventListener('click', (event) => __awaiter(this, void 0, void 0, function* () {
                        const categoryToDelete = event.target.getAttribute('data-category');
                        if (categoryToDelete && confirm(`Are you sure you want to delete the category "${categoryToDelete}"? This will delete all links in the category.`)) {
                            yield deleteCategory(categoryToDelete); // Deletes the category and its URLs
                            yield renderCategories();
                        }
                    }));
                });
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
            if (draggedCategory && draggedIndex !== null) {
                if (dropCategory === draggedCategory) {
                    yield moveUrl(draggedCategory, draggedIndex, dropIndex);
                }
                else {
                    const url = (yield getUrlsInCategory(draggedCategory))[draggedIndex];
                    yield deleteUrlByIndex(draggedCategory, draggedIndex);
                    yield addUrl(url.name, dropCategory, url.url);
                }
                yield renderCategories();
            }
            draggedIndex = null;
            draggedCategory = null;
        });
    }
    // Initial render of categories
    renderCategories();
});
