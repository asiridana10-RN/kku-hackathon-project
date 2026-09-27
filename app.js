(() => {
  "use strict";

  const places = Array.isArray(window.PLACES) ? window.PLACES : [];
  const storageKey = "abha-visitor-guide-state";
  const schemaVersion = 2;
  const datasetVersion = "abha-18-places-v1";
  const categories = ["All", "Dining", "Cafes", "Heritage & Markets", "Activities & Nature"];
  const seasons = ["All Year", "Winter & Spring", "Summer & Rainy Season", "Jacaranda & Spring"];
  const defaultState = {
    schemaVersion,
    datasetVersion,
    category: "All",
    season: "All Year",
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
    const allowedCategories = categories.filter((category) => category !== "All");
    const categoryTotals = Object.fromEntries(allowedCategories.map((category) => [category, 0]));
    const ids = new Set();
    const images = new Set();
    const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

    if (places.length !== 18) return false;

    for (const place of places) {
      if (!place || typeof place !== "object" || typeof place.id !== "string" || !place.id.trim() || ids.has(place.id)) return false;
      if (!allowedCategories.includes(place.category)) return false;
      if (!Array.isArray(place.seasons) || !place.seasons.length || place.seasons.some((season) => !seasons.includes(season))) return false;
      if (!["name", "description", "duration", "mapQuery", "image", "alt"].every((field) => typeof place[field] === "string" && place[field].trim())) return false;
      if (!timePattern.test(place.planTime) || !Number.isInteger(place.priority) || place.priority < 1) return false;
      if (!/^\.\/images\/place(?:[1-9]|1[0-8])\.jpg$/.test(place.image) || images.has(place.image)) return false;
      ids.add(place.id);
      images.add(place.image);
      categoryTotals[place.category] += 1;
    }

    const expectedImages = Array.from({ length: 18 }, (_, index) => `./images/place${index + 1}.jpg`);
    return expectedImages.every((image) => images.has(image)) &&
      categoryTotals.Dining === 3 &&
      categoryTotals.Cafes === 4 &&
      categoryTotals["Heritage & Markets"] === 4 &&
      categoryTotals["Activities & Nature"] === 7;
  }

  function readState() {
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey));
      if (!stored || stored.schemaVersion !== schemaVersion || stored.datasetVersion !== datasetVersion) return { ...defaultState };
      const validIds = new Set(places.map((place) => place.id));
      const itineraryIds = Array.isArray(stored.itineraryIds)
        ? [...new Set(stored.itineraryIds.filter((id) => validIds.has(id)))].slice(0, 4)
        : [];
      return {
        ...defaultState,
        category: categories.includes(stored.category) ? stored.category : defaultState.category,
        season: seasons.includes(stored.season) ? stored.season : defaultState.season,
        itineraryIds
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
      const categoryMatches = state.category === "All" || place.category === state.category;
      const seasonMatches = state.season === "All Year" || place.seasons.includes("All Year") || place.seasons.includes(state.season);
      return categoryMatches && seasonMatches;
    });
  }

  function describeFilters(count) {
    if (state.category === "All" && state.season === "All Year") return `Showing all ${count} places`;
    const descriptions = [];
    if (state.category !== "All") descriptions.push(state.category);
    if (state.season !== "All Year") descriptions.push(state.season);
    return `Showing ${count} ${count === 1 ? "place" : "places"} for ${descriptions.join(" · ")}`;
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
    article.dataset.placeId = place.id;
    article.innerHTML = `
      <div class="card-media">
        <img src="${escapeHTML(place.image)}" alt="${escapeHTML(place.alt)}" loading="lazy">
      </div>
      <div class="card-body">
        <div class="card-tags">
          <span class="category-tag">${escapeHTML(place.category)}</span>
          <span class="season-tag">Best: ${escapeHTML(place.seasons.join(" · "))}</span>
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
    state = { ...defaultState };
    saveState();
    render();
    announce(`All ${places.length} places are ready to explore.`);
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

  function selectItinerary(candidates) {
    const orderedCandidates = [...candidates].sort((a, b) => (
      a.planTime.localeCompare(b.planTime) || a.priority - b.priority || a.name.localeCompare(b.name)
    ));
    const selected = [];
    const seenCategories = new Set();

    for (const place of orderedCandidates) {
      if (selected.length === 4) break;
      if (!seenCategories.has(place.category)) {
        selected.push(place);
        seenCategories.add(place.category);
      }
    }
    for (const place of orderedCandidates) {
      if (selected.length === 4) break;
      if (!selected.some((item) => item.id === place.id)) selected.push(place);
    }
    return selected.sort((a, b) => a.planTime.localeCompare(b.planTime) || a.priority - b.priority);
  }

  function buildItinerary() {
    const selected = selectItinerary(getVisiblePlaces());
    if (!selected.length) {
      announce("There are no matching places to add to an itinerary. Clear a filter and try again.");
      return;
    }
    state.itineraryIds = selected.map((place) => place.id);
    saveState();
    renderItinerary();
    elements.itinerary.scrollIntoView({ behavior: "smooth", block: "nearest" });
    const message = selected.length < 4
      ? `Your ${selected.length}-stop route is ready from the places available in these filters.`
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
    state = { ...defaultState, itineraryIds: selectItinerary(places).map((place) => place.id) };
    saveState();
    render();
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
