(() => {
  "use strict";

  const places = Array.isArray(window.PLACES) ? window.PLACES : [];
  const storageKey = "abha-visitor-guide-state";
  const categories = ["All categories", "Nature", "Heritage", "Arts", "Views", "Markets"];
  const seasons = ["All seasons", "Spring", "Summer", "Winter"];
  const defaultState = {
    category: "All categories",
    season: "All seasons",
    itineraryIds: []
  };

  const elements = {
    categoryFilters: document.getElementById("categoryFilters"),
    seasonFilters: document.getElementById("seasonFilters"),
    placesGrid: document.getElementById("placesGrid"),
    resultsStatus: document.getElementById("resultsStatus"),
    resetFilters: document.getElementById("resetFilters"),
    planButton: document.getElementById("planButton"),
    surpriseButton: document.getElementById("surpriseButton"),
    itinerary: document.getElementById("itinerary"),
    itineraryList: document.getElementById("itineraryList"),
    clearItinerary: document.getElementById("clearItinerary"),
    rebuildItinerary: document.getElementById("rebuildItinerary"),
    loadExample: document.getElementById("loadExample"),
    toast: document.getElementById("toast")
  };

  let state = readState();
  let toastTimeout;

  function isValidData() {
    const validIds = new Set(places.map((place) => place.id));
    return places.length === 14 && validIds.size === 14 && places.every((place, index) => (
      place && place.id === index + 1 && place.image === `./images/place${index + 1}.jpg` &&
      place.name && place.category && place.season && place.mapQuery && place.description
    ));
  }

  function readState() {
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey));
      if (!stored || typeof stored !== "object") return { ...defaultState };
      return {
        category: categories.includes(stored.category) ? stored.category : defaultState.category,
        season: seasons.includes(stored.season) ? stored.season : defaultState.season,
        itineraryIds: Array.isArray(stored.itineraryIds) ? stored.itineraryIds.filter((id) => places.some((place) => place.id === id)) : []
      };
    } catch (error) {
      return { ...defaultState };
    }
  }

  function saveState() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch (error) {
      // The guide remains usable when file:// storage is unavailable.
    }
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>'"]/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;"
    }[character]));
  }

  function getVisiblePlaces() {
    return places.filter((place) => {
      const categoryMatches = state.category === "All categories" || place.category === state.category;
      const seasonMatches = state.season === "All seasons" || place.season === state.season || place.season === "All year";
      return categoryMatches && seasonMatches;
    });
  }

  function describeFilters(count) {
    const descriptions = [];
    if (state.category !== "All categories") descriptions.push(state.category.toLowerCase());
    if (state.season !== "All seasons") descriptions.push(state.season.toLowerCase());
    if (!descriptions.length) return `Showing all ${count} places`;
    return `Showing ${count} ${count === 1 ? "place" : "places"} for ${descriptions.join(" in ")}`;
  }

  function makeFilterButton(label, group, buttonContainer) {
    const button = document.createElement("button");
    const selected = group === "category" ? state.category === label : state.season === label;
    button.type = "button";
    button.className = `filter-chip${selected ? " is-selected" : ""}`;
    button.textContent = label;
    button.setAttribute("aria-pressed", String(selected));
    button.addEventListener("click", () => {
      if (group === "category") state.category = label;
      else state.season = label;
      state.itineraryIds = [];
      saveState();
      render();
    });
    buttonContainer.append(button);
  }

  function renderFilters() {
    elements.categoryFilters.innerHTML = "";
    elements.seasonFilters.innerHTML = "";
    categories.forEach((category) => makeFilterButton(category, "category", elements.categoryFilters));
    seasons.forEach((season) => makeFilterButton(season, "season", elements.seasonFilters));
  }

  function createCard(place) {
    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.mapQuery)}`;
    const unsplashUrl = `https://unsplash.com/s/photos/${encodeURIComponent(`${place.name} Saudi Arabia`)}`;
    const article = document.createElement("article");
    article.className = "place-card";
    article.dataset.placeId = String(place.id);
    article.innerHTML = `
      <div class="card-media">
        <img src="${escapeHTML(place.image)}" alt="${escapeHTML(place.alt)}" loading="lazy">
      </div>
      <div class="card-body">
        <div class="card-tags">
          <span class="category-tag">${escapeHTML(place.category)}</span>
          <span class="season-tag">Best: ${escapeHTML(place.season)}</span>
        </div>
        <h3 tabindex="-1">${escapeHTML(place.name)}</h3>
        <p class="card-description">${escapeHTML(place.description)}</p>
        <div class="card-footer">
          <span class="duration"><svg aria-hidden="true"><use href="#icon-route"></use></svg>${escapeHTML(place.duration)}</span>
          <a class="map-link" href="${mapUrl}" target="_blank" rel="noopener noreferrer" aria-label="Open ${escapeHTML(place.name)} in Google Maps (opens in a new tab)">Google Maps <svg aria-hidden="true"><use href="#icon-pin"></use></svg></a>
        </div>
      </div>`;

    const image = article.querySelector("img");
    image.addEventListener("error", () => {
      const fallback = document.createElement("div");
      fallback.className = "card-fallback";
      fallback.innerHTML = `
        <div class="fallback-mountain" aria-hidden="true"></div>
        <div>
          <p>Local photo unavailable.</p>
          <a href="${unsplashUrl}" target="_blank" rel="noopener noreferrer" aria-label="View a similar image for ${escapeHTML(place.name)} on Unsplash (opens in a new tab)">View a similar image on Unsplash</a>
        </div>`;
      image.remove();
      article.querySelector(".card-media").append(fallback);
    }, { once: true });
    return article;
  }

  function renderPlaces() {
    const visiblePlaces = getVisiblePlaces();
    elements.resultsStatus.textContent = describeFilters(visiblePlaces.length);
    elements.placesGrid.innerHTML = "";
    if (!visiblePlaces.length) {
      elements.placesGrid.innerHTML = `
        <div class="empty-state">
          <h3>No places match yet.</h3>
          <p>Try opening up one of the filters to see more of Abha and Aseer.</p>
          <button class="text-button" type="button" data-clear-empty>Clear filters</button>
        </div>`;
      elements.placesGrid.querySelector("[data-clear-empty]").addEventListener("click", resetFilters);
      return;
    }
    visiblePlaces.forEach((place) => elements.placesGrid.append(createCard(place)));
  }

  function renderItinerary() {
    const itineraryPlaces = state.itineraryIds.map((id) => places.find((place) => place.id === id)).filter(Boolean);
    elements.itinerary.hidden = itineraryPlaces.length === 0;
    elements.itineraryList.innerHTML = "";
    itineraryPlaces.forEach((place) => {
      const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.mapQuery)}`;
      const item = document.createElement("li");
      item.innerHTML = `<time>${escapeHTML(place.planTime)}</time><strong>${escapeHTML(place.name)}</strong><a href="${mapUrl}" target="_blank" rel="noopener noreferrer">Maps</a>`;
      elements.itineraryList.append(item);
    });
  }

  function render() {
    renderFilters();
    renderPlaces();
    renderItinerary();
  }

  function resetFilters() {
    state.category = defaultState.category;
    state.season = defaultState.season;
    state.itineraryIds = [];
    saveState();
    render();
    announce("All 14 places are ready to explore.");
  }

  function randomIndex(length) {
    if (window.crypto && window.crypto.getRandomValues) {
      const values = new Uint32Array(1);
      window.crypto.getRandomValues(values);
      return values[0] % length;
    }
    return Math.floor(Math.random() * length);
  }

  function surpriseMe() {
    const visiblePlaces = getVisiblePlaces();
    if (!visiblePlaces.length) {
      announce("There are no matching places to surprise you with. Clear a filter and try again.");
      return;
    }
    const choice = visiblePlaces[randomIndex(visiblePlaces.length)];
    const card = document.querySelector(`[data-place-id="${choice.id}"]`);
    if (!card) return;
    document.querySelectorAll(".place-card.is-surprise").forEach((item) => item.classList.remove("is-surprise"));
    card.classList.add("is-surprise");
    card.scrollIntoView({ behavior: "smooth", block: "center" });
    const heading = card.querySelector("h3");
    window.setTimeout(() => heading.focus({ preventScroll: true }), 280);
    window.setTimeout(() => card.classList.remove("is-surprise"), 3000);
    announce(`Surprise: ${choice.name}. It is now highlighted in the guide.`);
  }

  function buildItinerary() {
    const candidates = [...getVisiblePlaces()];
    if (!candidates.length) {
      announce("There are no matching places to add to an itinerary. Clear a filter and try again.");
      return;
    }

    const selected = [];
    const seenCategories = new Set();
    candidates.sort((a, b) => a.planTime.localeCompare(b.planTime) || a.priority - b.priority);

    for (const place of candidates) {
      if (selected.length === 4) break;
      if (!seenCategories.has(place.category)) {
        selected.push(place);
        seenCategories.add(place.category);
      }
    }
    for (const place of candidates) {
      if (selected.length === 4) break;
      if (!selected.some((item) => item.id === place.id)) selected.push(place);
    }

    state.itineraryIds = selected.sort((a, b) => a.planTime.localeCompare(b.planTime)).map((place) => place.id);
    saveState();
    renderItinerary();
    elements.itinerary.scrollIntoView({ behavior: "smooth", block: "nearest" });
    const message = state.itineraryIds.length < 4
      ? `Your ${state.itineraryIds.length}-stop route is ready from the places available in these filters.`
      : "Your four-stop day in Abha is ready.";
    announce(message);
  }

  function clearItinerary() {
    state.itineraryIds = [];
    saveState();
    renderItinerary();
    announce("Your itinerary has been cleared.");
  }

  function loadExample() {
    resetFilters();
    state.itineraryIds = [10, 5, 7, 13];
    saveState();
    renderItinerary();
    announce("The example guide and a sample day are loaded.");
  }

  function announce(message) {
    elements.toast.textContent = message;
    elements.toast.classList.add("is-visible");
    window.clearTimeout(toastTimeout);
    toastTimeout = window.setTimeout(() => elements.toast.classList.remove("is-visible"), 4200);
  }

  function showStartupError() {
    const message = "The guide data could not be loaded correctly. Please make sure sample-data/data.js is beside this page and try again.";
    elements.placesGrid.innerHTML = `<div class="empty-state"><h3>Guide unavailable</h3><p>${message}</p></div>`;
    elements.resultsStatus.textContent = "Guide data unavailable";
    elements.categoryFilters.innerHTML = "";
    elements.seasonFilters.innerHTML = "";
    elements.planButton.disabled = true;
    elements.surpriseButton.disabled = true;
  }

  elements.resetFilters.addEventListener("click", resetFilters);
  elements.surpriseButton.addEventListener("click", surpriseMe);
  elements.planButton.addEventListener("click", buildItinerary);
  elements.rebuildItinerary.addEventListener("click", buildItinerary);
  elements.clearItinerary.addEventListener("click", clearItinerary);
  elements.loadExample.addEventListener("click", loadExample);

  if (isValidData()) render();
  else showStartupError();
})();
