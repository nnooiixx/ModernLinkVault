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
exports.addUrl = addUrl;
exports.deleteUrl = deleteUrl;
exports.getSortedCategories = getSortedCategories;
exports.getUrlsInCategory = getUrlsInCategory;
const storage_1 = require("../storage");
const utils_1 = require("../utils");
function addUrl(urlName, category, url) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = yield (0, storage_1.getFromStorage)();
        if (!data[category]) {
            data[category] = [];
        }
        data[category].push({ name: urlName, url });
        (0, storage_1.saveToStorage)(data);
    });
}
function deleteUrl(category, urlName) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = yield (0, storage_1.getFromStorage)();
        data[category] = data[category].filter((urlEntry) => urlEntry.name !== urlName);
        (0, storage_1.saveToStorage)(data);
    });
}
function getSortedCategories() {
    return __awaiter(this, void 0, void 0, function* () {
        const data = yield (0, storage_1.getFromStorage)();
        const categories = Object.keys(data);
        return (0, utils_1.sortAlphabetically)(categories);
    });
}
function getUrlsInCategory(category) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = yield (0, storage_1.getFromStorage)();
        return data[category] || [];
    });
}
