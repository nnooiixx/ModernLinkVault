import { saveToStorage, getFromStorage } from '../storage.js';
import { sortAlphabetically } from '../utils.js';

interface UrlEntry {
    name: string;
    category: string;
    url: string;
}

// Add a URL to a category
export async function addUrl(urlName: string, category: string, url: string) {
    const data = await getFromStorage();
    if (!data[category]) {
        data[category] = [];
    }
    data[category].push({ name: urlName, url });
    await saveToStorage(data);  // Ensure we await storage operations
}

// Delete a URL by name in a category
export async function deleteUrl(category: string, urlName: string) {
    const data = await getFromStorage();
    data[category] = data[category].filter((urlEntry: UrlEntry) => urlEntry.name !== urlName);
    await saveToStorage(data);
}

// Get all categories sorted alphabetically
export async function getSortedCategories() {
    const data = await getFromStorage();
    const categories = Object.keys(data);
    return sortAlphabetically(categories);
}

// Get all URLs within a category
export async function getUrlsInCategory(category: string) {
    const data = await getFromStorage();
    return data[category] || [];
}

// Move a URL from one position to another within a category (for drag-and-drop)
export async function moveUrl(category: string, fromIndex: number, toIndex: number) {
    const urls = await getUrlsInCategory(category);  // Ensure we await the result
    if (fromIndex >= 0 && toIndex >= 0 && fromIndex < urls.length && toIndex < urls.length) {
        const [movedUrl] = urls.splice(fromIndex, 1); // Remove the URL from the old position
        urls.splice(toIndex, 0, movedUrl);  // Insert the URL at the new position
        const data = await getFromStorage();
        data[category] = urls;
        await saveToStorage(data);  // Save the updated array with the reordered URLs
    }
}

// Delete a URL by index in a category
export async function deleteUrlByIndex(category: string, index: number) {
    const urls = await getUrlsInCategory(category);  // Ensure we await the result
    urls.splice(index, 1);  // Remove the URL from the array
    const data = await getFromStorage();
    data[category] = urls;
    await saveToStorage(data);
}
