import { addUrl, getSortedCategories, getUrlsInCategory, moveUrl, deleteUrlByIndex, deleteCategory } from './components/urlList.js';
import { exportToJson, importFromJson } from './components/importExport.js';

console.log("popup.js is loaded");

type UrlItem = {
  name: string;
  url: string;
};

document.addEventListener('DOMContentLoaded', async () => {
  console.log("Popup script loaded");

  const fullscreenBtn = document.getElementById('fullscreen-btn');
  if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', () => {
      const fullScreenUrl = chrome.runtime.getURL('public/popup.html');
      window.open(fullScreenUrl, '_blank');
    });
  }

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

  const saveUrlButton = document.getElementById('save-url');
  if (saveUrlButton) {
    saveUrlButton.addEventListener('click', async () => {
      const urlName = (document.getElementById('url-name') as HTMLInputElement).value.trim();
      const category = (document.getElementById('url-category') as HTMLInputElement).value.trim();
      let url = (document.getElementById('url-link') as HTMLInputElement).value.trim();

      if (!urlName || !category || !url) {
        console.error("Missing URL, category, or name.");
        return;
      }

      if (!/^https?:\/\//i.test(url)) {
        url = `http://${url}`;
      }

      try {
        await addUrl(urlName, category, url);
        console.log(`Added URL: ${urlName}, Category: ${category}`);
        await renderCategories();
      } catch (err) {
        console.error("Failed to save URL", err);
      }
    });
  }

  const searchInput = document.getElementById('search-input') as HTMLInputElement;
  if (searchInput) {
    searchInput.addEventListener('input', async () => {
      const query = searchInput.value.trim().toLowerCase();
      await renderCategories(query);
    });
  }

  async function renderCategories(searchQuery: string = '') {
    let categories = await getSortedCategories();
    categories = categories.filter((category, index, self) => category && category.trim() !== "" && self.indexOf(category) === index);

    const categoryList = document.getElementById('category-list');
    if (categoryList) {
      categoryList.innerHTML = '';

      categories.forEach(async (category: string) => {
        const urls: UrlItem[] = await getUrlsInCategory(category);
        const filteredUrls = urls.filter(({ name, url }) => 
          name.toLowerCase().includes(searchQuery) || 
          url.toLowerCase().includes(searchQuery) || 
          category.toLowerCase().includes(searchQuery)
        );

        if (category.toLowerCase().includes(searchQuery) || filteredUrls.length > 0) {
          const categorySection = document.createElement('div');
          categorySection.classList.add('category-section');
          categorySection.innerHTML = `
            <h3>${category}
              <span class="delete-category" data-category="${category}" style="cursor: pointer;">🗑️</span>
            </h3>
            <div class="url-list" id="category-${category}"></div>
          `;

          categoryList.appendChild(categorySection);

          const urlListDiv = document.getElementById(`category-${category}`);
          if (urlListDiv) {
            filteredUrls.forEach(({ name, url }, index) => {
              const linkDiv = document.createElement('div');
              linkDiv.classList.add('url-item');
              linkDiv.setAttribute('data-index', index.toString());
              linkDiv.setAttribute('data-category', category);
              linkDiv.innerHTML = `
              <div class="url-item-content">
                <div class="arrow-container">
                  <span class="up-arrow" data-index="${index}" data-category="${category}"></span>
                  <span class="down-arrow" data-index="${index}" data-category="${category}"></span>
                </div>
                <a href="${url}" target="_blank" class="url-link">${name}</a>
                <span class="edit-icon" data-index="${index}" data-category="${category}" style="cursor: pointer;">✏️</span>
                <span class="trash-icon" data-index="${index}" data-category="${category}" style="cursor: pointer;">🗑️</span>
              </div>
              <div class="edit-dropdown hidden" id="edit-form-${category}-${index}">
                <input type="text" class="edit-url-name" value="${name}" />
                <input type="url" class="edit-url-link" value="${url}" />
                <input type="text" class="edit-url-category" value="${category}" />
                <button class="save-edit" style="background-color: #238636; color: white;">Save</button>
              </div>
            `;

              urlListDiv.appendChild(linkDiv);

              // Add event listeners for moving up/down
              linkDiv.querySelector('.up-arrow')?.addEventListener('click', () => moveUrlUp(category, index));
              linkDiv.querySelector('.down-arrow')?.addEventListener('click', () => moveUrlDown(category, index));

              // Add event listener for deleting a URL
              linkDiv.querySelector('.trash-icon')?.addEventListener('click', async () => {
                if (confirm('Are you sure you want to delete this URL?')) {
                  await deleteUrlByIndex(category, index);
                  await renderCategories();
                }
              });

              // Add event listener for editing a URL
              linkDiv.querySelector('.edit-icon')?.addEventListener('click', () => toggleEditDropdown(category, index));
              linkDiv.querySelector('.save-edit')?.addEventListener('click', () => saveEdit(category, index));
            });
          }
        }
      });

      document.querySelectorAll('.delete-category').forEach(button => {
        button.addEventListener('click', async (event) => {
          const categoryToDelete = (event.target as HTMLElement).getAttribute('data-category');
          if (categoryToDelete && confirm(`Delete category "${categoryToDelete}"?`)) {
            await deleteCategory(categoryToDelete);
            await renderCategories();
          }
        });
      });
    }
  }

  async function moveUrlUp(category: string, index: number) {
    if (index > 0) {
      await moveUrl(category, index, index - 1);
      await renderCategories();
    }
  }

  async function moveUrlDown(category: string, index: number) {
    const urls = await getUrlsInCategory(category);
    if (index < urls.length - 1) {
      await moveUrl(category, index, index + 1);
      await renderCategories();
    }
  }

  function toggleEditDropdown(category: string, index: number) {
    const dropdown = document.getElementById(`edit-form-${category}-${index}`);
    if (dropdown) {
      dropdown.classList.toggle('hidden');
    }
  }

  async function saveEdit(category: string, index: number) {
    const nameInput = document.querySelector(`#edit-form-${category}-${index} .edit-url-name`) as HTMLInputElement;
    const urlInput = document.querySelector(`#edit-form-${category}-${index} .edit-url-link`) as HTMLInputElement;
    const categoryInput = document.querySelector(`#edit-form-${category}-${index} .edit-url-category`) as HTMLInputElement;

    const newName = nameInput.value.trim();
    const newUrl = urlInput.value.trim();
    const newCategory = categoryInput.value.trim();

    if (newName && newUrl) {
      await deleteUrlByIndex(category, index);
      await addUrl(newName, newCategory, newUrl);
      await renderCategories();
    }
  }

  renderCategories();
});
