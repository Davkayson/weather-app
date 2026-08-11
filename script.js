const searchInput = document.querySelector('.input-text');
const searchDropdown = document.querySelector('.search-dropdown');
const dropdownContainer = document.querySelector('.units-dropdown');
const dropdownBtn = document.querySelector('.dropdown-toggle');
const hourlyDropDownContainer = document.querySelector('.hourly-dropdown');
const hourlyDropDownBtn = document.querySelector('.hourly-dropdown-toggle');
const cityInput = document.getElementById('citySearchInput');
const searchResults = document.getElementById('searchDropdown');

searchInput.addEventListener('focus', () => {
  searchDropdown.classList.add('is-visible');
})

document.addEventListener('click', (event) => {
  if (event.target !== searchInput) {
    searchDropdown.classList.remove('is-visible');
  }
});

function setupDropdown(btnSelector, wrapperSelector) {
  const btn = document.querySelector(btnSelector);
  const wrapper = document.querySelector(wrapperSelector);

  if (!btn || !wrapper) return;

  btn.addEventListener('click', (e) => {
    e.stopPropagation();

    document.querySelectorAll('.is-open').forEach((openEl) => {
      if (openEl !== wrapper) openEl.classList.remove('is-open');
    });

    wrapper.classList.toggle('is-open');
  });
}
setupDropdown('.dropdown-toggle', '.units-dropdown');
setupDropdown('.hourly-dropdown-toggle', '.hourly-dropdown');

document.addEventListener('click', () => {
  document.querySelectorAll('.is-open').forEach((openEl) => {
    openEl.classList.remove('is-open');
  });
});

const apiUrl = 'https://api.open-meteo.com/v1/forecast?latitude=6.4541&longitude=3.3947&daily=weather_code,temperature_2m_max,temperature_2m_min&hourly=temperature_2m,weather_code&current=temperature_2m,precipitation,weather_code,relative_humidity_2m,wind_speed_10m&timezone=auto';

async function getWeatherResult() {
  try {
    const response = await fetch(apiUrl)
    const data = await response.json()
    console.log('API Response Data:', data);
    console.log('Current Temps:', data.current.temperature_2m);
    console.log('Hourly Temps:', data.hourly.temperature_2m);
    console.log('Daily Max Temps:', data.daily.temperature_2m_max);
  } catch (error) {
    console.error('Error Fetching Data:', error);
  }
}
getWeatherResult();

function buildWeatherUrl(lat, lon, tempUnit = 'celsius', windUnit = 'kmh', precipUnit = 'mm') {
  return `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation,weather_code&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&temperature_unit=${tempUnit}&wind_speed_unit=${windUnit}&precipitation_unit=${precipUnit}&timezone=auto`;
}

function debounce(func, delay = 350) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

async function searchCities(query) {
  if (!query.trim()) {
    searchResults.innerHTML = '';
    searchResults.classList.add('hidden');
    return;
  }

  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`;
    const response = await fetch(url)
    const data = await response.json()

    if (!data.results || data.results.length === 0) {
      searchResults.innerHTML = '<div class="no-results">No Location Found</div>'
      searchResults.classList.remove('hidden');
      return;
    }
    renderSearchResults(data.results);
  } catch (error) {
    console.error('Error Searching Location', error);
  }
}

function renderSearchResults(cities) {
  searchResults.innerHTML = '';

  cities.forEach(city => {
    const option = document.createElement('button')
    option.type = 'button';
    option.className = 'search-cityname';
    const locationParts = [city.name, city.admin1, city.country].filter(Boolean);
    option.textContent = locationParts.join(', ');
    option.dataset.lat = city.latitude;
    option.dataset.lon = city.longitude;
    option.dataset.name = city.name;

    searchResults.appendChild(option)
  });
  searchResults.classList.remove('hidden');
}

cityInput.addEventListener('input', debounce((e) => {
  searchCities(e.target.value);
}, 350));

searchResults.addEventListener('click', (e) => {
  const selectedBtn = e.target.closest('search-cityname');
  if (!selectedBtn) {
    return;
  }
  const lat = selectedBtn.dataset.lat;
  const lon = selectedBtn.dataset.lon;
  const cityName = selectedBtn.dataset.name;
  cityInput.value = selectedBtn.textContent;
  searchResults.classList.add('hidden')

  onCitySelected(lat, lon, cityName);
});

document.addEventListener('click', (e) => {
  if (!e.target.closest('.search-container')) {
    searchResults.classList.add('hidden');
  }
});

async function onCitySelected(lat, lon, cityName) {
  // 1. Update your global/active application state
  appState.lat = lat;
  appState.lon = lon;
  appState.locationName = cityName;

  // 2. Update the main city title element in your HTML
  const locationHeader = document.querySelector('.current-location-name');
  if (locationHeader) {
    locationHeader.textContent = cityName;
  }

  // 3. Fetch and render the new weather data for these coordinates
  await fetchAndRenderWeather();
}


