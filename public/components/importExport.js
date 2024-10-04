var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { saveToStorage } from '../storage.js';
import { getSortedCategories, getUrlsInCategory } from './urlList.js';
// Export the data into the custom JSON format where categories are top-level keys
export function exportToJson() {
    return __awaiter(this, void 0, void 0, function* () {
        const categories = yield getSortedCategories(); // Get the sorted list of categories
        const exportData = {};
        for (const category of categories) {
            const urls = yield getUrlsInCategory(category); // Get the URLs in each category
            exportData[category] = urls.map(({ name, url }) => ({ name, url })); // Format each category with name-url pairs
        }
        const jsonData = JSON.stringify(exportData, null, 2); // Convert to JSON with pretty-printing
        // Create a downloadable JSON file
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'urls_export.json';
        a.click();
        URL.revokeObjectURL(url); // Clean up the URL
    });
}
export function importFromJson(file) {
    const reader = new FileReader();
    reader.onload = (event) => __awaiter(this, void 0, void 0, function* () {
        const json = JSON.parse(event.target.result);
        yield saveToStorage(json);
    });
    reader.readAsText(file);
}
