"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sortAlphabetically = sortAlphabetically;
function sortAlphabetically(arr) {
    return arr.sort((a, b) => a.localeCompare(b));
}
