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


// --- Play button mock behavior ---
const playBtn = document.querySelector('.stream button');
if (playBtn) {
  playBtn.addEventListener('click', () => {
    const isPlaying = playBtn.textContent === 'Pause';
    playBtn.textContent = isPlaying ? 'Play' : 'Pause';
    playBtn.setAttribute('aria-pressed', !isPlaying);
  });
}

