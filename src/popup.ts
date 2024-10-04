import { addUrl, getSortedCategories, getUrlsInCategory } from './components/urlList';
import { exportToJson, importFromJson } from './components/importExport';
console.log("popup.js is loaded");

// Vérifie que le DOM est entièrement chargé avant d'exécuter le script
document.addEventListener('DOMContentLoaded', () => {
  console.log("Popup script loaded");

  // Bouton pour afficher/masquer le formulaire d'ajout d'URL
  const addUrlButton = document.getElementById('add-url-btn');
  if (addUrlButton) {
    addUrlButton.addEventListener('click', () => {
      const form = document.getElementById('url-form');
      if (form) {
        form.classList.toggle('hidden');
        console.log("Add URL button clicked, form toggled.");
      }
    });
  }

  // Sauvegarder une URL
  const saveUrlButton = document.getElementById('save-url');
  if (saveUrlButton) {
    saveUrlButton.addEventListener('click', async () => {
      const urlName = (document.getElementById('url-name') as HTMLInputElement).value;
      const category = (document.getElementById('url-category') as HTMLInputElement).value;

      if (urlName && category) {
        try {
          await addUrl(urlName, category, window.location.href);
          console.log(`URL Name: ${urlName}, Category: ${category} saved.`);
          alert('URL successfully saved!');
        } catch (err) {
          console.error("Failed to save URL", err);
        }
      } else {
        console.log("URL Name or Category is missing.");
      }
    });
  }

  // Exporter les données au format JSON
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

  // Importer les données à partir d'un fichier JSON
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

        try {
          await importFromJson(file);
          alert('Data imported successfully!');
          await renderCategories();  // Re-rendre les catégories après l'importation
        } catch (err) {
          console.error("Failed to import data", err);
        }
      };
      input.click();
    });
  }

  // Afficher les catégories triées
  async function renderCategories() {
    const categories = await getSortedCategories();
    const categoryList = document.getElementById('category-list');

    if (categoryList) {
      categoryList.innerHTML = categories.map((category: string) => `<div>${category}</div>`).join('');
    }
  }

  // Initialiser l'affichage des catégories
  renderCategories();
});
