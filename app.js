// ────────────────────────────────────────────────────────────────────────
// APP — routing por hash + render de vistas + interacción con Store
// ────────────────────────────────────────────────────────────────────────

const GROUP_LABELS = {
  "EFICIENCIA": "Eficiencia",
  "SERVICIO": "Servicio",
  "SOSTENIBILIDAD": "Sostenibilidad",
  "PRODUCTO": "Producto",
  "CALIDAD DE LA COMIDA": "Calidad de la comida",
  "OPORTUNIDAD DE VENTA": "Oportunidad de venta",
  "INTELIGENCIA EMOCIONAL": "Inteligencia emocional",
  "COMPORTAMIENTO DE INTELIGENCIA EMOCIONAL": "Inteligencia emocional",
};

let deferredInstallPrompt = null;

document.addEventListener("DOMContentLoaded", () => {
  initGate();
  buildTabbar();
  setupInstallPrompt();
  registerServiceWorker();
  Store.setSyncListener(updateSyncFooter);
  Store.scheduleSync(false);

  window.addEventListener("hashchange", renderRoute);
});

// ============================== GATE (acceso sin contraseña) ==============================
function initGate() {
  const gate = document.getElementById("gate");
  const appEl = document.getElementById("app");
  const existing = Store.getManager();

  if (existing) {
    showApp(existing);
  } else {
    gate.hidden = false;
  }

  document.getElementById("gate-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = document.getElementById("manager-name");
    const name = input.value.trim();
    if (!name) return;
    Store.setManager(name);
    showApp(name);
  });
}

function showApp(name) {
  document.getElementById("gate").hidden = true;
  document.getElementById("app").hidden = false;
  document.getElementById("user-name-label").textContent = name;
  if (!location.hash) location.hash = "#resumen";
  renderRoute();
}

document.addEventListener("click", (e) => {
  if (e.target.closest("#user-chip")) {
    const current = Store.getManager();
    const next = prompt("Cambiar de manager (se identificarán tus próximos cambios con este nombre):", current);
    if (next && next.trim()) {
      Store.setManager(next.trim());
      document.getElementById("user-name-label").textContent = next.trim();
      showToast(`Ahora editas como ${next.trim()}`);
    }
  }
});

// ============================== TABBAR ==============================
function buildTabbar() {
  const bar = document.getElementById("tabbar");
  const tabs = [
    { key: "resumen", label: "Resumen", icon: "grid" },
    ...LQA_DATA.sections.map(s => ({ key: s.key, label: s.title, icon: s.icon })),
    { key: "plan", label: "Plan de Acción", icon: "flag" },
  ];
  bar.innerHTML = tabs.map(t => `
    <button class="tab-btn" data-route="${t.key}">
      ${iconSvg(t.icon, 15)}
      <span>${t.label}</span>
      <span class="tab-pct" data-pct-for="${t.key}"></span>
    </button>
  `).join("");

  bar.addEventListener("click", (e) => {
    const btn = e.target.closest(".tab-btn");
    if (!btn) return;
    location.hash = "#" + btn.dataset.route;
  });
}

function updateTabbarPercents() {
  LQA_DATA.sections.forEach(s => {
    const stats = Store.sectionStats(s.key, s.items);
    const el = document.querySelector(`[data-pct-for="${s.key}"]`);
    if (el) el.textContent = stats.pct + "%";
  });
  const planPct = overallPlanPct();
  const planEl = document.querySelector('[data-pct-for="plan"]');
  if (planEl) planEl.textContent = planPct + "%";

  const overall = overallAuditPct();
  const resumenEl = document.querySelector('[data-pct-for="resumen"]');
  if (resumenEl) resumenEl.textContent = overall + "%";
}

function setActiveTab(route) {
  document.querySelectorAll(".tab-btn").forEach(b => {
    b.classList.toggle("active", b.dataset.route === route);
  });
}

// ============================== ROUTER ==============================
function renderRoute() {
  const route = (location.hash || "#resumen").replace("#", "");
  setActiveTab(route);
  updateTabbarPercents();

  const view = document.getElementById("view");
  const section = LQA_DATA.sections.find(s => s.key === route);

  if (route === "resumen") {
    view.innerHTML = renderSummaryView();
    mountSummaryCharts();
  } else if (section) {
    view.innerHTML = renderSectionView(section);
    mountSectionChart(section);
    bindSectionEvents(section);
  } else if (route === "plan") {
    view.innerHTML = renderPlanView();
    bindPlanEvents();
  } else {
    location.hash = "#resumen";
  }
  window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
}

// ============================== HELPERS DE PROGRESO ==============================
function overallAuditPct() {
  let ok = 0, evaluable = 0;
  LQA_DATA.sections.forEach(s => {
    const st = Store.sectionStats(s.key, s.items);
    ok += st.ok; evaluable += (st.ok + st.bad);
  });
  return evaluable > 0 ? Math.round((ok / evaluable) * 100) : 0;
}

function overallPlanPct() {
  const totals = PLAN_DATA.fases.map(f => Store.planPhaseStats(f));
  const totalItems = totals.reduce((a, t) => a + t.total, 0);
  const doneItems = totals.reduce((a, t) => a + t.done, 0);
  return totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;
}

// ============================== VISTA: RESUMEN ==============================
function renderSummaryView() {
  const overall = overallAuditPct();
  const target = LQA_DATA.target;

  let ok = 0, bad = 0, na = 0, pending = 0;
  LQA_DATA.sections.forEach(s => {
    const st = Store.sectionStats(s.key, s.items);
    ok += st.ok; bad += st.bad; na += st.na; pending += st.pending;
  });

  const outletCards = LQA_DATA.sections.map(s => {
    const st = Store.sectionStats(s.key, s.items);
    return `
      <div class="outlet-card" data-route="${s.key}">
        <div class="outlet-top">
          <div class="outlet-icon">${iconSvg(s.icon, 18)}</div>
          <span class="stat-label">${st.total} estándares</span>
        </div>
        <div>
          <div class="outlet-name">${s.title}</div>
          <div class="outlet-sub">${s.subtitle}</div>
        </div>
        <div class="outlet-progress-track"><div class="outlet-progress-fill" style="width:${st.pct}%"></div></div>
        <div class="outlet-foot">
          <span>${st.ok + st.bad}/${st.total} evaluados</span>
          <span class="outlet-pct">${st.pct}%</span>
        </div>
      </div>`;
  }).join("");

  return `
    <div class="view-header">
      <p class="view-eyebrow">Hotel Kimpton Los Monteros Marbella</p>
      <h1 class="view-title">Resumen LQA · Food &amp; Beverage</h1>
      <p class="view-subtitle">Avance combinado de los 6 puntos de venta auditados frente al estándar LQA 2026.</p>
    </div>

    <div class="card summary-hero">
      <div class="summary-ring-wrap">
        <div class="summary-ring">
          <canvas id="chart-overall-ring"></canvas>
          <div class="summary-ring-label">
            <span class="summary-ring-pct">${overall}%</span>
            <span class="summary-ring-caption">completado</span>
          </div>
        </div>
        <span class="summary-target">Objetivo del plan de acción: <b>${target}%</b></span>
      </div>
      <div class="summary-stats">
        <div class="stat-box stat-ok"><div class="stat-value">${ok}</div><div class="stat-label">Cumplidos</div></div>
        <div class="stat-box stat-bad"><div class="stat-value">${bad}</div><div class="stat-label">No cumplidos</div></div>
        <div class="stat-box stat-na"><div class="stat-value">${na}</div><div class="stat-label">No aplica</div></div>
        <div class="stat-box stat-pending"><div class="stat-value">${pending}</div><div class="stat-label">Pendientes</div></div>
      </div>
    </div>

    <div class="section-title-row">
      <h2>Comparativa por punto de venta</h2>
      <span class="hint">La línea discontinua marca el objetivo (${target}%)</span>
    </div>
    <div class="card bars-card">
      <div class="bars-canvas-wrap"><canvas id="chart-outlet-bars"></canvas></div>
    </div>

    <div class="section-title-row">
      <h2>Puntos de venta</h2>
      <span class="hint">Toca una tarjeta para abrir su checklist</span>
    </div>
    <div class="outlet-grid">${outletCards}</div>
  `;
}

function mountSummaryCharts() {
  const overall = overallAuditPct();
  renderProgressRing("chart-overall-ring", overall, LQA_DATA.target);

  const labels = LQA_DATA.sections.map(s => s.title);
  const values = LQA_DATA.sections.map(s => Store.sectionStats(s.key, s.items).pct);
  renderOutletBars("chart-outlet-bars", labels, values, LQA_DATA.target);

  document.querySelectorAll(".outlet-card").forEach(card => {
    card.addEventListener("click", () => { location.hash = "#" + card.dataset.route; });
  });
}

// ============================== VISTA: SECCIÓN (CHECKLIST) ==============================
function renderSectionView(section) {
  const st = Store.sectionStats(section.key, section.items);
  const groups = groupItemsBySection(section.items);

  const groupBlocks = Object.entries(groups).map(([label, items]) => `
    <div class="group-block" data-group-block>
      <h3 class="group-heading">${label}</h3>
      <div class="standard-list">${items.map(renderStandardRowHTML).join("")}</div>
    </div>
  `).join("");

  const groupTypes = [...new Set(section.items.map(i => i.group))].filter(Boolean);

  return `
    <div class="view-header">
      <p class="view-eyebrow">${section.sourceSheet.replace(/\|.*/, "")}</p>
      <h1 class="view-title">${section.title}</h1>
      <p class="view-subtitle">${section.subtitle}</p>
    </div>

    <div class="card section-head">
      <div class="section-ring">
        <canvas id="chart-section-ring"></canvas>
        <div class="section-ring-label">
          <span class="section-ring-pct">${st.pct}%</span>
        </div>
      </div>
      <div>
        <div class="section-mini-stats">
          <span class="mini-stat"><span class="mini-dot ok"></span>${st.ok} cumplidos</span>
          <span class="mini-stat"><span class="mini-dot bad"></span>${st.bad} no cumplidos</span>
          <span class="mini-stat"><span class="mini-dot na"></span>${st.na} no aplica</span>
          <span class="mini-stat"><span class="mini-dot pending"></span>${st.pending} pendientes</span>
        </div>
        <p class="view-subtitle" style="margin-top:14px;">${st.total} estándares LQA en esta hoja · objetivo ${LQA_DATA.target}%</p>
      </div>
    </div>

    <div class="filter-row" id="group-filters">
      <button class="filter-chip active" data-filter="all">Todos</button>
      ${groupTypes.map(g => `<button class="filter-chip" data-filter="${g}">${GROUP_LABELS[g] || g}</button>`).join("")}
      <button class="filter-chip" data-filter="__pending">Solo pendientes</button>
    </div>

    ${groupBlocks}
  `;
}

function groupItemsBySection(items) {
  const groups = {};
  items.forEach(it => {
    const key = it.section || "Estándares";
    if (!groups[key]) groups[key] = [];
    groups[key].push(it);
  });
  return groups;
}

function renderStandardRowHTML(item) {
  return `
    <article class="standard-row" data-id="${item.id}" data-group="${item.group}">
      <div class="standard-main">
        <span class="standard-id">${item.id}</span>
        <div class="standard-body">
          <p class="standard-text">${escapeHtml(item.text)}</p>
          <span class="standard-tag">${GROUP_LABELS[item.group] || item.group || "—"}</span>
        </div>
      </div>
      <div class="standard-controls">
        <div class="status-group" role="radiogroup" aria-label="Estado del estándar ${item.id}">
          <button type="button" class="status-btn status-ok" data-status="cumplido">Cumplido</button>
          <button type="button" class="status-btn status-bad" data-status="no_cumplido">No cumplido</button>
          <button type="button" class="status-btn status-na" data-status="no_aplica">No aplica</button>
        </div>
        <button type="button" class="note-toggle" aria-expanded="false">
          ${iconSvg("check", 14)}<span class="note-toggle-label">Nota</span>
        </button>
      </div>
      <div class="standard-note" hidden>
        <textarea rows="2" maxlength="500" placeholder="Añade una nota u observación para este estándar…"></textarea>
        <span class="note-meta"></span>
      </div>
    </article>
  `;
}

function mountSectionChart(section) {
  const st = Store.sectionStats(section.key, section.items);
  renderProgressRing("chart-section-ring", st.pct, LQA_DATA.target);

  // Hidratar cada fila con el estado guardado
  document.querySelectorAll(".standard-row").forEach(row => {
    const id = row.dataset.id;
    const entry = Store.getEntry(section.key, id);
    applyRowVisualState(row, entry);
  });
}

function applyRowVisualState(row, entry) {
  row.classList.remove("is-ok", "is-bad", "is-na");
  row.querySelectorAll(".status-btn").forEach(b => b.classList.remove("is-active"));
  const status = entry && entry.status;
  if (status) {
    row.classList.add(status === "cumplido" ? "is-ok" : status === "no_cumplido" ? "is-bad" : "is-na");
    const activeBtn = row.querySelector(`.status-btn[data-status="${status}"]`);
    if (activeBtn) activeBtn.classList.add("is-active");
  }
  const noteToggle = row.querySelector(".note-toggle");
  const textarea = row.querySelector("textarea");
  const meta = row.querySelector(".note-meta");
  const notes = entry && entry.notes;
  if (notes) {
    textarea.value = notes;
    noteToggle.classList.add("has-note");
  }
  if (entry && entry.updatedBy) {
    meta.textContent = `Última edición: ${entry.updatedBy} · ${formatDate(entry.updatedAt)}`;
  }
}

function bindSectionEvents(section) {
  const view = document.getElementById("view");

  view.addEventListener("click", (e) => {
    const statusBtn = e.target.closest(".status-btn");
    if (statusBtn) {
      const row = statusBtn.closest(".standard-row");
      const id = row.dataset.id;
      const entry = Store.setStandardStatus(section.key, id, statusBtn.dataset.status);
      applyRowVisualState(row, entry);
      updateSectionHeaderStats(section);
      showToast(entry.status ? `Marcado como "${statusLabel(entry.status)}"` : "Estado eliminado");
      return;
    }
    const noteToggle = e.target.closest(".note-toggle");
    if (noteToggle) {
      const row = noteToggle.closest(".standard-row");
      const noteBox = row.querySelector(".standard-note");
      const isOpen = !noteBox.hidden;
      noteBox.hidden = isOpen;
      noteToggle.setAttribute("aria-expanded", String(!isOpen));
      if (!isOpen) row.querySelector("textarea").focus();
      return;
    }
    const filterChip = e.target.closest(".filter-chip");
    if (filterChip) {
      document.querySelectorAll(".filter-chip").forEach(c => c.classList.remove("active"));
      filterChip.classList.add("active");
      applyFilter(filterChip.dataset.filter, section);
      return;
    }
  });

  view.addEventListener("change", (e) => {
    if (e.target.matches(".standard-note textarea")) {
      const row = e.target.closest(".standard-row");
      const id = row.dataset.id;
      const entry = Store.setStandardNote(section.key, id, e.target.value);
      row.querySelector(".note-toggle").classList.toggle("has-note", !!e.target.value);
      row.querySelector(".note-meta").textContent = `Última edición: ${entry.updatedBy} · ${formatDate(entry.updatedAt)}`;
      showToast("Nota guardada");
    }
  });
}

function applyFilter(filter, section) {
  document.querySelectorAll(".standard-row").forEach(row => {
    const id = row.dataset.id;
    const group = row.dataset.group;
    const entry = Store.getEntry(section.key, id);
    let visible = true;
    if (filter === "__pending") visible = !entry || !entry.status;
    else if (filter !== "all") visible = group === filter;
    row.style.display = visible ? "" : "none";
  });
  document.querySelectorAll(".group-block").forEach(block => {
    const anyVisible = [...block.querySelectorAll(".standard-row")].some(r => r.style.display !== "none");
    block.style.display = anyVisible ? "" : "none";
  });
}

function updateSectionHeaderStats(section) {
  const st = Store.sectionStats(section.key, section.items);
  renderProgressRing("chart-section-ring", st.pct, LQA_DATA.target);
  document.querySelector(".section-ring-pct").textContent = st.pct + "%";
  const miniStats = document.querySelectorAll(".mini-stat");
  if (miniStats.length === 4) {
    miniStats[0].innerHTML = `<span class="mini-dot ok"></span>${st.ok} cumplidos`;
    miniStats[1].innerHTML = `<span class="mini-dot bad"></span>${st.bad} no cumplidos`;
    miniStats[2].innerHTML = `<span class="mini-dot na"></span>${st.na} no aplica`;
    miniStats[3].innerHTML = `<span class="mini-dot pending"></span>${st.pending} pendientes`;
  }
  updateTabbarPercents();
}

function statusLabel(s) {
  return s === "cumplido" ? "Cumplido" : s === "no_cumplido" ? "No cumplido" : "No aplica";
}

// ============================== VISTA: PLAN DE ACCIÓN ==============================
function renderPlanView() {
  const phaseCards = PLAN_DATA.fases.map(fase => {
    const stats = Store.planPhaseStats(fase);
    const statusLabelMap = { "not-started": "No iniciado", "in-progress": "En curso", "done": "Completado" };
    const ph = Store.getPlanPhase(fase.id);
    return `
      <div class="phase-card" data-phase="${fase.id}">
        <div class="phase-top">
          <div class="phase-heading">
            <span class="phase-number">${fase.numero}</span>
            <div>
              <div class="phase-name">${fase.nombre}</div>
              <div class="phase-period">${fase.periodo}</div>
            </div>
          </div>
          <span class="phase-status ${stats.status}">${statusLabelMap[stats.status]}</span>
        </div>
        <div class="phase-progress-track"><div class="phase-progress-fill" style="width:${stats.pct}%"></div></div>

        <div class="phase-cols">
          <div class="phase-col">
            <h4>Objetivos</h4>
            <ul>${fase.objetivos.map(o => `<li>${escapeHtml(o)}</li>`).join("")}</ul>
          </div>
          <div class="phase-col">
            <h4>Acciones clave</h4>
            <ul>${fase.acciones.map(a => `<li>${escapeHtml(a)}</li>`).join("")}</ul>
          </div>
        </div>

        <div class="deliverables">
          <h4>Entregables (${stats.done}/${stats.total})</h4>
          ${fase.entregables.map((d, i) => `
            <div class="deliverable-row ${ph.deliverables[i] ? 'checked' : ''}" data-phase="${fase.id}" data-index="${i}">
              <span class="deliverable-check">${ph.deliverables[i] ? iconSvg("check", 12) : ""}</span>
              <span class="deliverable-text">${escapeHtml(d)}</span>
            </div>
          `).join("")}
        </div>

        <div class="phase-note">
          <label class="phase-note-label">Notas del manager</label>
          <textarea rows="2" maxlength="500" data-phase-note="${fase.id}" placeholder="Observaciones sobre esta fase…">${escapeHtml(ph.notes || "")}</textarea>
        </div>
      </div>
    `;
  }).join("");

  const kpiAuditRows = PLAN_DATA.kpis.auditorias.map(k => {
    const current = overallAuditPct();
    const pct = Math.min(100, Math.round((current / k.meta) * 100));
    return `
      <div class="kpi-track-row">
        <b>${k.hito}</b>
        <div class="kpi-track"><div class="kpi-track-fill" style="width:${Math.min(100, current)}%"></div></div>
        <span>Meta ${k.meta}%</span>
      </div>`;
  }).join("");

  return `
    <div class="view-header">
      <p class="view-eyebrow">${PLAN_DATA.hotel}</p>
      <h1 class="view-title">Plan de Acción LQA</h1>
      <p class="view-subtitle">${PLAN_DATA.horizonte} · Avance global: <b style="color:var(--gold)">${overallPlanPct()}%</b> de entregables completados</p>
    </div>

    <div class="plan-objective"><b>Objetivo. </b>${PLAN_DATA.objetivo}</div>

    ${phaseCards}

    <div class="section-title-row"><h2>KPIs de seguimiento</h2></div>
    <div class="kpi-grid">
      <div class="card kpi-card">
        <h4>Formación</h4>
        <ul>${PLAN_DATA.kpis.formacion.map(f => `<li>${f}</li>`).join("")}</ul>
      </div>
      <div class="card kpi-card">
        <h4>Auditorías (score actual: ${overallAuditPct()}%)</h4>
        ${kpiAuditRows}
      </div>
      <div class="card kpi-card">
        <h4>Guest satisfaction</h4>
        <ul>${PLAN_DATA.kpis.satisfaccion.map(f => `<li>${f}</li>`).join("")}</ul>
      </div>
      <div class="card kpi-card">
        <h4>Factores críticos de éxito</h4>
        <ul>${PLAN_DATA.kpis.factoresCriticos.map(f => `<li>${f}</li>`).join("")}</ul>
      </div>
    </div>
  `;
}

function bindPlanEvents() {
  const view = document.getElementById("view");
  view.addEventListener("click", (e) => {
    const row = e.target.closest(".deliverable-row");
    if (row) {
      const { phase, index } = row.dataset;
      Store.toggleDeliverable(phase, Number(index));
      refreshPlanView();
      showToast("Entregable actualizado");
    }
  });
  view.addEventListener("change", (e) => {
    if (e.target.matches("[data-phase-note]")) {
      Store.setPlanNote(e.target.dataset.phaseNote, e.target.value);
      showToast("Nota de fase guardada");
    }
  });
}

function refreshPlanView() {
  document.getElementById("view").innerHTML = renderPlanView();
  bindPlanEvents();
  updateTabbarPercents();
}

// ============================== INSTALAR APP (PWA) ==============================
function setupInstallPrompt() {
  const btn = document.getElementById("install-btn");

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    if (!isStandalone()) btn.hidden = false;
  });

  btn.addEventListener("click", async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    btn.hidden = true;
  });

  window.addEventListener("appinstalled", () => {
    btn.hidden = true;
    showToast("App instalada correctamente");
  });

  if (isStandalone()) btn.hidden = true;
}

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  }
}

// ============================== SYNC FOOTER ==============================
function updateSyncFooter(state) {
  const el = document.getElementById("footer-sync-state");
  if (!el) return;
  const map = {
    local: "Guardado en este dispositivo",
    syncing: "Sincronizando…",
    synced: "Sincronizado con la hoja del equipo",
    pending: `Pendiente de sincronizar (${Store.pendingCount()})`,
    offline: "Sin conexión — se reintentará automáticamente",
  };
  el.textContent = map[state] || map.local;
}

// ============================== TOAST ==============================
let toastTimer = null;
function showToast(msg) {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.innerHTML = `<span class="toast-dot"></span><span id="toast-msg"></span>`;
    document.body.appendChild(toast);
  }
  document.getElementById("toast-msg").textContent = msg;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}

// ============================== UTILS ==============================
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" }) + " " +
         d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}
