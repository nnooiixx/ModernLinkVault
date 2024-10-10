import { addUrl, getSortedCategories, getUrlsInCategory, moveUrl, deleteUrlByIndex, deleteCategory } from './components/urlList.js';
import { exportToJson, importFromJson } from './components/importExport.js';
import { saveToStorage, getFromStorage } from './storage.js';

console.log("popup.js is loaded");

type UrlItem = {
  id: string;
  name: string;
  url: string;
};

type UrlCollection = Record<string, UrlItem[]>;

document.addEventListener('DOMContentLoaded', async () => {
  console.log("Popup script loaded");

  const settingsLink = document.getElementById('settings-link');
  if (settingsLink) {
    settingsLink.addEventListener('click', () => {
      const settingsSection = document.getElementById('settings-section');
      if (settingsSection) {
        settingsSection.classList.toggle('hidden');
        console.log("Settings section toggled.");
      }
    });
  } else {
    console.error("Settings link element not found.");
  }

  const syncUrlButton = document.getElementById('sync-url-btn');
  const syncUrlInput = document.getElementById('sync-url-input') as HTMLInputElement;

  const savedSyncUrl = await getStoredSyncUrl();
  if (savedSyncUrl) {
    syncUrlInput.value = savedSyncUrl;
  }

  if (syncUrlButton) {
    syncUrlButton.addEventListener('click', async () => {
      const syncUrl = syncUrlInput.value.trim();

      if (!syncUrl) {
        alert("Please enter a valid URL.");
        return;
      }

      try {
        const remoteUrls = await fetchAndValidateUrls(syncUrl);
        if (remoteUrls) {
          const localUrls = await getLocalUrls();
          const mergedUrls = mergeUrlsWithoutOverwriting(localUrls, remoteUrls);
          await saveToStorage('urls', mergedUrls);
          await renderCategories();

          await saveSyncUrl(syncUrl);
          alert("URLs synchronized successfully.");
        }
      } catch (error) {
        console.error("Sync error:", error);
      }
    });
  }

  async function fetchAndValidateUrls(url: string): Promise<UrlCollection | null> {
    try {
      // Cache-busting: append a timestamp to the URL to ensure fresh data is fetched
      const cacheBustingUrl = `${url}?t=${Date.now()}`;
      const response = await fetch(cacheBustingUrl, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);

      const data: UrlCollection = await response.json();
      if (!validateUrlData(data)) throw new Error("Invalid URL data format.");
      return data;
    } catch (error) {
      console.error("Error fetching remote URLs:", error);
      return null;
    }
  }

  function validateUrlData(data: any): data is UrlCollection {
    return typeof data === 'object' && Object.values(data).every((urls) => Array.isArray(urls) && urls.every(url => url.name && url.url));
  }

  async function getLocalUrls(): Promise<UrlCollection> {
    return new Promise((resolve) => {
      chrome.storage.local.get('urls', (result) => {
        const localUrls: UrlCollection = result.urls || {};
        resolve(localUrls);
      });
    });
  }

  /**
   * Merges remote URLs with local URLs, skipping URLs with duplicate IDs.
   * If the URL has an ID of "0", a new unique ID is generated.
   * @param localUrls - Local URLs stored in the browser.
   * @param remoteUrls - URLs fetched from the remote source.
   */
  function mergeUrlsWithoutOverwriting(localUrls: UrlCollection, remoteUrls: UrlCollection): UrlCollection {
    const merged = { ...localUrls };

    for (const [category, urls] of Object.entries(remoteUrls)) {
      if (!Array.isArray(urls)) continue;

      if (!merged[category]) {
        merged[category] = [];
      }

      const localIds = new Set(merged[category].map(urlItem => urlItem.id));
      urls.forEach(remoteUrlItem => {
        // Generate a unique ID if the ID is '0'
        if (remoteUrlItem.id === '0') {
          remoteUrlItem.id = generateUniqueId();
        }
        if (!localIds.has(remoteUrlItem.id)) {
          merged[category].push(remoteUrlItem); // Only add remote URLs if the id doesn't exist locally
        } else {
          console.log(`Skipping URL with duplicate ID: ${remoteUrlItem.id}`);
        }
      });

      // Automatically delete category if it ends up empty
      if (merged[category].length === 0) {
        delete merged[category];
      }
    }

    return merged;
  }

  async function saveToStorage(key: string, data: any): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: data }, resolve);
    });
  }

  async function saveSyncUrl(syncUrl: string): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.set({ syncUrl }, resolve);
    });
  }

  async function getStoredSyncUrl(): Promise<string | null> {
    return new Promise((resolve) => {
      chrome.storage.local.get('syncUrl', (result) => {
        resolve(result.syncUrl || null);
      });
    });
  }

  function generateUniqueId(): string {
    return `url_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  const fullscreenBtn = document.getElementById('fullscreen-btn');
  if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', () => {
      const fullScreenUrl = chrome.runtime.getURL('public/popup.html');
      window.open(fullScreenUrl, '_blank');
    });
  }

  const exportBtn = document.getElementById('export-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', async () => {
      try {
        const urls = await getFromStorage();
        const jsonData = JSON.stringify(urls, null, 2);

        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'urls_export.json';
        a.click();
        URL.revokeObjectURL(url);

        console.log("URLs exported as JSON.");
      } catch (error) {
        console.error("Error exporting URLs:", error);
      }
    });
  }

  const importBtn = document.getElementById('import-btn');
  if (importBtn) {
    importBtn.addEventListener('click', async () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json';

      input.addEventListener('change', async (event: Event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (file) {
          try {
            const reader = new FileReader();
            reader.onload = async (e: ProgressEvent<FileReader>) => {
              const json = e.target?.result as string;
              const importedUrls: UrlCollection = JSON.parse(json);

              const localUrls: UrlCollection = await getLocalUrls();

              const mergedUrls = mergeUrlsWithoutOverwriting(localUrls, importedUrls);

              // Save merged URLs without overwriting the existing ones
              await chrome.storage.local.set({ urls: mergedUrls });
              await renderCategories();
              console.log("URLs imported successfully, skipping duplicates.");
            };
            reader.readAsText(file);
          } catch (error) {
            console.error("Error importing URLs:", error);
          }
        }
      });

      input.click();
    });
  }

  const addUrlButton = document.getElementById('add-url-btn');
  if (addUrlButton) {
    addUrlButton.addEventListener('click', async () => {
      const form = document.getElementById('url-form');
      if (form) {
        form.classList.toggle('hidden');
        addUrlButton.textContent = form.classList.contains('hidden') ? "+" : "-";

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const currentTab = tabs[0];
          if (currentTab) {
            const urlNameInput = document.getElementById('url-name') as HTMLInputElement;
            const urlLinkInput = document.getElementById('url-link') as HTMLInputElement;
            const urlCategoryInput = document.getElementById('url-category') as HTMLInputElement;

            urlNameInput.value = currentTab.title || 'New URL';
            urlLinkInput.value = currentTab.url || '';
            urlCategoryInput.value = 'default';
          }
        });
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

      const id = generateUniqueId();  // Generate the unique ID here

      try {
        const newUrl: UrlItem = { id, name: urlName, url };  // Include the generated ID
        const urlsInCategory = await getUrlsInCategory(category) || [];
        urlsInCategory.push(newUrl);  // Add the new URL with ID to the category

        // Save the updated category with the new URL (including the ID)
        await chrome.storage.local.set({ urls: { ...await getLocalUrls(), [category]: urlsInCategory } });
        await renderCategories();  // Re-render the categories with the new URL
        console.log(`Added URL: ${urlName}, Category: ${category}, ID: ${id}`);
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

  /**
   * Renders the categories and their URLs, optionally filtered by a search query.
   * @param searchQuery - An optional search query to filter the URLs by.
   */
  async function renderCategories(searchQuery: string = '') {
    let categories = await getSortedCategories();
    categories = categories.filter((category, index, self) => category && category.trim() !== "" && self.indexOf(category) === index);

    const categoryList = document.getElementById('category-list');
    if (categoryList) {
      categoryList.innerHTML = '';

      categories.forEach(async (category: string) => {
        const urls: UrlItem[] = await getUrlsInCategory(category);
        console.log(`Rendering URLs in category '${category}':`, urls);

        const filteredUrls = urls.filter(({ name, url }) => 
          name.toLowerCase().includes(searchQuery) || 
          url.toLowerCase().includes(searchQuery) || 
          category.toLowerCase().includes(searchQuery)
        );

        if (category.toLowerCase().includes(searchQuery) || filteredUrls.length > 0) {
          const categorySection = document.createElement('div');
          categorySection.classList.add('category-section');
          categorySection.innerHTML = `
            <h3>${category}</h3>
            <div class="url-list" id="category-${category}"></div>
          `;

          categoryList.appendChild(categorySection);

          const urlListDiv = document.getElementById(`category-${category}`);
          if (urlListDiv) {
            filteredUrls.forEach(({ id, name, url }, index) => {
              const linkDiv = document.createElement('div');
              linkDiv.classList.add('url-item');
              linkDiv.setAttribute('data-index', index.toString());
              linkDiv.setAttribute('data-id', id);
              linkDiv.setAttribute('data-category', category);
              linkDiv.innerHTML = `
                <div class="url-item-content">
                  <a href="${url}" target="_blank" class="url-link">${name}</a>
                  <span class="edit-icon" data-index="${index}" data-category="${category}" style="cursor: pointer;">✏️</span>
                  <span class="trash-icon" data-index="${index}" data-category="${category}" style="cursor: pointer;">🗑️</span>
                </div>
                <div class="edit-dropdown hidden" id="edit-form-${category}-${index}">
                  <input type="text" class="edit-url-name" value="${name}" />
                  <input type="url" class="edit-url-link" value="${url}" />
                  <input type="text" class="edit-url-category" value="${category}" />
                  <button class="save-edit">Save</button>
                </div>
              `;

              urlListDiv.appendChild(linkDiv);

              // Add event listeners for moving up/down
              linkDiv.querySelector('.edit-icon')?.addEventListener('click', () => toggleEditDropdown(category, index));
              linkDiv.querySelector('.save-edit')?.addEventListener('click', () => saveEdit(category, index));

              // Add event listener for deleting a URL
              linkDiv.querySelector('.trash-icon')?.addEventListener('click', async () => {
                if (confirm('Are you sure you want to delete this URL?')) {
                  await deleteUrlByIndex(category, index);
                  
                  // After deleting, check if the category is empty
                  const remainingUrls = await getUrlsInCategory(category);
                  if (remainingUrls.length === 0) {
                    await deleteCategory(category); // Automatically delete the category if it's empty
                    console.log(`Deleted empty category: ${category}`);
                  }

                  await renderCategories();
                }
              });
            });
          }
        }
      });
    }
  }

  async function toggleEditDropdown(category: string, index: number) {
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
