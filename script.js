const searchInput = document.querySelector('.input-text');
const searchDropdown = document.querySelector('.search-dropdown');
const dropdownContainer = document.querySelector('.units-dropdown');
const dropdownBtn = document.querySelector('.dropdown-toggle');
const hourlyDropDownContainer = document.querySelector('.hourly-dropdown');
const hourlyDropDownBtn = document.querySelector('.hourly-dropdown-toggle');
const cityInput = document.getElementById('citySearchInput');
const searchResults = document.getElementById('searchResults');

// searchInput.addEventListener('focus', (e) => {
//   if (searchInput.length > 0) {
//     console.log(e.target);
//     searchDropdown.classList.add('is-visible');
//   }
// })

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
  const trimmed = (query || '').toString().trim();
  if (!trimmed) {
    searchResults.innerHTML = '';
    searchResults.classList.add('hidden');
    return;
  }

  renderSearchLoading();
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(trimmed)}&count=5&language=en&format=json`;

  try {
    const response = await fetch(url)
    const data = await response.json()

    if (!data.results || data.results.length === 0) {
      searchResults.innerHTML = '<div class="no-results">No Location Found</div>'
      searchResults.classList.remove('hidden');
      return;
    }
    renderSearchResults(data.results);
  } catch (error) {
    console.error('Error Searching Location:', error);
    searchResults.innerHTML = '<div class="search-item-empty search-error">Unable to fetch locations</div>';
  }
}

function renderSearchLoading() {
  searchResults.innerHTML = `<div class="search-item-loading">
    <span class="spinner"></span>
    <span>Searching locations...</span>
  </div>`
    ;
  searchResults.classList.remove('hidden');
}



function renderSearchResults(cities) {
  searchResults.innerHTML = '';

  cities.forEach(city => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'search-item';
    const locationParts = [city.name, city.admin1, city.country].filter(Boolean);
    btn.textContent = locationParts.join(', ');
    btn.dataset.lat = city.latitude;
    btn.dataset.lon = city.longitude;
    btn.dataset.name = city.name;

    searchResults.appendChild(btn);
  });
  searchResults.classList.remove('hidden');
}

cityInput.addEventListener('input', debounce((e) => {
  searchCities(e.target.value);
}, 350));

searchResults.addEventListener('click', (e) => {
  const selectedBtn = e.target.closest('.search-item');
  if (!selectedBtn) return;
  const lat = selectedBtn.dataset.lat;
  const lon = selectedBtn.dataset.lon;
  const cityName = selectedBtn.dataset.name;
  cityInput.value = selectedBtn.textContent;
  searchResults.classList.add('hidden');

  onCitySelected(lat, lon, cityName);
});

document.addEventListener('click', (e) => {
  if (!e.target.closest('.search-container')) {
    searchResults.classList.add('hidden');
  }
});

async function onCitySelected(lat, lon, cityName) {
  appState.lat = lat;
  appState.lon = lon;
  appState.locationName = cityName;
  await fetchAndRenderWeather();
}


