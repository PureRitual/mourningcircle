// dummy event data
const events = [
  { title: "Obelisk – LA", city: "LA", genre: "Goth" },
  { title: "Bar Sinister – LA", city: "LA", genre: "Industrial" },
  { title: "Club Metro – Phoenix", city: "Phoenix", genre: "Darkwave" },
  { title: "Area 51 – Vegas", city: "Vegas", genre: "Goth" },
];

const calendar = document.getElementById("calendar");
const cityFilter = document.getElementById("filter-city");
const genreFilter = document.getElementById("filter-genre");

// flyer globals
const flyerEl = document.getElementById("flyer-card");
let flyerEvents = [];

function render() {
  const city = cityFilter.value;
  const genre = genreFilter.value;
  const filtered = events.filter(
    e =>
      (city === "All" || e.city === city) &&
      (genre === "All" || e.genre === genre)
  );

  calendar.innerHTML = `<h2 class="section-title">Calendar (filterable)</h2>` +
    filtered.map(e => `<p>🩸 ${e.title} — <small>${e.genre}</small></p>`).join("");
  // also refresh flyer when filters change
  updateFlyer();
}

cityFilter.addEventListener("change", render);
genreFilter.addEventListener("change", render);

// first render
render();

// --- Coven Map (static JSON -> collapsible tree) ---
async function loadCoven() {
  try {
    const res = await fetch('coven.json', { cache: 'no-store' });
    const members = await res.json();

    // index + children
    const byId = new Map(members.map(m => [m.id, { ...m, children: [] }]));
    let roots = [];
    for (const m of byId.values()) {
      if (m.siredBy && byId.has(m.siredBy)) byId.get(m.siredBy).children.push(m);
      else roots.push(m);
    }

    // node -> <details> (if children) or <li> (leaf)
    const buildNode = (n) => {
      if (n.children.length) {
        const det = document.createElement('details');
        det.open = true; // expanded by default; change to false if you want them collapsed initially
        const sum = document.createElement('summary');
        sum.innerHTML =
          `<span class="caret" aria-hidden="true"></span>` +
          `<a href="${n.url}" target="_blank" rel="noopener">${n.name}</a> ` +
          (n.siredBy ? `<small>(sired by ${byId.get(n.siredBy)?.name || 'Unknown'})</small>` : `<small>(root)</small>`);
        det.appendChild(sum);

        const list = document.createElement('ul');
        for (const c of n.children) {
          const li = document.createElement('li');
          li.appendChild(buildNode(c));
          list.appendChild(li);
        }
        det.appendChild(list);
        return det;
      } else {
        const span = document.createElement('span');
        span.innerHTML =
          `<a href="${n.url}" target="_blank" rel="noopener">${n.name}</a> ` +
          (n.siredBy ? `<small>(sired by ${byId.get(n.siredBy)?.name || 'Unknown'})</small>` : `<small>(root)</small>`);
        return span;
      }
    };

    // mount
    const mount = document.getElementById('coven-tree');
    mount.textContent = '';
    const rootList = document.createElement('ul');
    for (const r of roots) {
      const li = document.createElement('li');
      li.appendChild(buildNode(r));
      rootList.appendChild(li);
    }
    mount.appendChild(rootList);
  } catch (e) {
    document.getElementById('coven-tree').textContent = 'Could not load coven data.';
    console.error(e);
  }
}
loadCoven();

// --- Flyer panel: load events and pick next upcoming, respecting filters ---
async function loadFlyers() {
  if (!flyerEl) return;

  try {
    const res = await fetch("flyers.json", { cache: "no-store" });
    flyerEvents = await res.json();
    updateFlyer();
  } catch (err) {
    console.error(err);
    flyerEl.textContent = "Could not load flyer data.";
  }
}

function updateFlyer() {
  if (!flyerEl || !flyerEvents || !flyerEvents.length) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const city = cityFilter?.value || "All";
  const genre = genreFilter?.value || "All";

  let best = null;
  let bestDiff = Infinity;

  for (const ev of flyerEvents) {
    // respect filters
    if (city !== "All" && ev.city !== city) continue;
    if (genre !== "All" && ev.genre !== genre) continue;

    const d = new Date(ev.date + "T00:00:00");
    const diffDays = (d - today) / 86400000;
    if (diffDays >= 0 && diffDays < bestDiff) {
      bestDiff = diffDays;
      best = { ...ev, diffDays };
    }
  }

  if (!best) {
    flyerEl.textContent = "No upcoming events matching these filters.";
    return;
  }

  let whenLabel = "";
  if (best.diffDays === 0) whenLabel = "Tonight";
  else if (best.diffDays === 1) whenLabel = "Tomorrow";
  else if (best.diffDays <= 7) whenLabel = "This week";
  else {
    const d = new Date(best.date + "T00:00:00");
    whenLabel = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  flyerEl.innerHTML = `
    <div class="flyer-main">
      <div class="flyer-tag">${whenLabel}</div>
      <h3>${best.title}</h3>
      <p class="flyer-meta">
        <button class="chip" data-city="${best.city}"><span>${best.city}</span></button>
        <span>•</span>
        <button class="chip" data-genre="${best.genre}"><span>${best.genre}</span></button>
        <span>• ${best.venue}</span>
      </p>
      <p class="flyer-note">${best.note}</p>
      <a class="flyer-link" href="${best.url}">Details</a>
    </div>
  `;
}

// load flyers once on page load
loadFlyers();

// --- Play button mock behavior ---
const playBtn = document.querySelector('.stream button');
if (playBtn) {
  playBtn.addEventListener('click', () => {
    const isPlaying = playBtn.textContent === 'Pause';
    playBtn.textContent = isPlaying ? 'Play' : 'Pause';
    playBtn.setAttribute('aria-pressed', !isPlaying);
  });
}

// --- highlight active coven member ---
document.addEventListener('click', (e) => {
  if (e.target.matches('#coven-tree a')) {
    e.preventDefault();
    document
      .querySelectorAll('#coven-tree a.active')
      .forEach(a => a.classList.remove('active'));
    e.target.classList.add('active');
  }
});

// --- flyer chips -> control calendar filters ---
document.addEventListener('click', (e) => {
  const target = e.target.closest('.chip');
  if (!target) return;

  const city = target.getAttribute('data-city');
  const genre = target.getAttribute('data-genre');

  if (city) {
    cityFilter.value = city;
  }
  if (genre) {
    genreFilter.value = genre;
  }
  render(); // re-render calendar with new filters
});

// --- Live moon phase + next milestone (no API) ---
(function () {
  const phases = ["🌑","🌒","🌓","🌔","🌕","🌖","🌗","🌘"]; // 0..7
  const phaseNames = [
    "New Moon","Waxing Crescent","First Quarter","Waxing Gibbous",
    "Full Moon","Waning Gibbous","Last Quarter","Waning Crescent"
  ];

  const synodic = 29.530588853; // days
  const ref = new Date(Date.UTC(2000,0,6,18,14,0)); // known new moon
  function moonAge(date = new Date()){
    const days = (date - ref) / 86400000;
    return ((days % synodic) + synodic) % synodic; // 0..29.53
  }
  function phaseIndexFromAge(age){
    return Math.floor((age / synodic) * 8) % 8; // 0..7
  }
  function illumPercent(age){
    // simple model: 0% at new, 100% at full
    const twoPi = Math.PI * 2;
    return Math.round(50 * (1 - Math.cos(twoPi * (age / synodic))) );
  }
  function nextMilestone(date, age){
    // milestones near 0, 7.38, 14.77, 22.15, 29.53
    const marks = [
      {name:"New Moon", a:0},
      {name:"First Quarter", a:synodic/4},
      {name:"Full Moon", a:synodic/2},
      {name:"Last Quarter", a:3*synodic/4},
      {name:"New Moon", a:synodic}
    ];
    for (const m of marks){
      if (age < m.a) {
        const days = m.a - age;
        const when = new Date(date.getTime() + days*86400000);
        return { label: m.name, date: when };
      }
    }
    // fallback
    const when = new Date(date.getTime() + (synodic - age)*86400000);
    return { label: "New Moon", date: when };
  }

  const now = new Date();
  const age = moonAge(now);
  const ix = phaseIndexFromAge(age);
  const live = document.getElementById('moon-live');
  const info = document.getElementById('moon-info');
  if (live) {
    live.textContent = phases[ix];
    live.title = `${phaseNames[ix]} • ~${illumPercent(age)}% illuminated`;
    live.setAttribute('aria-label', live.title);
  }
  if (info) {
    const n = nextMilestone(now, age);
    const opts = { month: 'short', day: 'numeric' };
    info.textContent = `${phaseNames[ix]} • ~${illumPercent(age)}% • next: ${n.label} ${n.date.toLocaleDateString(undefined, opts)}`;
  }
})();
