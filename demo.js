// KORDEX — Live Telemetry Demo
// Interactive logic: heatmap, patterns, clusters, ticker, keyboard shortcuts.

(() => {
  // ---- deterministic pseudo-random (so the demo looks the same every load) ----
  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ---- clock ----
  const clockEl = document.getElementById('clock');
  function pad(n) { return String(n).padStart(2, '0'); }
  function tickClock() {
    const d = new Date();
    clockEl.textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} CET`;
  }
  tickClock();
  setInterval(tickClock, 1000);

  // ---- KPI count-up ----
  const kpis = document.querySelectorAll('.num');
  kpis.forEach((el) => {
    const target = parseFloat(el.dataset.target);
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const duration = 1400;
    const start = performance.now() + 400;
    function frame(now) {
      const t = Math.min(1, Math.max(0, (now - start) / duration));
      const eased = 1 - Math.pow(1 - t, 3);
      const val = target * eased;
      el.textContent = decimals > 0 ? val.toFixed(decimals) : Math.round(val).toLocaleString();
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  });

  // ---- HEATMAP ----
  const heatmap = document.getElementById('heatmap');
  const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  const FACTORS = [
    'Manual lifting > 18 kg',
    'Machine proximity during changeover',
    'Shift handover gap',
    'Wet floor (cleaning window)',
    'Fatigue (>10h shift)',
    'New operator (<90 days)',
    'Tool misuse',
    'PPE compliance lapse',
    'Forklift routing overlap',
    'Temperature > 34°C',
  ];
  const CELL_CLASS = ['cell-0', 'cell-1', 'cell-2', 'cell-3', 'cell-4', 'cell-5'];

  function heatValue(day, hour, rng) {
    // Morning start, afternoon, night — humans cluster around shift changes
    const shiftBoost =
      Math.exp(-Math.pow((hour - 7) / 1.8, 2)) * 0.9 +   // morning start
      Math.exp(-Math.pow((hour - 14) / 2.2, 2)) * 0.7 +  // after lunch dip → pickup
      Math.exp(-Math.pow((hour - 22) / 2.0, 2)) * 0.5;   // night shift start
    const weekend = (day >= 5) ? 0.35 : 1;
    const noise = rng() * 0.25;
    return Math.min(1, (shiftBoost * weekend) + noise);
  }

  const rng = mulberry32(42);
  // build rows
  for (let d = 0; d < DAYS.length; d++) {
    const labelEl = document.createElement('div');
    labelEl.className = 'heatmap-row-label';
    labelEl.textContent = DAYS[d];
    heatmap.appendChild(labelEl);

    const rowEl = document.createElement('div');
    rowEl.className = 'heatmap-row';
    rowEl.setAttribute('role', 'row');
    for (let h = 0; h < 24; h++) {
      const cell = document.createElement('button');
      cell.className = 'heatmap-cell';
      cell.setAttribute('role', 'gridcell');
      const v = heatValue(d, h, rng);
      const bucket = Math.min(5, Math.floor(v * 5.5));
      cell.style.background = `var(--cell-${bucket})`;
      cell.dataset.day = DAYS[d];
      cell.dataset.hour = h;
      cell.dataset.value = v.toFixed(2);
      cell.dataset.bucket = bucket;
      cell.setAttribute('aria-label', `${DAYS[d]} ${pad(h)}:00 — intensity ${(v*100).toFixed(0)}%`);
      rowEl.appendChild(cell);
    }
    heatmap.appendChild(rowEl);
  }

  // ---- inspector ----
  const inspector = document.getElementById('inspector');
  const inspTitle = document.getElementById('insp-title');
  const inspCount = document.getElementById('insp-count');
  const inspFactor = document.getElementById('insp-factor');
  const inspCost = document.getElementById('insp-cost');
  const inspFactors = document.getElementById('insp-factors');
  const inspClose = document.getElementById('inspClose');

  function pickFactors(seed, count) {
    const r = mulberry32(seed);
    const pool = [...FACTORS];
    const chosen = [];
    while (chosen.length < count && pool.length) {
      const idx = Math.floor(r() * pool.length);
      chosen.push({ label: pool[idx], weight: 0.4 + r() * 0.55 });
      pool.splice(idx, 1);
    }
    chosen.sort((a, b) => b.weight - a.weight);
    const total = chosen.reduce((s, f) => s + f.weight, 0);
    return chosen.map((f) => ({ label: f.label, pct: (f.weight / total) * 100 }));
  }

  function openInspector(cell) {
    document.querySelectorAll('.heatmap-cell.selected').forEach((c) => c.classList.remove('selected'));
    cell.classList.add('selected');

    const day = cell.dataset.day;
    const hour = pad(cell.dataset.hour);
    const value = parseFloat(cell.dataset.value);
    const bucket = parseInt(cell.dataset.bucket, 10);
    const count = Math.max(1, Math.round(value * 12));
    const cost = Math.round(value * 48000);
    const factors = pickFactors(parseInt(cell.dataset.day.charCodeAt(0)) + parseInt(cell.dataset.hour) * 7, 4);

    inspTitle.textContent = `${day} · ${hour}:00 — ${hour}:59`;
    inspCount.textContent = count.toString().padStart(2, '0');
    inspFactor.textContent = factors[0].label;
    inspCost.textContent = `€${cost.toLocaleString()}`;

    inspFactors.innerHTML = factors.map((f) => `
      <div class="factor">
        <span class="factor-label">${f.label}</span>
        <span class="factor-pct">${f.pct.toFixed(0)}%</span>
        <div class="factor-bar"><span style="--w:${f.pct.toFixed(0)}%"></span></div>
      </div>
    `).join('');

    inspector.hidden = false;
    inspector.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function closeInspector() {
    inspector.hidden = true;
    document.querySelectorAll('.heatmap-cell.selected').forEach((c) => c.classList.remove('selected'));
  }

  heatmap.addEventListener('click', (e) => {
    const cell = e.target.closest('.heatmap-cell');
    if (cell) openInspector(cell);
  });
  inspClose.addEventListener('click', closeInspector);

  // ---- PATTERNS ----
  const PATTERNS = [
    {
      title: 'Shift-change lifting incidents (06:00 – 08:00)',
      confidence: 0.94,
      severity: 'critical',
      events: 38,
      cost: '€612K',
      note: 'Clusters at morning handover. 71% involve crates > 18 kg moved without mechanical aid. Pattern holds across 4 of 6 cells in Zone B.',
    },
    {
      title: 'Night-shift operator fatigue (hour 9+)',
      confidence: 0.88,
      severity: 'critical',
      events: 29,
      cost: '€438K',
      note: 'Incident rate rises 2.4× after 9th hour on night rotation. Micro-errors precede near-misses by median 42 minutes.',
    },
    {
      title: 'New operator · tool misuse (first 90 days)',
      confidence: 0.82,
      severity: 'critical',
      events: 19,
      cost: '€211K',
      note: 'Operators in their first 90 days account for 36% of tool-related incidents despite 18% of workforce hours.',
    },
    {
      title: 'Changeover proximity breaches',
      confidence: 0.74,
      severity: 'watch',
      events: 24,
      cost: '€165K',
      note: 'Safety perimeter crossed during machine reset. Recurs on Press Line 2, typically Tue/Thu.',
    },
    {
      title: 'Cleaning-window slip hazard',
      confidence: 0.71,
      severity: 'watch',
      events: 16,
      cost: '€92K',
      note: 'Wet-floor incidents in the 15-minute cleaning window between shifts. Signage present but not rotated.',
    },
    {
      title: 'PPE compliance dip · Friday PM',
      confidence: 0.69,
      severity: 'watch',
      events: 13,
      cost: '€58K',
      note: 'Compliance drops 22% after 15:00 on Fridays. Correlation with voluntary overtime schedule.',
    },
  ];

  const patternsList = document.getElementById('patterns');
  patternsList.innerHTML = PATTERNS.map((p, i) => `
    <li class="pattern" data-idx="${i}">
      <div class="pattern-row">
        <span class="pattern-idx">P·${String(i + 1).padStart(2, '0')}</span>
        <span>
          <span class="pattern-title">${p.title}</span>
          <div class="pattern-meta">
            <span>${p.events} events</span>
            <span>·</span>
            <span>${p.cost} projected</span>
            <span>·</span>
            <span style="color:${p.severity === 'critical' ? 'var(--amber)' : 'var(--paper-dim)'}">${p.severity}</span>
          </div>
        </span>
        <span class="pattern-conf">${Math.round(p.confidence * 100)}%</span>
      </div>
      <div class="pattern-bar"><span style="--fill:${p.confidence}"></span></div>
      <div class="pattern-detail">
        ${p.note}
        <div class="pattern-detail-meta">
          <span>confidence <b>${(p.confidence * 100).toFixed(0)}%</b></span>
          <span>events <b>${p.events}</b></span>
          <span>projected 12-mo cost <b>${p.cost}</b></span>
        </div>
      </div>
    </li>
  `).join('');

  // Reveal pattern bars on view
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.3 });
  document.querySelectorAll('.pattern').forEach((el) => io.observe(el));

  patternsList.addEventListener('click', (e) => {
    const item = e.target.closest('.pattern');
    if (!item) return;
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.pattern.open').forEach((n) => n.classList.remove('open'));
    if (!isOpen) item.classList.add('open');
  });

  // ---- CLUSTER MAP ----
  const CLUSTERS = [
    { x: 140, y: 160, r: 58, label: 'Shift-change',    count: 38, sev: 'critical', detail: 'Lifting cluster · Zone B' },
    { x: 300, y: 110, r: 44, label: 'Night fatigue',   count: 29, sev: 'critical', detail: '22:00–06:00 rotation'     },
    { x: 460, y: 190, r: 36, label: 'New operator',    count: 19, sev: 'critical', detail: 'Tenure < 90 days'         },
    { x: 600, y: 130, r: 28, label: 'Changeover',      count: 24, sev: 'watch',    detail: 'Press Line 2, Tue/Thu'    },
    { x: 240, y: 260, r: 26, label: 'Cleaning slip',   count: 16, sev: 'watch',    detail: 'Inter-shift window'       },
    { x: 500, y: 280, r: 22, label: 'Friday PPE',      count: 13, sev: 'watch',    detail: 'After 15:00'              },
    { x: 680, y: 250, r: 18, label: 'Forklift route',  count:  9, sev: 'watch',    detail: 'Dock-4 overlap'           },
    { x: 720, y: 80,  r: 14, label: 'Heat exposure',   count:  6, sev: 'resolved', detail: 'Mitigated 2026-03'        },
    { x: 90,  y: 290, r: 14, label: 'Tool misuse',     count:  7, sev: 'resolved', detail: 'Training updated'         },
  ];

  const svg = document.getElementById('clusterSvg');
  const tip = document.getElementById('clusterTip');
  const wrap = document.querySelector('.cluster-wrap');

  function sevColor(sev) {
    if (sev === 'critical') return 'var(--amber)';
    if (sev === 'resolved') return 'var(--acid)';
    return 'var(--paper-muted)';
  }

  // draw connecting lines (thin) between criticals
  const svgNS = 'http://www.w3.org/2000/svg';
  const crits = CLUSTERS.filter((c) => c.sev === 'critical');
  for (let i = 0; i < crits.length; i++) {
    for (let j = i + 1; j < crits.length; j++) {
      const l = document.createElementNS(svgNS, 'line');
      l.setAttribute('x1', crits[i].x);
      l.setAttribute('y1', crits[i].y);
      l.setAttribute('x2', crits[j].x);
      l.setAttribute('y2', crits[j].y);
      l.setAttribute('stroke', 'var(--amber)');
      l.setAttribute('stroke-width', '0.5');
      l.setAttribute('stroke-dasharray', '2 4');
      l.setAttribute('opacity', '0.35');
      svg.appendChild(l);
    }
  }

  CLUSTERS.forEach((c, i) => {
    const g = document.createElementNS(svgNS, 'g');
    g.setAttribute('class', 'cluster-circle');
    g.style.animationDelay = `${(i * 0.4) % 4}s`;

    const circle = document.createElementNS(svgNS, 'circle');
    circle.setAttribute('cx', c.x);
    circle.setAttribute('cy', c.y);
    circle.setAttribute('r', c.r);
    circle.setAttribute('fill', sevColor(c.sev));
    circle.setAttribute('fill-opacity', c.sev === 'resolved' ? '0.85' : '0.88');
    circle.setAttribute('stroke', c.sev === 'watch' ? 'var(--paper-muted)' : sevColor(c.sev));
    circle.setAttribute('stroke-width', '1');
    g.appendChild(circle);

    const num = document.createElementNS(svgNS, 'text');
    num.setAttribute('class', 'cluster-count');
    num.setAttribute('x', c.x);
    num.setAttribute('y', c.y);
    num.textContent = c.count;
    num.setAttribute('fill', c.sev === 'watch' ? 'var(--paper)' : 'var(--ink)');
    g.appendChild(num);

    const lbl = document.createElementNS(svgNS, 'text');
    lbl.setAttribute('class', 'cluster-label');
    lbl.setAttribute('x', c.x);
    lbl.setAttribute('y', c.y + c.r + 16);
    lbl.setAttribute('text-anchor', 'middle');
    lbl.textContent = c.label;
    g.appendChild(lbl);

    g.addEventListener('mousemove', (e) => {
      const rect = wrap.getBoundingClientRect();
      tip.style.left = `${e.clientX - rect.left}px`;
      tip.style.top  = `${e.clientY - rect.top}px`;
      tip.innerHTML = `<small>${c.sev}</small><b>${c.label}</b>${c.detail}<br><span style="font-family:var(--f-mono);font-size:10px;color:#666;letter-spacing:.1em">${c.count} events · cluster ${String(i + 1).padStart(2, '0')}</span>`;
      tip.hidden = false;
    });
    g.addEventListener('mouseleave', () => { tip.hidden = true; });
    g.addEventListener('click', () => {
      // surface matching pattern (if any) on click
      const match = PATTERNS.findIndex((p) => p.title.toLowerCase().includes(c.label.toLowerCase().split(' ')[0]));
      if (match >= 0) {
        const node = patternsList.children[match];
        document.querySelectorAll('.pattern.open').forEach((n) => n.classList.remove('open'));
        node.classList.add('open');
        node.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });

    svg.appendChild(g);
  });

  // ---- TICKER ----
  const TICKS = [
    { t: '—2d 14:23', name: 'Zone-B Press',      msg: 'Near-miss · operator stepped inside safety perimeter during reset',      sev: 'crit' },
    { t: '—2d 09:07', name: 'Line 2',            msg: 'Crate weight sample logged: 21.4 kg (manual lift)',                      sev: 'crit' },
    { t: '—3d 22:41', name: 'Night Shift A',     msg: 'Fatigue index rose above threshold at hour 9',                           sev: 'crit' },
    { t: '—3d 06:12', name: 'Handover Bay',      msg: 'Overlap between outgoing/incoming crews exceeded 14 min',                sev: '' },
    { t: '—4d 15:48', name: 'Dock-4',            msg: 'Forklift route crossed pedestrian zone during changeover',               sev: '' },
    { t: '—5d 11:05', name: 'Inter-shift clean', msg: 'Wet-floor signage deployed — 8 min before area reopened',                sev: 'safe' },
    { t: '—5d 03:19', name: 'Press Line 2',      msg: 'New operator supervised changeover · +1 observation logged',             sev: '' },
    { t: '—6d 17:52', name: 'Friday late shift', msg: 'PPE compliance audit · 78% (target 95%)',                                sev: 'crit' },
    { t: '—6d 08:00', name: 'Morning handover',  msg: 'Lifting aid deployed — successful · pattern mitigation test run',        sev: 'safe' },
    { t: '—7d 13:30', name: 'Zone B',            msg: 'Temperature logger hit 34°C — cooldown protocol triggered',              sev: '' },
  ];
  const ticker = document.getElementById('ticker');
  const doubled = [...TICKS, ...TICKS];
  ticker.innerHTML = doubled.map((t) => `
    <span class="tick ${t.sev}">
      <span class="dot"></span>
      <span class="ts">${t.t}</span>
      <span class="name">${t.name}</span>
      <span>${t.msg}</span>
    </span>
  `).join('');

  // ---- RANGE TOGGLE ----
  const rangeBtns = document.querySelectorAll('.range-btn');
  const metaWindow = document.getElementById('meta-window');
  const metaEvents = document.getElementById('meta-events');
  const WINDOW_MAP = {
    '24H': { window: '24 hours', events: 2047 },
    '7D':  { window: '7 days · 168h', events: 14209 },
    '30D': { window: '30 days · 720h', events: 61288 },
  };
  rangeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      rangeBtns.forEach((b) => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      const r = btn.dataset.range;
      metaWindow.textContent = WINDOW_MAP[r].window;
      metaEvents.textContent = WINDOW_MAP[r].events.toLocaleString();
    });
  });

  // ---- KEYBOARD ----
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !inspector.hidden) closeInspector();
    if (e.key === '1') document.querySelector('[data-range="24H"]')?.click();
    if (e.key === '2') document.querySelector('[data-range="7D"]')?.click();
    if (e.key === '3') document.querySelector('[data-range="30D"]')?.click();
  });
})();
