import { saveToStorage, getFromStorage } from '../storage.js';
import { sortAlphabetically } from '../utils.js';
// Add a URL to a category
export async function addUrl(urlName, category, url) {
    const data = await getFromStorage();
    if (!data[category]) {
        data[category] = [];
    }
    data[category].push({ name: urlName, url });
    await saveToStorage(data);
}
// Delete a URL by name in a category
export async function deleteUrl(category, urlName) {
    const data = await getFromStorage();
    data[category] = data[category].filter((urlEntry) => urlEntry.name !== urlName);
    await saveToStorage(data);
}
// Get all sorted categories alphabetically, ensuring no duplicates
export async function getSortedCategories() {
    const data = await getFromStorage();
    const categories = Object.keys(data).filter(category => category && category.trim() !== "");
    const uniqueCategories = Array.from(new Set(categories)); // Remove duplicates
    return sortAlphabetically(uniqueCategories);
}
// Get all URLs within a category
export async function getUrlsInCategory(category) {
    const data = await getFromStorage();
    return data[category] || [];
}
// Move a URL from one position to another within a category
export async function moveUrl(category, fromIndex, toIndex) {
    const urls = await getUrlsInCategory(category);
    if (fromIndex >= 0 && toIndex >= 0 && fromIndex < urls.length && toIndex < urls.length) {
        const [movedUrl] = urls.splice(fromIndex, 1); // Remove the URL from the old position
        urls.splice(toIndex, 0, movedUrl); // Insert the URL at the new position
        const data = await getFromStorage();
        data[category] = urls;
        await saveToStorage(data);
    }
}
// Delete a URL by index in a category
export async function deleteUrlByIndex(category, index) {
    const urls = await getUrlsInCategory(category);
    urls.splice(index, 1);
    const data = await getFromStorage();
    data[category] = urls;
    await saveToStorage(data);
}
// Delete an entire category and its URLs
export async function deleteCategory(category) {
    const data = await getFromStorage();
    delete data[category]; // Remove the entire category
    await saveToStorage(data);
}
