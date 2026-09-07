// ────────────────────────────────────────────────────────────────────────
// Gráficas (Chart.js) — helpers reutilizables con la paleta de marca.
// ────────────────────────────────────────────────────────────────────────
const CHART_COLORS = {
  gold: "#F8AC00",
  goldDeep: "#C98A00",
  track: "#35312B",
  ok: "#5F9270",
  bad: "#BD5240",
  na: "#8B8578",
  pending: "#4A463F",
  cream: "#F3EFE7",
  creamDim: "rgba(243,239,231,0.55)",
};

Chart.defaults.font.family = "'Work Sans', sans-serif";
Chart.defaults.color = CHART_COLORS.creamDim;

const chartRegistry = {};

function destroyChart(id) {
  if (chartRegistry[id]) { chartRegistry[id].destroy(); delete chartRegistry[id]; }
}

/** Anillo (doughnut) de progreso individual, con el % en el centro dibujado por CSS aparte. */
function renderProgressRing(canvasId, pct, target) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  chartRegistry[canvasId] = new Chart(ctx, {
    type: "doughnut",
    data: {
      datasets: [{
        data: [pct, Math.max(0, 100 - pct)],
        backgroundColor: [CHART_COLORS.gold, CHART_COLORS.track],
        borderWidth: 0,
      }],
    },
    options: {
      cutout: "78%",
      responsive: true,
      maintainAspectRatio: true,
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      animation: { duration: 700, easing: "easeOutQuart" },
    },
    plugins: target != null ? [targetTickPlugin(target)] : [],
  });
}

/** Pequeño plugin que dibuja una marca en el borde del anillo indicando el objetivo (85%). */
function targetTickPlugin(targetPct) {
  return {
    id: "targetTick_" + targetPct,
    afterDraw(chart) {
      const { ctx, chartArea } = chart;
      const meta = chart.getDatasetMeta(0);
      const arc = meta.data[0];
      if (!arc) return;
      const angle = -Math.PI / 2 + (targetPct / 100) * (Math.PI * 2);
      const cx = arc.x, cy = arc.y;
      const rOuter = arc.outerRadius + 3;
      const rInner = arc.innerRadius - 3;
      ctx.save();
      ctx.strokeStyle = CHART_COLORS.cream;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx + rInner * Math.cos(angle), cy + rInner * Math.sin(angle));
      ctx.lineTo(cx + rOuter * Math.cos(angle), cy + rOuter * Math.sin(angle));
      ctx.stroke();
      ctx.restore();
    },
  };
}

/** Barras horizontales comparando el % de cada outlet frente al objetivo. */
function renderOutletBars(canvasId, labels, values, target) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  chartRegistry[canvasId] = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "% completado",
          data: values,
          backgroundColor: values.map(v => v >= target ? CHART_COLORS.ok : CHART_COLORS.gold),
          borderRadius: 6,
          barThickness: 22,
        },
        {
          type: "line",
          label: `Objetivo (${target}%)`,
          data: labels.map(() => target),
          borderColor: CHART_COLORS.cream,
          borderDash: [5, 4],
          borderWidth: 1.5,
          pointRadius: 0,
        },
      ],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { min: 0, max: 100, grid: { color: "rgba(243,239,231,0.06)" }, ticks: { callback: v => v + "%" } },
        y: { grid: { display: false } },
      },
      plugins: {
        legend: { display: true, position: "bottom", labels: { boxWidth: 12, padding: 16, font: { size: 11.5 } } },
        tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${c.formattedValue}%` } },
      },
      animation: { duration: 700, easing: "easeOutQuart" },
    },
  });
}
