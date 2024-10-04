export function sortAlphabetically(arr: string[]) {
    return arr.sort((a, b) => a.localeCompare(b));
}
