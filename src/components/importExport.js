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
exports.exportToJson = exportToJson;
exports.importFromJson = importFromJson;
const storage_1 = require("../storage");
function exportToJson() {
    return __awaiter(this, void 0, void 0, function* () {
        const data = yield (0, storage_1.getFromStorage)();
        const jsonData = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'urls.json';
        a.click();
        URL.revokeObjectURL(url);
    });
}
function importFromJson(file) {
    const reader = new FileReader();
    reader.onload = (event) => __awaiter(this, void 0, void 0, function* () {
        const json = JSON.parse(event.target.result);
        yield (0, storage_1.saveToStorage)(json);
    });
    reader.readAsText(file);
}
