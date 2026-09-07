# LQA F&B Tracker — Hotel Kimpton Los Monteros Marbella

App interna para que los managers de Food & Beverage registren el avance de
la auditoría LQA (Leading Quality Assurance) 2026 y el Plan de Acción
asociado, con acceso directo desde el móvil como app instalada (PWA).

## Qué hace

- **6 apartados = 6 hojas del Excel**: Desayunos, Restaurante, Buffet,
  Comidas Ligeras, Servicio de Bebidas y Room Service — exactamente los
  puntos de venta que agrega la hoja `RESUMEN TOTAL` del archivo
  `LQA_F_B_2026_-_Hoja_de_auditoría.xlsx`.
- **385 estándares reales**, extraídos tal cual del Excel (texto, grupo y
  sub-apartado), cada uno editable con 3 estados — *Cumplido / No cumplido /
  No aplica* — más una nota libre, igual que en el Excel original.
- **Sin botón de añadir**: la lista de estándares es fija (viene del Excel);
  solo se edita el estado y las notas, como pediste.
- **Gráficas de avance**: anillo de progreso global y por punto de venta,
  y un comparativo de barras de las 6 hojas frente al objetivo del 85 %
  (el mismo objetivo que fija el Plan de Acción para el mes 8).
- **Plan de Acción LQA** como pestaña adicional: las 5 fases del documento
  Word, con sus objetivos y acciones de referencia, y los *entregables* de
  cada fase como checklist editable (también sin botón de añadir).
- **Acceso sin contraseña**: un campo de texto libre para el nombre del
  manager. Ese nombre queda registrado en cada estándar/entregable que
  edite (`updatedBy` + `updatedAt`), para tener trazabilidad de quién
  cambió qué.
- **Instalable (PWA)**: botón "Instalar app" que aparece solo en navegador
  y desaparece en cuanto la app queda instalada (o si ya se abre en modo
  standalone).
- **Funciona ya, sin backend**: guarda todo en `localStorage` del
  dispositivo. En cuanto conectéis Google Sheets + Apps Script, empieza a
  sincronizar solo — no hay que tocar el resto del código.

## Estructura del proyecto

```
lqa-app/
├── index.html               ← shell de la app (gate + layout + template)
├── manifest.json             ← metadatos de instalación PWA
├── service-worker.js         ← caché offline + instalación
├── assets/
│   ├── css/styles.css        ← identidad visual (ver "Diseño" abajo)
│   ├── img/logo.svg          ← logo del hotel (el que enviaste)
│   ├── img/icon-192.png      ← iconos de la PWA
│   ├── img/icon-512.png
│   └── js/
│       ├── data.js           ← 385 estándares generados desde el Excel
│       ├── plan-data.js      ← 5 fases generadas desde el Word
│       ├── config.js         ← ⚠️ aquí pegas la URL de Apps Script
│       ├── store.js          ← localStorage + cola de sincronización
│       ├── icons.js          ← set de iconos SVG propios
│       ├── charts.js         ← gráficas (Chart.js) con la paleta de marca
│       └── app.js            ← routing y renderizado de las vistas
└── backend/
    └── Code.gs               ← backend de Google Apps Script (opcional)
```

## Cómo probarla ya mismo

Es HTML/CSS/JS puro, sin build: abre `index.html` con un servidor local
(no funciona con `file://` por el Service Worker), por ejemplo:

```bash
cd lqa-app
python3 -m http.server 8080
# abre http://localhost:8080
```

## Cómo desplegarla (GitHub + Google Sheets + Apps Script)

1. **GitHub Pages**: sube esta carpeta a un repo y activa GitHub Pages
   (rama `main`, carpeta raíz). La URL resultante ya es instalable como
   PWA en móvil/escritorio (requiere HTTPS, que Pages da por defecto).
2. **Google Sheet**: abre el Excel adjunto en Google Sheets
   (Archivo → Abrir con → Hojas de cálculo de Google, o "Guardar como").
   No hace falta tocar sus fórmulas ni pestañas actuales.
3. **Apps Script**: en ese Sheet, `Extensiones → Apps Script`, pega el
   contenido de `backend/Code.gs`, ejecuta `setup()` una vez, y despliega
   como *Aplicación web* (instrucciones completas dentro del propio
   archivo `Code.gs`).
4. **Conectar la app**: copia la URL `/exec` que te da el despliegue y
   pégala en `assets/js/config.js` → `API_URL`. Sube ese cambio a GitHub.
   A partir de ahí, cada cambio que guarde un manager se envía también al
   Google Sheet (con reintento automático si no hay conexión).

El backend hace *upsert* — guarda el último estado de cada estándar/fase
en una fila propia (hojas `LQA_LOG` y `PLAN_LOG`), no un histórico
infinito. Si en el futuro queréis un histórico completo de cambios, es un
cambio de una línea en `Code.gs` (comentado ahí mismo).

## Diseño

- **Paleta**: fondo ink `#1C1B19`, superficies `#242220`/`#2C2925`, acento
  dorado de marca `#F8AC00` (Pantone 109U, el mismo del PDF de color
  adjunto), verde salvia para "cumplido", terracota para "no cumplido".
- **Tipografía**: *Cormorant Garamond* para títulos (el mismo carácter
  serif elegante del logotipo) y *Work Sans* para el resto de la interfaz,
  pensada para leer 385 estándares sin fatiga visual.
- El logo se usa tal cual lo enviaste, sobre fondo oscuro (es donde mejor
  contrasta al ser un trazo claro).

## Notas sobre los datos

- El Excel original está protegido con contraseña en las 6 hojas de F&B
  (`Monteros.2026`) para que solo se editen ejecución y notas — esta app
  replica esa misma filosofía: la lista de estándares es de solo lectura,
  únicamente se edita estado y nota.
- Dos hojas del Excel (`BUFE` y `COMIDAS LIGERAS`) tienen un título interno
  mal copiado ("RESTAURANTE 2026" en ambas, un error del propio archivo
  original); en la app se muestran con su nombre correcto según la hoja
  `RESUMEN TOTAL`.
- El resto de pestañas del Excel (Check-in, Housekeeping, Spa, etc.) son
  estándares de referencia en inglés sin columnas de ejecución — no forman
  parte de esta auditoría F&B y por eso no están en la app. Si más adelante
  queréis digitalizar también esas áreas, `data.js` está pensado para
  añadir nuevas secciones sin tocar el resto del código.
