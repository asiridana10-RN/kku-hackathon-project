(() => {
  "use strict";

  const places = Array.isArray(window.PLACES) ? window.PLACES : [];
  const months = Array.isArray(window.MONTHS) ? window.MONTHS : [];
  const allYearRound = window.ALL_YEAR_ROUND && typeof window.ALL_YEAR_ROUND === "object" ? window.ALL_YEAR_ROUND : null;
  const curatedItineraries = Array.isArray(window.CURATED_ITINERARIES) ? window.CURATED_ITINERARIES : [];
  const storageKey = "abha-visitor-guide-state";
  const schemaVersion = 7;
  const datasetVersion = "abha-19-curated-itineraries-v14";
  const weatherEndpoint = "https://api.open-meteo.com/v1/forecast?latitude=18.2164&longitude=42.5053&current=temperature_2m,relative_humidity_2m,weather_code&temperature_unit=celsius&timezone=auto";
  const allowedThemeKeys = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
  const allowedEffects = ["clouds", "pink-petals", "petals", "sunny", "rain"];
  const categories = ["All", "Dining", "Cafes", "Heritage & Markets", "Nature", "Activities"];
  const catalogSize = 19;
  const categoryTotals = {
    Dining: 3,
    Cafes: 3,
    "Heritage & Markets": 6,
    Nature: 2,
    Activities: 5
  };
  const expectedMonthIds = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  const defaultMonthId = expectedMonthIds[new Date().getMonth()];
  const defaultState = {
    schemaVersion,
    datasetVersion,
    category: "All",
    monthId: defaultMonthId,
    itineraryDayIndex: 0,
    itineraryVisible: false
  };

  const elements = {
    siteShell: document.querySelector(".site-shell"),
    heroKicker: document.getElementById("heroKicker"),
    heroTitle: document.getElementById("heroTitle"),
    heroSubtitle: document.getElementById("heroSubtitle"),
    heroDescription: document.getElementById("heroDescription"),
    guideToolsDescription: document.getElementById("guideToolsDescription"),
    categoryFilters: document.getElementById("categoryFilters"),
    monthNav: document.getElementById("monthNav"),
    featuredSection: document.getElementById("featuredSection"),
    featuredTitle: document.getElementById("featuredTitle"),
    featuredDescription: document.getElementById("featuredDescription"),
    featuredGrid: document.getElementById("featuredGrid"),
    allYearSection: document.getElementById("allYearSection"),
    allYearSubtitle: document.getElementById("allYearSubtitle"),
    allYearGroups: document.getElementById("allYearGroups"),
    placesGrid: document.getElementById("placesGrid"),
    resultsStatus: document.getElementById("resultsStatus"),
    planButton: document.getElementById("planButton"),
    surpriseButton: document.getElementById("surpriseButton"),
    itinerary: document.getElementById("itinerary"),
    itineraryTitle: document.getElementById("itineraryTitle"),
    itineraryList: document.getElementById("itineraryList"),
    clearItinerary: document.getElementById("clearItinerary"),
    rebuildItinerary: document.getElementById("rebuildItinerary"),
    loadExample: document.getElementById("loadExample"),
    toast: document.getElementById("toast"),
    weatherWidget: document.getElementById("weatherWidget"),
    weatherIcon: document.getElementById("weatherIcon"),
    weatherTemperature: document.getElementById("weatherTemperature"),
    weatherCondition: document.getElementById("weatherCondition"),
    weatherHumidity: document.getElementById("weatherHumidity")
  };

  let state = readState();
  let toastTimeout;

  function getMonth(monthId) {
    return months.find((month) => month.id === monthId);
  }

  function isValidGoogleMapsUrl(value) {
    if (typeof value !== "string" || !value.trim()) return false;
    try {
      const url = new URL(value);
      return url.protocol === "https:" && ["maps.app.goo.gl", "www.google.com", "google.com"].includes(url.hostname);
    } catch (error) {
      return false;
    }
  }

  function getMapUrl(place) {
    return place.mapUrl
      ? new URL(place.mapUrl).href
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.mapQuery)}`;
  }

  function isValidData() {
    const allowedCategories = categories.filter((category) => category !== "All");
    const actualCategoryTotals = Object.fromEntries(allowedCategories.map((category) => [category, 0]));
    const ids = new Set();
    const images = new Set();
    const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
    const localImagePattern = /^\.\/images\/[a-z0-9-]+\.jpg$/;

    if (places.length !== catalogSize || months.length !== expectedMonthIds.length || !allYearRound || curatedItineraries.length !== 5) return false;
    if (!months.every((month, index) => month && month.id === expectedMonthIds[index] &&
      ["label", "shortLabel", "icon", "theme", "effect", "heroTitle", "heroSubtitle", "description"].every((field) => typeof month[field] === "string" && month[field].trim()) &&
      month.shortLabel.length <= 3 && allowedThemeKeys.includes(month.theme) && allowedEffects.includes(month.effect) &&
      Array.isArray(month.featuredIds) && month.featuredIds.length === 3 && new Set(month.featuredIds).size === 3)) return false;

    for (const place of places) {
      if (!place || typeof place !== "object" || typeof place.id !== "string" || !place.id.trim() || ids.has(place.id)) return false;
      if (!allowedCategories.includes(place.category)) return false;
      if (!Array.isArray(place.availableMonths) || !place.availableMonths.length || place.availableMonths.some((monthId) => !expectedMonthIds.includes(monthId))) return false;
      if (![("name"), ("description"), ("duration"), ("mapQuery"), ("image"), ("alt")].every((field) => typeof place[field] === "string" && place[field].trim())) return false;
      if (place.mapUrl !== undefined && !isValidGoogleMapsUrl(place.mapUrl)) return false;
      if (!timePattern.test(place.planTime) || !Number.isInteger(place.priority) || place.priority < 1) return false;
      if (!localImagePattern.test(place.image) || images.has(place.image)) return false;
      ids.add(place.id);
      images.add(place.image);
      actualCategoryTotals[place.category] += 1;
    }

    if (!months.every((month) => month.featuredIds.every((id) => {
      const featuredPlace = places.find((place) => place.id === id);
      return featuredPlace && featuredPlace.availableMonths.includes(month.id);
    }))) return false;

    const validAllYearGroups = typeof allYearRound.subtitle === "string" && allYearRound.subtitle.trim() &&
      Array.isArray(allYearRound.groups) && allYearRound.groups.length === 2 &&
      allYearRound.groups.every((group) => group && typeof group.label === "string" && Array.isArray(group.items) && group.items.length && group.items.every((item) => !item.placeId || ids.has(item.placeId)));
    const itinerarySlotLabels = ["Morning", "Lunch & Coffee", "Afternoon & Evening"];
    const validCuratedItineraries = curatedItineraries.every((itinerary, index) => {
      if (!itinerary || itinerary.day !== index + 1 || typeof itinerary.title !== "string" || !itinerary.title.trim() ||
        !Array.isArray(itinerary.slots) || itinerary.slots.length !== itinerarySlotLabels.length) return false;
      if (!itinerary.slots.every((slot, slotIndex) => slot && slot.label === itinerarySlotLabels[slotIndex] &&
        Array.isArray(slot.placeIds) && slot.placeIds.length && slot.placeIds.every((id) => ids.has(id)))) return false;
      const itineraryPlaceIds = itinerary.slots.flatMap((slot) => slot.placeIds);
      return itineraryPlaceIds.length === 4 && new Set(itineraryPlaceIds).size === 4;
    });

    return validAllYearGroups && validCuratedItineraries && images.size === catalogSize &&
      allowedCategories.every((category) => actualCategoryTotals[category] === categoryTotals[category]);
  }

  function readState() {
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey));
      if (!stored || stored.schemaVersion !== schemaVersion || stored.datasetVersion !== datasetVersion) return { ...defaultState };
      return {
        ...defaultState,
        category: categories.includes(stored.category) ? stored.category : defaultState.category,
        monthId: expectedMonthIds.includes(stored.monthId) ? stored.monthId : defaultState.monthId,
        itineraryDayIndex: Number.isInteger(stored.itineraryDayIndex) && stored.itineraryDayIndex >= 0 && stored.itineraryDayIndex < curatedItineraries.length
          ? stored.itineraryDayIndex
          : defaultState.itineraryDayIndex,
        itineraryVisible: stored.itineraryVisible === true
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

  function isCategoryOverride() {
    return state.category !== "All";
  }

  function getVisiblePlaces() {
    if (isCategoryOverride()) {
      return places.filter((place) => place.category === state.category);
    }

    return places.filter((place) => place.availableMonths.includes(state.monthId));
  }

  function describeFilters(count) {
    if (isCategoryOverride()) {
      return `Showing all ${count} ${state.category} ${count === 1 ? "place" : "places"} across the year`;
    }

    const month = getMonth(state.monthId);
    return `Showing ${count} ${count === 1 ? "place" : "places"} available in ${month.label} · all categories`;
  }

  function makeFilterButton(label, group, buttonContainer) {
    const button = document.createElement("button");
    const selected = group === "category" ? state.category === label : state.monthId === label;
    button.type = "button";
    button.className = group === "month" ? `month-chip${selected ? " is-selected" : ""}` : `filter-chip${selected ? " is-selected" : ""}`;
    if (group === "month") {
      const month = getMonth(label);
      button.innerHTML = `<span class="month-icon" aria-hidden="true">${escapeHTML(month.icon)}</span><span class="month-name">${escapeHTML(month.shortLabel)}</span>`;
      button.setAttribute("aria-label", `Show ${month.label} guide`);
    } else if (label === "All") {
      button.innerHTML = `<svg aria-hidden="true"><use href="#icon-reset"></use></svg><span>All / month</span>`;
      button.setAttribute("aria-label", "Show all categories for the selected month");
    } else {
      button.textContent = label;
    }
    button.setAttribute("aria-pressed", String(selected));
    button.dataset.filterGroup = group;
    button.dataset.filterValue = label;
    button.addEventListener("click", () => {
      if (group === "category") state.category = label;
      else state.monthId = label;
      state.itineraryVisible = false;
      state.itineraryDayIndex = 0;
      saveState();
      render();
      const refreshedButton = [...buttonContainer.querySelectorAll("button")].find((entry) => (
        entry.dataset.filterGroup === group && entry.dataset.filterValue === label
      ));
      refreshedButton?.focus();
    });
    buttonContainer.append(button);
  }

  function renderFilters() {
    elements.categoryFilters.innerHTML = "";
    elements.monthNav.innerHTML = "";
    categories.forEach((category) => makeFilterButton(category, "category", elements.categoryFilters));
    expectedMonthIds.forEach((monthId) => makeFilterButton(monthId, "month", elements.monthNav));
  }

  function getBestTimeLabel(availableMonths) {
    if (availableMonths.length === expectedMonthIds.length) return "BEST: ALL YEAR";

    const available = new Set(availableMonths);
    const starts = expectedMonthIds.filter((monthId, index) => (
      available.has(monthId) && !available.has(expectedMonthIds[(index + expectedMonthIds.length - 1) % expectedMonthIds.length])
    ));
    const ranges = starts.map((startMonthId) => {
      const range = [startMonthId];
      let index = expectedMonthIds.indexOf(startMonthId);
      while (available.has(expectedMonthIds[(index + 1) % expectedMonthIds.length])) {
        index = (index + 1) % expectedMonthIds.length;
        range.push(expectedMonthIds[index]);
      }
      const first = getMonth(range[0]).shortLabel;
      const last = getMonth(range[range.length - 1]).shortLabel;
      return range.length === 1 ? first : `${first}–${last}`;
    });

    return `BEST: ${ranges.join(" · ")}`;
  }

  function createCard(place, featured = false) {
    const mapUrl = getMapUrl(place);
    const unsplashUrl = `https://unsplash.com/s/photos/${encodeURIComponent(`${place.name} Saudi Arabia`)}`;
    const article = document.createElement("article");
    article.className = `place-card${featured ? " featured-card" : ""}`;
    article.dataset.placeId = place.id;
    article.innerHTML = `
      <div class="card-media">
        <img src="${escapeHTML(place.image)}" alt="${escapeHTML(place.alt)}" loading="lazy">
      </div>
      <div class="card-body">
        <div class="card-tags">
          <span class="category-tag">${escapeHTML(place.category)}</span>
          <span class="season-tag">${escapeHTML(getBestTimeLabel(place.availableMonths))}</span>
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
        <div>
          <p>Local photo unavailable.</p>
          <a href="${unsplashUrl}" target="_blank" rel="noopener noreferrer" aria-label="View a similar image for ${escapeHTML(place.name)} on Unsplash (opens in a new tab)">View a similar image on Unsplash</a>
        </div>`;
      image.remove();
      article.querySelector(".card-media").append(fallback);
    }, { once: true });
    return article;
  }

  function renderMonthPresentation() {
    const month = getMonth(state.monthId);
    elements.siteShell.dataset.theme = month.theme;
    elements.siteShell.dataset.effect = month.effect;
    document.title = `${month.heroTitle} | Abha Visitor Guide`;
    elements.heroKicker.innerHTML = `<span></span> ${escapeHTML(month.icon)} Aseer Highlands · Saudi Arabia`;
    elements.heroTitle.textContent = month.heroTitle;
    elements.heroSubtitle.textContent = month.heroSubtitle;
    elements.heroDescription.textContent = month.description;
    elements.featuredTitle.textContent = `Featured Experiences for ${month.label}`;
    elements.featuredDescription.textContent = `Three handpicked experiences shaped by ${month.label}'s weather, colors, and Aseeri character.`;
    elements.featuredGrid.innerHTML = "";
    month.featuredIds
      .map((id) => places.find((place) => place.id === id))
      .forEach((place) => elements.featuredGrid.append(createCard(place, true)));
  }

  function renderContextualSections() {
    const isMonthlyView = !isCategoryOverride();
    elements.featuredSection.hidden = !isMonthlyView;
    elements.allYearSection.hidden = !isMonthlyView;
    elements.guideToolsDescription.textContent = isMonthlyView
      ? `Build a gentle day from places available in ${getMonth(state.monthId).label}.`
      : `Build a year-round route from every ${state.category} place in the guide.`;

    if (isMonthlyView) renderAllYearRound();
  }

  function renderAllYearRound() {
    elements.allYearSubtitle.textContent = allYearRound.subtitle;
    elements.allYearGroups.innerHTML = "";
    allYearRound.groups.forEach((group) => {
      const groupElement = document.createElement("section");
      groupElement.className = "all-year-group";
      groupElement.innerHTML = `<h3>${escapeHTML(group.label)}</h3><ul></ul>`;
      const list = groupElement.querySelector("ul");
      group.items.forEach((item) => {
        const listItem = document.createElement("li");
        if (item.placeId) {
          const place = places.find((entry) => entry.id === item.placeId);
          listItem.innerHTML = `<a href="#placesGrid" data-scroll-place="${escapeHTML(place.id)}">${escapeHTML(item.label)}</a>`;
          listItem.querySelector("a").addEventListener("click", (event) => {
            event.preventDefault();
            const card = document.querySelector(`[data-place-id="${place.id}"]`);
            if (card) {
              card.scrollIntoView({ behavior: "smooth", block: "center" });
              card.querySelector("h3").focus({ preventScroll: true });
            } else {
              announce(`${place.name} is available in the full guide, but not in the ${getMonth(state.monthId).label} results.`);
            }
          });
        } else {
          listItem.textContent = item.label;
        }
        list.append(listItem);
      });
      elements.allYearGroups.append(groupElement);
    });
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
      elements.placesGrid.querySelector("[data-clear-empty]").addEventListener("click", showSelectedMonth);
      return;
    }
    visiblePlaces.forEach((place) => elements.placesGrid.append(createCard(place)));
  }

  function renderItineraryStop(place) {
    const mapUrl = getMapUrl(place);
    const item = document.createElement("li");
    item.className = "itinerary-stop";
    item.innerHTML = `
      <img src="${escapeHTML(place.image)}" alt="${escapeHTML(place.alt)}" loading="lazy">
      <div class="itinerary-stop-copy">
        <span class="category-tag">${escapeHTML(place.category)}</span>
        <strong>${escapeHTML(place.name)}</strong>
        <p>${escapeHTML(place.description)}</p>
        <a class="map-link" href="${mapUrl}" target="_blank" rel="noopener noreferrer" aria-label="Open ${escapeHTML(place.name)} in Google Maps (opens in a new tab)">Google Maps <svg aria-hidden="true"><use href="#icon-pin"></use></svg></a>
      </div>`;
    const image = item.querySelector("img");
    image.addEventListener("error", () => image.remove(), { once: true });
    return item;
  }

  function renderItinerary() {
    const itinerary = curatedItineraries[state.itineraryDayIndex];
    const slots = itinerary ? itinerary.slots.map((slot) => ({
      ...slot,
      places: slot.placeIds.map((id) => places.find((place) => place.id === id)).filter(Boolean)
    })) : [];
    const itineraryPlaceCount = slots.reduce((count, slot) => count + slot.places.length, 0);
    elements.itinerary.hidden = !state.itineraryVisible || slots.length !== 3 || itineraryPlaceCount !== 4;
    elements.itineraryList.innerHTML = "";
    if (elements.itinerary.hidden) return;

    elements.itineraryTitle.textContent = `Day ${itinerary.day}: ${itinerary.title}`;
    slots.forEach((slot) => {
      const group = document.createElement("li");
      group.className = "itinerary-slot";
      group.setAttribute("aria-label", `${slot.label}: ${slot.places.map((place) => place.name).join(", ")}`);
      group.innerHTML = `<p class="itinerary-slot-label">${escapeHTML(slot.label)}</p><ol class="itinerary-slot-stops"></ol>`;
      const list = group.querySelector("ol");
      slot.places.forEach((place) => list.append(renderItineraryStop(place)));
      elements.itineraryList.append(group);
    });
  }

  function render() {
    renderMonthPresentation();
    renderFilters();
    renderContextualSections();
    renderPlaces();
    renderItinerary();
  }

  function showSelectedMonth() {
    state.category = "All";
    state.itineraryVisible = false;
    state.itineraryDayIndex = 0;
    saveState();
    render();
    announce(`${getMonth(state.monthId).label} is ready to explore across all categories.`);
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
    const context = isCategoryOverride()
      ? `the year-round ${state.category} guide`
      : `the ${getMonth(state.monthId).label} guide`;
    announce(`Surprise: ${choice.name}. It is now highlighted in ${context}.`);
  }

  function buildItinerary() {
    state.itineraryDayIndex = 0;
    state.itineraryVisible = true;
    saveState();
    renderItinerary();
    elements.itinerary.scrollIntoView({ behavior: "smooth", block: "nearest" });
    announce("Day 1 of 5 is ready to explore.");
  }

  function rebuildItinerary() {
    state.itineraryDayIndex = (state.itineraryDayIndex + 1) % curatedItineraries.length;
    state.itineraryVisible = true;
    saveState();
    renderItinerary();
    const itinerary = curatedItineraries[state.itineraryDayIndex];
    announce(`Day ${itinerary.day} of ${curatedItineraries.length} is ready to explore.`);
  }

  function clearItinerary() {
    state.itineraryVisible = false;
    state.itineraryDayIndex = 0;
    saveState();
    renderItinerary();
    announce("Your itinerary has been cleared.");
  }

  function loadExample() {
    state = { ...defaultState, itineraryVisible: true };
    saveState();
    render();
    announce("Day 1 of 5 and the current month guide are loaded.");
  }

  function getWeatherDetails(weatherCode) {
    if (weatherCode === 0) return { label: "Clear skies", icon: "clear" };
    if ([1, 2].includes(weatherCode)) return { label: "Partly cloudy", icon: "cloud" };
    if (weatherCode === 3) return { label: "Overcast", icon: "cloud" };
    if ([45, 48].includes(weatherCode)) return { label: "Foggy", icon: "fog" };
    if ([51, 53, 55, 56, 57].includes(weatherCode)) return { label: "Drizzle", icon: "rain" };
    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(weatherCode)) return { label: "Rain showers", icon: "rain" };
    if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) return { label: "Snow", icon: "cloud" };
    if ([95, 96, 99].includes(weatherCode)) return { label: "Thunderstorms", icon: "storm" };
    return { label: "Current conditions", icon: "cloud" };
  }

  function renderWeatherUnavailable() {
    elements.weatherWidget.dataset.state = "unavailable";
    elements.weatherIcon.setAttribute("href", "#weather-cloud");
    elements.weatherTemperature.textContent = "Unavailable";
    elements.weatherCondition.textContent = "Weather";
    elements.weatherHumidity.textContent = "Try again online";
    elements.weatherWidget.setAttribute("aria-label", "Abha weather unavailable");
  }

  function renderWeather(current) {
    const temperature = Number(current.temperature_2m);
    const humidity = Number(current.relative_humidity_2m);
    const weatherCode = Number(current.weather_code);
    if (![temperature, humidity, weatherCode].every(Number.isFinite)) {
      renderWeatherUnavailable();
      return;
    }

    const weather = getWeatherDetails(weatherCode);
    const roundedTemperature = Math.round(temperature);
    const roundedHumidity = Math.round(humidity);
    elements.weatherWidget.dataset.state = "ready";
    elements.weatherIcon.setAttribute("href", `#weather-${weather.icon}`);
    elements.weatherTemperature.textContent = `${roundedTemperature}°C`;
    elements.weatherCondition.textContent = weather.label;
    elements.weatherHumidity.textContent = `Humidity ${roundedHumidity}%`;
    elements.weatherWidget.setAttribute("aria-label", `Abha now: ${roundedTemperature} degrees Celsius, ${weather.label}, humidity ${roundedHumidity} percent`);
  }

  async function loadWeather() {
    if (!elements.weatherWidget || typeof window.fetch !== "function") return;
    const controller = typeof AbortController === "function" ? new AbortController() : null;
    const timeout = controller ? window.setTimeout(() => controller.abort(), 7000) : null;
    try {
      const response = await fetch(weatherEndpoint, controller ? { signal: controller.signal } : {});
      if (!response.ok) throw new Error("Weather request failed");
      const data = await response.json();
      renderWeather(data && data.current);
    } catch (error) {
      renderWeatherUnavailable();
    } finally {
      if (timeout !== null) window.clearTimeout(timeout);
    }
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
    elements.monthNav.innerHTML = "";
    elements.heroTitle.textContent = "Guide unavailable";
    elements.heroSubtitle.textContent = "Please reload the local guide";
    elements.heroDescription.textContent = message;
    elements.featuredSection.hidden = true;
    elements.allYearSection.hidden = true;
    elements.planButton.disabled = true;
    elements.surpriseButton.disabled = true;
  }

  elements.surpriseButton.addEventListener("click", surpriseMe);
  elements.planButton.addEventListener("click", buildItinerary);
  elements.rebuildItinerary.addEventListener("click", rebuildItinerary);
  elements.clearItinerary.addEventListener("click", clearItinerary);
  elements.loadExample.addEventListener("click", loadExample);

  if (isValidData()) render();
  else showStartupError();
  loadWeather();
})();
