// ────────────────────────────────────────────────────────────────────────
// STORE — persistencia local (localStorage) + sincronización opcional
// con un backend de Google Apps Script (ver /backend/Code.gs y README.md).
//
// Esquema guardado bajo la clave LS_KEY:
// {
//   manager: "Nombre del manager actual",
//   audit: { [sectionKey]: { [itemId]: { status, notes, updatedBy, updatedAt } } },
//   plan:  { [phaseId]:   { deliverables: { [index]: bool }, notes, updatedBy, updatedAt } },
//   queue: [ { id, kind: 'audit'|'plan', payload, ts } ]   // pendientes de enviar
// }
// ────────────────────────────────────────────────────────────────────────

const LS_KEY = "lqa_fb_tracker_v1";

const Store = (() => {
  let state = load();
  let syncTimer = null;
  let onSyncStateChange = () => {};

  function load() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore corrupt state */ }
    return { manager: "", audit: {}, plan: {}, queue: [] };
  }

  function persist() {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  }

  function getManager() {
    return state.manager || "";
  }

  function setManager(name) {
    state.manager = name.trim();
    persist();
  }

  function getEntry(sectionKey, itemId) {
    return (state.audit[sectionKey] && state.audit[sectionKey][itemId]) || null;
  }

  function setStandardStatus(sectionKey, itemId, status) {
    if (!state.audit[sectionKey]) state.audit[sectionKey] = {};
    const prev = state.audit[sectionKey][itemId] || {};
    const next = {
      status: prev.status === status ? null : status, // click again to unset
      notes: prev.notes || "",
      updatedBy: getManager(),
      updatedAt: new Date().toISOString(),
    };
    state.audit[sectionKey][itemId] = next;
    persist();
    enqueue("audit", { sectionKey, itemId, ...next });
    return next;
  }

  function setStandardNote(sectionKey, itemId, notes) {
    if (!state.audit[sectionKey]) state.audit[sectionKey] = {};
    const prev = state.audit[sectionKey][itemId] || { status: null };
    const next = {
      status: prev.status || null,
      notes: notes,
      updatedBy: getManager(),
      updatedAt: new Date().toISOString(),
    };
    state.audit[sectionKey][itemId] = next;
    persist();
    enqueue("audit", { sectionKey, itemId, ...next });
    return next;
  }

  function getPlanPhase(phaseId) {
    return state.plan[phaseId] || { deliverables: {}, notes: "" };
  }

  function toggleDeliverable(phaseId, index) {
    if (!state.plan[phaseId]) state.plan[phaseId] = { deliverables: {}, notes: "" };
    const ph = state.plan[phaseId];
    ph.deliverables[index] = !ph.deliverables[index];
    ph.updatedBy = getManager();
    ph.updatedAt = new Date().toISOString();
    persist();
    enqueue("plan", { phaseId, deliverables: ph.deliverables, notes: ph.notes, updatedBy: ph.updatedBy, updatedAt: ph.updatedAt });
    return ph;
  }

  function setPlanNote(phaseId, notes) {
    if (!state.plan[phaseId]) state.plan[phaseId] = { deliverables: {}, notes: "" };
    const ph = state.plan[phaseId];
    ph.notes = notes;
    ph.updatedBy = getManager();
    ph.updatedAt = new Date().toISOString();
    persist();
    enqueue("plan", { phaseId, deliverables: ph.deliverables, notes: ph.notes, updatedBy: ph.updatedBy, updatedAt: ph.updatedAt });
    return ph;
  }

  // ---- Cálculo de progreso ----
  function sectionStats(sectionKey, items) {
    let ok = 0, bad = 0, na = 0, pending = 0;
    const map = state.audit[sectionKey] || {};
    items.forEach(it => {
      const s = map[it.id] && map[it.id].status;
      if (s === "cumplido") ok++;
      else if (s === "no_cumplido") bad++;
      else if (s === "no_aplica") na++;
      else pending++;
    });
    const evaluable = ok + bad; // igual que la fórmula del Excel: cumplido / (total - no_aplica)
    const pct = (ok + bad + na) === items.length && evaluable + na > 0
      ? (evaluable > 0 ? Math.round((ok / evaluable) * 100) : 0)
      : (evaluable > 0 ? Math.round((ok / evaluable) * 100) : 0);
    return { ok, bad, na, pending, total: items.length, pct: isFinite(pct) ? pct : 0 };
  }

  function planPhaseStats(phase) {
    const ph = getPlanPhase(phase.id);
    const total = phase.entregables.length;
    const done = phase.entregables.reduce((acc, _, i) => acc + (ph.deliverables[i] ? 1 : 0), 0);
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    let status = "not-started";
    if (pct === 100 && total > 0) status = "done";
    else if (pct > 0) status = "in-progress";
    return { done, total, pct, status, notes: ph.notes || "" };
  }

  // ---- Cola de sincronización con Apps Script ----
  function enqueue(kind, payload) {
    state.queue.push({ id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, kind, payload, ts: new Date().toISOString() });
    persist();
    scheduleSync(true);
  }

  function scheduleSync(immediate) {
    if (!APP_CONFIG.API_URL) { onSyncStateChange("local"); return; }
    if (immediate) flushQueue();
    if (syncTimer) return;
    syncTimer = setInterval(flushQueue, APP_CONFIG.SYNC_RETRY_MS);
  }

  async function flushQueue() {
    if (!APP_CONFIG.API_URL || state.queue.length === 0) return;
    onSyncStateChange("syncing");
    const pending = [...state.queue];
    try {
      // text/plain evita el preflight CORS que Apps Script no siempre resuelve bien.
      const res = await fetch(APP_CONFIG.API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ token: APP_CONFIG.API_TOKEN, events: pending }),
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      state.queue = state.queue.filter(ev => !pending.find(p => p.id === ev.id));
      persist();
      onSyncStateChange(state.queue.length ? "pending" : "synced");
    } catch (err) {
      onSyncStateChange("offline");
    }
  }

  async function pullRemoteState() {
    if (!APP_CONFIG.API_URL) return null;
    try {
      const res = await fetch(`${APP_CONFIG.API_URL}?token=${encodeURIComponent(APP_CONFIG.API_TOKEN || "")}`);
      if (!res.ok) throw new Error("HTTP " + res.status);
      return await res.json();
    } catch (err) {
      return null;
    }
  }

  function setSyncListener(fn) { onSyncStateChange = fn; }

  function pendingCount() { return state.queue.length; }

  function resetAll() {
    state = { manager: "", audit: {}, plan: {}, queue: [] };
    persist();
  }

  return {
    getManager, setManager,
    getEntry, setStandardStatus, setStandardNote,
    getPlanPhase, toggleDeliverable, setPlanNote,
    sectionStats, planPhaseStats,
    scheduleSync, pullRemoteState, setSyncListener, pendingCount,
    resetAll,
  };
})();
