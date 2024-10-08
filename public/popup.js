import { addUrl, getSortedCategories, getUrlsInCategory, moveUrl, deleteUrlByIndex, deleteCategory } from './components/urlList.js';
import { exportToJson, importFromJson } from './components/importExport.js';

console.log("popup.js is loaded");

type UrlItem = {
  name: string;
  url: string;
};

let draggedItem: HTMLElement | null = null;
let draggedItemIndex: number | null = null;
let draggedCategory: string | null = null;

document.addEventListener('DOMContentLoaded', async () => {
  console.log("Popup script loaded");

  const fullscreenBtn = document.getElementById('fullscreen-btn');
  if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', () => {
      const fullScreenUrl = chrome.runtime.getURL('popup.html');
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

  const settingsLink = document.getElementById('settings-link');
  if (settingsLink) {
    settingsLink.addEventListener('click', () => {
      const settingsSection = document.getElementById('settings-section');
      if (settingsSection) {
        settingsSection.classList.toggle('hidden');
        console.log("Settings section toggled.");
      }
    });
  }

  async function renderCategories() {
    let categories = await getSortedCategories();
    categories = categories.filter((category, index, self) => category && category.trim() !== "" && self.indexOf(category) === index);

    const categoryList = document.getElementById('category-list');
    if (categoryList) {
      categoryList.innerHTML = '';

      categories.forEach(async (category: string) => {
        const urls: UrlItem[] = await getUrlsInCategory(category);
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
          urls.forEach(({ name, url }, index) => {
            const linkDiv = document.createElement('div');
            linkDiv.classList.add('draggable-item');
            linkDiv.setAttribute('data-index', index.toString());
            linkDiv.setAttribute('data-category', category);
            linkDiv.innerHTML = `
              <div class="drag-handle" style="cursor: grab;">&#x2630;</div>
              <a href="${url}" target="_blank">${name}</a>
              <span class="trash-icon" data-index="${index}" data-category="${category}" style="cursor: pointer;">🗑️</span>
            `;
            urlListDiv.appendChild(linkDiv);

            linkDiv.addEventListener('mousedown', handleMouseDown);
            linkDiv.addEventListener('mouseup', handleMouseUp);
          });

          urlListDiv.addEventListener('dragover', handleMouseOver);
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

  function handleMouseDown(event: MouseEvent) {
    const target = event.target as HTMLElement;
    draggedItem = target.closest('.draggable-item') as HTMLElement;
    draggedCategory = draggedItem?.getAttribute('data-category') ?? null;
    draggedItemIndex = Number(draggedItem?.getAttribute('data-index'));

    if (draggedItem) {
      draggedItem.style.position = 'absolute';
      draggedItem.style.zIndex = '1000';
      document.body.append(draggedItem);

      document.addEventListener('mousemove', handleMouseMove);
    }
  }

  function handleMouseMove(event: MouseEvent) {
    if (draggedItem) {
      draggedItem.style.left = `${event.pageX}px`;
      draggedItem.style.top = `${event.pageY}px`;
    }
  }

  function handleMouseUp() {
    document.removeEventListener('mousemove', handleMouseMove);
    if (draggedItem) {
      const dropCategoryElement = document.elementFromPoint(event.clientX, event.clientY)?.closest('.category-section');
      const dropCategory = dropCategoryElement?.getAttribute('data-category');

      if (dropCategory && draggedCategory !== dropCategory) {
        // Move URL to new category
        moveUrl(draggedCategory!, draggedItemIndex!, 0); // Simplified for demo
      }
      draggedItem = null;
      renderCategories();
    }
  }

  renderCategories();
});
