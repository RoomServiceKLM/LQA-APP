// ────────────────────────────────────────────────────────────────────────
// CONFIGURACIÓN DE CONEXIÓN
// ────────────────────────────────────────────────────────────────────────
// Cuando conectéis el Google Sheet + Apps Script (ver /backend/Code.gs),
// pegad aquí la URL del despliegue ("Implementar" → "Aplicación web").
// Mientras esté vacía, la app funciona 100% offline con localStorage.
//
// Ejemplo:
// API_URL: "https://script.google.com/macros/s/AKfycbymWGdO07GXbOtm5ZbvlUu7kYeNbyoQQ2lhUOTpAtPtG_m7sbvxGLYt1fAxM4dbuK8IoQ/exec"
// ────────────────────────────────────────────────────────────────────────
const APP_CONFIG = {
  API_URL: "",              // <-- pegar aquí la URL del Web App de Apps Script
  API_TOKEN: "",            // opcional: token simple si lo añadís en Code.gs
  SYNC_RETRY_MS: 15000,     // cada cuánto reintenta enviar la cola pendiente
};
