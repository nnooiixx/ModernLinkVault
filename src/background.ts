import { getFromStorage } from './storage.js';

browser.runtime.onInstalled.addListener(() => {
    console.log('Extension installed.');
});

browser.storage.onChanged.addListener((changes, area) => {
    console.log('Storage changed', changes);
});
