export function saveToStorage(data) {
    return browser.storage.local.set({ urls: data });
}
export async function getFromStorage() {
    const result = await browser.storage.local.get('urls');
    return result.urls || {};
}
