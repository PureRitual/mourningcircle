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
