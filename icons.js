// Set de iconos de línea, minimalistas, dibujados a mano para este proyecto
// (sin librerías externas de iconos).
const ICONS = {
  grid: '<path d="M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z" fill="none" stroke="currentColor" stroke-width="1.6"/>',
  coffee: '<path d="M4 8h13v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8z" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M17 9h1.5a2.5 2.5 0 0 1 0 5H17" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M8 4c-.6.6-.6 1.4 0 2M12 4c-.6.6-.6 1.4 0 2" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>',
  utensils: '<path d="M7 3v7a2 2 0 0 0 2 2v9M7 3v7M9 3v7M11 3v7" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M17 3c-1.7 0-3 2-3 5s1.3 5 3 5v8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
  tray: '<rect x="3" y="6" width="18" height="4" rx="1" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M9 13h6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>',
  leaf: '<path d="M5 19c9 0 14-5 14-14-9 0-14 5-14 14z" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M5 19c2-4 5-7 9-9" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>',
  glass: '<path d="M6 3h12l-2 12a4 4 0 0 1-8 0L6 3z" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 15v6M8 21h8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  bell: '<path d="M6 10a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 14 6 10z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M10 19a2 2 0 0 0 4 0" fill="none" stroke="currentColor" stroke-width="1.6"/>',
  flag: '<path d="M6 21V4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M6 4h11l-2.5 4L17 12H6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
  check: '<path d="M5 12l5 5L19 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
};

function iconSvg(name, size = 16) {
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true">${ICONS[name] || ICONS.grid}</svg>`;
}
