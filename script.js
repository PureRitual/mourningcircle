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
}

cityFilter.addEventListener("change", render);
genreFilter.addEventListener("change", render);

// first render
render();

// --- Coven Map (static JSON -> nested list) ---
async function loadCoven() {
  try {
    const res = await fetch('coven.json', { cache: 'no-store' });
    const members = await res.json();

    // index by id and build children lists
    const byId = new Map(members.map(m => [m.id, { ...m, children: [] }]));
    let roots = [];
    for (const m of byId.values()) {
      if (m.siredBy && byId.has(m.siredBy)) byId.get(m.siredBy).children.push(m);
      else roots.push(m);
    }

    // recursive DOM builder
    const ul = (nodes) => {
      const u = document.createElement('ul');
      for (const n of nodes) {
        const li = document.createElement('li');
        li.innerHTML = `<a href="${n.url}" target="_blank" rel="noopener">${n.name}</a> ` +
                       (n.siredBy ? `<small>(sired by ${byId.get(n.siredBy)?.name || 'Unknown'})</small>` : `<small>(root)</small>`);
        if (n.children.length) li.appendChild(ul(n.children));
        u.appendChild(li);
      }
      return u;
    };

    const mount = document.getElementById('coven-tree');
    mount.textContent = '';                 // clear "Loading…"
    mount.appendChild(ul(roots));
  } catch (e) {
    document.getElementById('coven-tree').textContent = 'Could not load coven data.';
    console.error(e);
  }
}
loadCoven();

// --- Play button mock behavior ---
const playBtn = document.querySelector('.stream button');
if (playBtn) {
  playBtn.addEventListener('click', () => {
    const isPlaying = playBtn.textContent === 'Pause';
    playBtn.textContent = isPlaying ? 'Play' : 'Pause';
    playBtn.setAttribute('aria-pressed', !isPlaying);
  });
}

