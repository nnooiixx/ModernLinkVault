"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const urlList_1 = require("./components/urlList");
const importExport_1 = require("./components/importExport");
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
        saveUrlButton.addEventListener('click', () => __awaiter(void 0, void 0, void 0, function* () {
            const urlName = document.getElementById('url-name').value;
            const category = document.getElementById('url-category').value;
            if (urlName && category) {
                try {
                    yield (0, urlList_1.addUrl)(urlName, category, window.location.href);
                    console.log(`URL Name: ${urlName}, Category: ${category} saved.`);
                    alert('URL successfully saved!');
                }
                catch (err) {
                    console.error("Failed to save URL", err);
                }
            }
            else {
                console.log("URL Name or Category is missing.");
            }
        }));
    }
    // Exporter les données au format JSON
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => __awaiter(void 0, void 0, void 0, function* () {
            console.log("Export button clicked.");
            try {
                yield (0, importExport_1.exportToJson)();
                alert('Data exported successfully!');
            }
            catch (err) {
                console.error("Failed to export data", err);
            }
        }));
    }
    // Importer les données à partir d'un fichier JSON
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
                try {
                    yield (0, importExport_1.importFromJson)(file);
                    alert('Data imported successfully!');
                    yield renderCategories(); // Re-rendre les catégories après l'importation
                }
                catch (err) {
                    console.error("Failed to import data", err);
                }
            });
            input.click();
        });
    }
    // Afficher les catégories triées
    function renderCategories() {
        return __awaiter(this, void 0, void 0, function* () {
            const categories = yield (0, urlList_1.getSortedCategories)();
            const categoryList = document.getElementById('category-list');
            if (categoryList) {
                categoryList.innerHTML = categories.map((category) => `<div>${category}</div>`).join('');
            }
        });
    }
    // Initialiser l'affichage des catégories
    renderCategories();
});
