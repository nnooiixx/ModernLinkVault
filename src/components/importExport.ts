import { saveToStorage, getFromStorage } from '../storage';

export async function exportToJson() {
    const data = await getFromStorage();
    const jsonData = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'urls.json';
    a.click();
    URL.revokeObjectURL(url);
}

export function importFromJson(file: File) {
    const reader = new FileReader();
    reader.onload = async (event: any) => {
        const json = JSON.parse(event.target.result);
        await saveToStorage(json);
    };
    reader.readAsText(file);
}
