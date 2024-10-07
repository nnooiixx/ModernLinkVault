var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { saveToStorage, getFromStorage } from '../storage.js';
import { sortAlphabetically } from '../utils.js';
// Add a URL to a category
export function addUrl(urlName, category, url) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = yield getFromStorage();
        if (!data[category]) {
            data[category] = [];
        }
        data[category].push({ name: urlName, url });
        yield saveToStorage(data);
    });
}
// Delete a URL by name in a category
export function deleteUrl(category, urlName) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = yield getFromStorage();
        data[category] = data[category].filter((urlEntry) => urlEntry.name !== urlName);
        yield saveToStorage(data);
    });
}
// Get all sorted categories alphabetically, ensuring no duplicates
export function getSortedCategories() {
    return __awaiter(this, void 0, void 0, function* () {
        const data = yield getFromStorage();
        const categories = Object.keys(data).filter(category => category && category.trim() !== ""); // Filter empty categories
        const uniqueCategories = Array.from(new Set(categories)); // Remove duplicates
        return sortAlphabetically(uniqueCategories);
    });
}
// Get all URLs within a category
export function getUrlsInCategory(category) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = yield getFromStorage();
        return data[category] || [];
    });
}
// Move a URL from one position to another within a category
export function moveUrl(category, fromIndex, toIndex) {
    return __awaiter(this, void 0, void 0, function* () {
        const urls = yield getUrlsInCategory(category);
        if (fromIndex >= 0 && toIndex >= 0 && fromIndex < urls.length && toIndex < urls.length) {
            const [movedUrl] = urls.splice(fromIndex, 1); // Remove the URL from the old position
            urls.splice(toIndex, 0, movedUrl); // Insert the URL at the new position
            const data = yield getFromStorage();
            data[category] = urls;
            yield saveToStorage(data);
        }
    });
}
// Delete a URL by index in a category
export function deleteUrlByIndex(category, index) {
    return __awaiter(this, void 0, void 0, function* () {
        const urls = yield getUrlsInCategory(category);
        urls.splice(index, 1);
        const data = yield getFromStorage();
        data[category] = urls;
        yield saveToStorage(data);
    });
}
// Delete an entire category and its URLs
export function deleteCategory(category) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = yield getFromStorage();
        delete data[category]; // Remove the entire category
        yield saveToStorage(data);
    });
}
