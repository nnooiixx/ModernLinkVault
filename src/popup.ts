import { addUrl, getSortedCategories, getUrlsInCategory, moveUrl, deleteUrlByIndex } from './components/urlList.js';
import { exportToJson, importFromJson } from './components/importExport.js';

console.log("popup.js is loaded");

type UrlItem = {
  name: string;
  url: string;
};

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
    saveUrlButton.addEventListener('click', async () => {
      const urlName = (document.getElementById('url-name') as HTMLInputElement).value;
      const category = (document.getElementById('url-category') as HTMLInputElement).value;
      let url = (document.getElementById('url-link') as HTMLInputElement).value;

      // Ensure URL starts with http:// or https://
      if (!/^https?:\/\//i.test(url)) {
        url = `http://${url}`;  // Add http:// if the URL doesn't start with http or https
      }

      if (urlName && category && url) {
        try {
          await addUrl(urlName, category, url);  // Add URL to the category
          console.log(`Name: ${urlName}, URL: ${url}, Category: ${category} saved.`);
          alert('URL successfully saved!');
          await renderCategories(); // Update the category list
        } catch (err) {
          console.error("Failed to save URL", err);
        }
      } else {
        console.log("Name, URL, or Category is missing.");
      }
    });
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
    exportBtn.addEventListener('click', async () => {
      console.log("Export button clicked.");
      try {
        await exportToJson();
        alert('Data exported successfully!');
      } catch (err) {
        console.error("Failed to export data", err);
      }
    });
  }

  // Import JSON data
  const importBtn = document.getElementById('import-btn');
  if (importBtn) {
    importBtn.addEventListener('click', () => {
      console.log("Import button clicked.");
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';

      input.onchange = async (event: any) => {
        const file = event.target.files[0];
        console.log(`File selected for import: ${file.name}`);

        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const data = JSON.parse(reader.result as string); // Parse file contents

            // Check if the data has the expected structure and save to storage
            if (data.categories && Array.isArray(data.categories)) {
              for (const category of data.categories) {
                if (category.name && Array.isArray(category.urls)) {
                  for (const urlItem of category.urls) {
                    await addUrl(urlItem.name, category.name, urlItem.url); // Save each URL
                  }
                }
              }
            }

            alert('Data imported successfully!');
            await renderCategories();  // Re-render categories after import
          } catch (err) {
            console.error("Failed to import data", err);
          }
        };

        reader.onerror = () => {
          console.error("Failed to read file");
        };

        reader.readAsText(file);  // Read file as text
      };

      input.click();
    });
  }

  // Function to render categories with drag-and-drop for reordering
  async function renderCategories() {
    const categories = await getSortedCategories();
    const categoryList = document.getElementById('category-list');

    if (categoryList) {
      categoryList.innerHTML = '';
      categories.forEach(async (category: string) => {
        const urls: UrlItem[] = await getUrlsInCategory(category);
        const categorySection = document.createElement('div');
        categorySection.classList.add('category-section');
        categorySection.innerHTML = `<h3>${category}</h3>`;

        urls.forEach(({ name, url }: UrlItem, index: number) => {
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
          link.querySelector('.trash-icon')?.addEventListener('click', () => {
            if (confirm('Are you sure you want to delete this URL?')) {
              deleteUrlByIndex(category, index);
              renderCategories();
            }
          });

          categorySection.appendChild(link);
        });

        categoryList.appendChild(categorySection);
      });
    }
  }

  // Drag-and-drop event handlers
  let draggedIndex: number | null = null;
  let draggedCategory: string | null = null;

  function handleDragStart(event: DragEvent) {
    const target = event.target as HTMLElement;
    draggedIndex = Number(target.getAttribute('data-index'));
    draggedCategory = target.getAttribute('data-category');
    event.dataTransfer?.setData('text/plain', '');
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault(); // Allow drop
  }

  async function handleDrop(event: DragEvent) {
    const target = event.target as HTMLElement;
    const dropIndex = Number(target.getAttribute('data-index'));
    const dropCategory = target.getAttribute('data-category');

    // Check if draggedCategory and dropCategory are not null before proceeding
    if (draggedCategory && draggedIndex !== null && dropCategory === draggedCategory) {
      if (draggedIndex !== dropIndex) {
        await moveUrl(draggedCategory, draggedIndex, dropIndex); // Call function to reorder URLs
        renderCategories(); // Re-render categories after drop
      }
    }

    draggedIndex = null;
    draggedCategory = null;
  }

  // Initial render of categories
  renderCategories();
});
