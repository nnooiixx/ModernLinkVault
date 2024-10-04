import { addUrl, getSortedCategories, getUrlsInCategory, moveUrlUp, moveUrlDown, deleteUrlByIndex, reorderUrls } from './components/urlList.js';
import { exportToJson, importFromJson } from './components/importExport.js';

console.log("popup.js is loaded");

type UrlItem = {
  name: string;
  url: string;
};

document.addEventListener('DOMContentLoaded', () => {
  console.log("Popup script loaded");
  
  // Gestion du bouton fullscreen
  const fullscreenBtn = document.getElementById('fullscreen-btn');
  if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', () => {
      const fullScreenUrl = chrome.runtime.getURL('popup.html');
      window.open(fullScreenUrl, '_blank'); // Open in a new tab
    });
  }

  // Gestion du bouton "+" et "-"
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

  // Sauvegarde d'une URL avec nom, url et catégorie
  const saveUrlButton = document.getElementById('save-url');
  if (saveUrlButton) {
    saveUrlButton.addEventListener('click', async () => {
      const urlName = (document.getElementById('url-name') as HTMLInputElement).value;
      const category = (document.getElementById('url-category') as HTMLInputElement).value;
      let url = (document.getElementById('url-link') as HTMLInputElement).value;

      // Assurez-vous que l'URL commence par http:// ou https://
      if (!/^https?:\/\//i.test(url)) {
        url = `http://${url}`;  // Ajoute http:// si l'URL ne commence pas par http ou https
      }

      if (urlName && category && url) {
        try {
          await addUrl(urlName, category, url);  // Ajoute l'URL dans la catégorie
          console.log(`Name: ${urlName}, URL: ${url}, Category: ${category} saved.`);
          alert('URL successfully saved!');
          await renderCategories(); // Mettre à jour la liste des catégories
        } catch (err) {
          console.error("Failed to save URL", err);
        }
      } else {
        console.log("Name, URL, or Category is missing.");
      }
    });
  }

  // Toggle de la section "Paramètres"
  const settingsLink = document.getElementById('settings-link');
  const settingsSection = document.getElementById('settings-section');
  if (settingsLink && settingsSection) {
    settingsLink.addEventListener('click', () => {
      settingsSection.classList.toggle('hidden');
      console.log("Settings link clicked, toggled settings section.");
    });
  }

  // Exporter les données en JSON
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

  // Importer des données à partir d'un fichier JSON
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
            const data = JSON.parse(reader.result as string); // Parse le contenu du fichier

            // Assurez-vous que les données ont la structure attendue et enregistrez-les dans le stockage
            if (data.categories && Array.isArray(data.categories)) {
              for (const category of data.categories) {
                if (category.name && Array.isArray(category.urls)) {
                  for (const urlItem of category.urls) {
                    await addUrl(urlItem.name, category.name, urlItem.url); // Sauvegarde chaque URL
                  }
                }
              }
            }

            alert('Data imported successfully!');
            await renderCategories();  // Réafficher les catégories après l'import
          } catch (err) {
            console.error("Failed to import data", err);
          }
        };

        reader.onerror = () => {
          console.error("Failed to read file");
        };

        reader.readAsText(file);  // Lire le fichier en tant que texte
      };

      input.click();
    });
  }

  // Fonction pour afficher les catégories avec des liens, draggable, et corbeille
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
          link.setAttribute('draggable', 'true'); // Add draggable attribute
          link.setAttribute('data-index', index.toString()); 
          link.setAttribute('data-category', category);

          link.innerHTML = `
            <a href="${url}" target="_blank">${name}</a>
            <span class="trash-icon">🗑️</span>
          `;

          // Add drag event listeners
          link.addEventListener('dragstart', handleDragStart);
          link.addEventListener('dragover', handleDragOver);
          link.addEventListener('drop', handleDrop);

          // Icône de corbeille pour supprimer le lien
          const trashIcon = link.querySelector('.trash-icon');
          if (trashIcon) {
            trashIcon.addEventListener('click', () => {
              if (confirm('Are you sure you want to delete this URL?')) {
                deleteUrlByIndex(category, index);
                renderCategories();
              }
            });
          }

          categorySection.appendChild(link);
        });

        categoryList.appendChild(categorySection);
      });
    }
  }

  let draggedIndex: number | null = null;
  let draggedCategory: string | null = null;

  // Handler for drag start
  function handleDragStart(event: DragEvent) {
    const target = event.target as HTMLElement;
    draggedIndex = Number(target.getAttribute('data-index'));
    draggedCategory = target.getAttribute('data-category');
    event.dataTransfer?.setData('text', ''); // To enable drag
  }

  // Handler for drag over (to allow dropping)
  function handleDragOver(event: DragEvent) {
    event.preventDefault();
  }

  // Handler for drop (reordering the URLs)
  async function handleDrop(event: DragEvent) {
    const target = event.target as HTMLElement;
    const dropIndex = Number(target.getAttribute('data-index'));
    const dropCategory = target.getAttribute('data-category');

    if (draggedIndex !== null && draggedCategory === dropCategory) {
      if (draggedIndex !== dropIndex) {
        await reorderUrls(draggedCategory, draggedIndex, dropIndex); // Function to reorder URLs
        renderCategories(); // Re-render categories
      }
    }

    draggedIndex = null;
    draggedCategory = null;
  }

  // Initialiser l'affichage des catégories
  renderCategories();
});
