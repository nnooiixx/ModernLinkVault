var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { addUrl, getSortedCategories, getUrlsInCategory, moveUrlUp, moveUrlDown, deleteUrlByIndex } from './components/urlList.js';
import { exportToJson } from './components/importExport.js';
console.log("popup.js is loaded");
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
        saveUrlButton.addEventListener('click', () => __awaiter(void 0, void 0, void 0, function* () {
            const urlName = document.getElementById('url-name').value;
            const category = document.getElementById('url-category').value;
            let url = document.getElementById('url-link').value;
            // Assurez-vous que l'URL commence par http:// ou https://
            if (!/^https?:\/\//i.test(url)) {
                url = `http://${url}`; // Ajoute http:// si l'URL ne commence pas par http ou https
            }
            if (urlName && category && url) {
                try {
                    yield addUrl(urlName, category, url); // Ajoute l'URL dans la catégorie
                    console.log(`Name: ${urlName}, URL: ${url}, Category: ${category} saved.`);
                    alert('URL successfully saved!');
                    yield renderCategories(); // Mettre à jour la liste des catégories
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
    // Importer des données à partir d'un fichier JSON
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
                        const data = JSON.parse(reader.result); // Parse le contenu du fichier
                        // Assurez-vous que les données ont la structure attendue et enregistrez-les dans le stockage
                        if (data.categories && Array.isArray(data.categories)) {
                            for (const category of data.categories) {
                                if (category.name && Array.isArray(category.urls)) {
                                    for (const urlItem of category.urls) {
                                        yield addUrl(urlItem.name, category.name, urlItem.url); // Sauvegarde chaque URL
                                    }
                                }
                            }
                        }
                        alert('Data imported successfully!');
                        yield renderCategories(); // Réafficher les catégories après l'import
                    }
                    catch (err) {
                        console.error("Failed to import data", err);
                    }
                });
                reader.onerror = () => {
                    console.error("Failed to read file");
                };
                reader.readAsText(file); // Lire le fichier en tant que texte
            });
            input.click();
        });
    }
    // Fonction pour afficher les catégories avec des liens, flèches et corbeille
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
                        const link = document.createElement('a');
                        link.href = url; // Définir l'URL correcte
                        link.textContent = name; // Afficher le nom comme texte cliquable
                        link.target = "_blank"; // Ouvrir le lien dans un nouvel onglet
                        // Flèche vers le haut pour monter le lien
                        const upArrow = document.createElement('span');
                        upArrow.innerHTML = '⬆️';
                        upArrow.classList.add('icon-btn', 'arrow-icon');
                        upArrow.addEventListener('click', () => {
                            moveUrlUp(category, index);
                            renderCategories();
                        });
                        // Flèche vers le bas pour descendre le lien
                        const downArrow = document.createElement('span');
                        downArrow.innerHTML = '⬇️';
                        downArrow.classList.add('icon-btn', 'arrow-icon');
                        downArrow.addEventListener('click', () => {
                            moveUrlDown(category, index);
                            renderCategories();
                        });
                        // Icône de corbeille pour supprimer le lien
                        const trashIcon = document.createElement('span');
                        trashIcon.innerHTML = '🗑️';
                        trashIcon.classList.add('icon-btn', 'trash-icon');
                        // In your URL deletion event listener:
                        trashIcon.addEventListener('click', () => {
                            if (confirm('Are you sure you want to delete this URL?')) {
                                deleteUrlByIndex(category, index); // Use the index-based function
                                renderCategories();
                            }
                        });
                        categorySection.appendChild(link);
                        categorySection.appendChild(upArrow);
                        categorySection.appendChild(downArrow);
                        categorySection.appendChild(trashIcon);
                        categorySection.appendChild(document.createElement('br'));
                    });
                    categoryList.appendChild(categorySection);
                }));
            }
        });
    }
    // Initialiser l'affichage des catégories
    renderCategories();
});
