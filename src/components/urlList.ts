import { saveToStorage, getFromStorage } from '../storage';
import { sortAlphabetically } from '../utils';

interface UrlEntry {
    name: string;
    category: string;
    url: string;
}

export async function addUrl(urlName: string, category: string, url: string) {
    const data = await getFromStorage();
    if (!data[category]) {
        data[category] = [];
    }
    data[category].push({ name: urlName, url });
    saveToStorage(data);
}

export async function deleteUrl(category: string, urlName: string) {
    const data = await getFromStorage();
    data[category] = data[category].filter((urlEntry: UrlEntry) => urlEntry.name !== urlName);
    saveToStorage(data);
}

export async function getSortedCategories() {
    const data = await getFromStorage();
    const categories = Object.keys(data);
    return sortAlphabetically(categories);
}

export async function getUrlsInCategory(category: string) {
    const data = await getFromStorage();
    return data[category] || [];
}
