import { getFromStorage } from './storage';

browser.runtime.onInstalled.addListener(() => {
    console.log('Extension installed.');
});

browser.storage.onChanged.addListener((changes, area) => {
    console.log('Storage changed', changes);
});
