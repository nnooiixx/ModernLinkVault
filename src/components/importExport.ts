import { saveToStorage, getFromStorage } from '../storage.js';
import { getSortedCategories, getUrlsInCategory } from './urlList.js';

// Export the data into the custom JSON format where categories are top-level keys
export async function exportToJson() {
  const categories = await getSortedCategories(); // Get the sorted list of categories
  const exportData: { [category: string]: { name: string; url: string }[] } = {};

  for (const category of categories) {
    const urls = await getUrlsInCategory(category); // Get the URLs in each category
    exportData[category] = urls.map(({ name, url }: { name: string; url: string }) => ({ name, url })); // Format each category with name-url pairs
  }

  const jsonData = JSON.stringify(exportData, null, 2); // Convert to JSON with pretty-printing

  // Create a downloadable JSON file
  const blob = new Blob([jsonData], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'urls_export.json';
  a.click();
  URL.revokeObjectURL(url); // Clean up the URL
}



export function importFromJson(file: File) {
    const reader = new FileReader();
    reader.onload = async (event: any) => {
        const json = JSON.parse(event.target.result);
        await saveToStorage(json);
    };
    reader.readAsText(file);
}
