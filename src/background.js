"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
browser.runtime.onInstalled.addListener(() => {
    console.log('Extension installed.');
});
browser.storage.onChanged.addListener((changes, area) => {
    console.log('Storage changed', changes);
});
