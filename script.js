// Stores the raw weather data returned from the Open-Meteo API in browser memory. Having this globally available lets you re-render the screen instantly when changing units (°C to °F, km/h to mph) without needing to make another network request.
const searchInput = document.querySelector('.input-text');
const searchDropdown = document.querySelector('.search-dropdown');
const dropdownContainer = document.querySelector('.units-dropdown');
const dropdownBtn = document.querySelector('.dropdown-toggle');
const hourlyDropDownContainer = document.querySelector('.hourly-dropdown');
const hourlyDropDownBtn = document.querySelector('.hourly-dropdown-toggle');
const cityInput = document.getElementById('citySearchInput');
const searchResults = document.getElementById('searchResults');
let currentWeatherData = null;
let activeCityName = '';
let activeCountry = '';

const isEmpty = (value) => {
  if (typeof value === 'string') {
    return value.length > 0;
  }
};

searchInput.addEventListener('input', (e) => {
  const { value } = e.target;

  if (isEmpty(value)) {
    searchDropdown.classList.add('is-visible');
  } else {
    searchDropdown.classList.remove('is-visible');
  }
});

// close searchDropdown when we click anywhere on the webpage.
document.addEventListener('click', (e) => {
  if (e.target !== searchInput) {
    searchDropdown.classList.remove('is-visible');
  }
});

const setupSearchClear = () => {
  cityInput.type = 'search';

  if (cityInput.value === '') {
    if (searchDropdown) {
      searchDropdown.innerHTML = '';
      return;
    }
    return;
  }
}
setupSearchClear();


function multiDropdownPanel(btnSelector, wrapperSelector) {
  const btn = document.querySelector(btnSelector);
  const wrapper = document.querySelector(wrapperSelector);

  if (!btn || !wrapper) {
    return;
  }

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    document.querySelectorAll('.is-open').forEach((openEl) => {
      if (openEl !== wrapper) {
        openEl.classList.remove('is-open')
      }
    });
    wrapper.classList.toggle('is-open');
  });
}
multiDropdownPanel(".dropdown-toggle", ".units-dropdown");
multiDropdownPanel(".hourly-dropdown-toggle", ".hourly-dropdown");

document.addEventListener('click', () => {
  document.querySelectorAll('.is-open').forEach((openEl) => {
    openEl.classList.remove('is-open');
  })
});


async function getCoordinates(cityName) {

  // Once the user picks one (e.g., index 0), you pass its latitude (6.5244) and longitude (3.3792) directly into getWeatherData(6.5244, 3.3792).

  try {
    const encodedCity = encodeURIComponent(cityName.trim());

    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodedCity}&count=5&language=en&format=json`;

    const response = await fetch(url);
    const data = await response.json();


    if (!data.results || data.results.length == 0) {
      return [];
    }

    // Create an empty array to hold cleaned locations
    const cleanCities = [];

    // loop throught each item in data.results

    for (let i = 0; i < data.results.length; i++) {
      const city = data.results[i] // Access current item by index.

      // push a cleaned object into our new array.

      cleanCities.push({
        name: city.name,
        country: city.country || '',
        admin1: city.admin1 || '',
        latitude: city.latitude,
        longitude: city.longitude
      });
    }
    return cleanCities;


  } catch (error) {
    console.error('Geocoding failed:', error)
    return [];
  }
}


async function getWeatherData(lat, lon) {
  // This function takes the exact lat & lon of a chosen city and request the full weather dataset( current metrics, hourly forecast, and daily forecast).
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,precipitation,weather_code,relative_humidity_2m,wind_speed_10m&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;


    const response = await fetch(url);
    const data = await response.json();
    return data;

  } catch (error) {
    console.error('Weather API Error:', error)
    return null;
  }
}


// scope variable to track our debounce timer.
let debounceTimer;

// attaching an input event listener to our search bar.
searchInput.addEventListener('input', (e) => {
  const value = e.target.value.trim();

  // ALWAYS cancel any existing timer from a previous keypress
  clearTimeout(debounceTimer);


  if (!isEmpty(value)) {
    searchDropdown.classList.remove("is-visible");
    searchDropdown.innerHTML = "";
    return;
  }

  // 2. Show loading state inside the dropdown.
  searchDropdown.classList.add("is-visible");
  searchDropdown.innerHTML = `<p class="dropdown-status">Searching locations...</p>`;

  // Start the delay timer
  debounceTimer = setTimeout(async () => {

    if (!isEmpty(searchInput.value)) {
      return;
    }

    const cities = await getCoordinates(value);


    if (cities.length === 0) {
      searchDropdown.innerHTML = `<p class="dropdown-status">No Location found for '${value}'</p>`
      return;
    };




    let dropdownHTML = '';

    for (let i = 0; i < cities.length; i++) {
      const city = cities[i]

      //Initializes an empty string variable for the state/region text.
      let stateText = '';
      if (city.admin1) {
        stateText = ", " + city.admin1;
      }

      dropdownHTML += `
        <div
          class="dropdown-item"
          data-lat="${city.latitude}"
          data-lon="${city.longitude}"
          data-name="${city.name}"
          data-country="${city.country || ''}"
        >
        ${city.name}${stateText}, ${city.country}
        </div>
      `;
    }
    searchDropdown.innerHTML = dropdownHTML;

  }, 500);
});


searchDropdown.addEventListener('click', async (e) => {
  // Find the clicked item using event delegation
  const selectedItem = e.target.closest('.dropdown-item')


  if (!selectedItem) {
    return;
  }

  const lat = selectedItem.dataset.lat;
  const lon = selectedItem.dataset.lon;
  const cityName = selectedItem.dataset.name;
  const country = selectedItem.dataset.country;

  activeCityName = cityName;
  activeCountry = country || '';

  if (country) {
    searchInput.value = `${cityName}, ${country}`;
  } else {
    searchInput.value = cityName;
  }

  searchDropdown.classList.remove('is-visible');
  searchDropdown.innerHTML = '';
  currentWeatherData = await getWeatherData(lat, lon);
  renderCurrentWeather(currentWeatherData, activeCityName, activeCountry);
  renderDailyForecast(currentWeatherData);

});



function getWeatherIconPath(code) {
  if (code === 0) {
    return "/assets/images/icon-sunny.webp";
  }

  if (code >= 1 && code <= 3) {
    return "/assets/images/icon-partly-cloudy.webp";
  }

  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    return "/assets/images/icon-rain.webp";
  }
  return "/assets/images/icon-sunny.webp";
}


function renderCurrentWeather(weatherData, cityName, country) {

  if (!weatherData || !weatherData.current) {
    return;
  }
  const current = weatherData.current;

  const locationEl = document.getElementById('current_state-name');

  if (locationEl) {
    if (country) {
      locationEl.textContent = `${cityName}, ${country}`;
    } else {
      locationEl.textContent = cityName;
    }
  }



  const dateEl = document.getElementById('current_date');

  if (dateEl) {
    const today = new Date();
    const dateOptions = {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric"
    }
    dateEl.textContent = today.toLocaleDateString('en-us', dateOptions)
  }

  const iconEl = document.getElementById('current_weather-icon');

  if (iconEl) {
    iconEl.src = getWeatherIconPath(current.weather_code);
  }

  const mainTempEl = document.getElementById('current_main-temp');

  if (mainTempEl) {
    mainTempEl.textContent = formatTemp(current.temperature_2m);
  }


  const feelsLIkeEl = document.getElementById('feels_like');

  if (feelsLIkeEl) {
    let feelsValue;

    if (current.apparent_temperature !== undefined) {
      feelsValue = current.apparent_temperature;
    } else {
      feelsValue = current.temperature_2m;
    }
    feelsLIkeEl.textContent = formatTemp(feelsValue);
  }

  const humidityEl = document.getElementById('Humidity');

  if (humidityEl) {
    humidityEl.textContent = `${current.relative_humidity_2m}%`;
  }

  const windEl = document.getElementById('wind');

  if (windEl) {
    windEl.textContent = formatSpeed(current.wind_speed_10m);
  }

  const precipEl = document.getElementById('precipitation');

  if (precipEl) {
    precipEl.textContent = formatPrecip(current.precipitation);
  }

}


function renderDailyForecast(weatherData) {

  if (!weatherData || !weatherData.daily) {
    return;
  }

  const dailyContainer = document.getElementById('daily_forecast_container')

  if (!dailyContainer) {
    return;
  }
  const daily = weatherData.daily
  let cardsHTML = '';

  for (let i = 0; i < daily.time.length; i++) {
    const dayDate = new Date(`${daily.time[i]}T00:00:00`);
    const dayName = dayDate.toLocaleDateString('en-us', { weekday: 'short' });

    const iconPath = getWeatherIconPath(daily.weather_code[i]);

    const maxTemp = formatTemp(daily.temperature_2m_max[i]);
    const minTemp = formatTemp(daily.temperature_2m_min[i]);

    cardsHTML += `
      <div class="daily_forecast_flex">
        <div class="daily_forecast_inner_flex">
          <div class="daily_forecast_days">
            <h6>${dayName}</h6>
          </div>

          <div class="daily_forecast_img">
            <img src="${iconPath}" alt="rain" />
          </div>

          <div class="daily_forecast_temp">
            <p>${maxTemp}</p>
            <p>${minTemp}</p>
          </div>
        </div>
      </div>

    `;
  }
  dailyContainer.innerHTML = cardsHTML;

}

// GLOBAL UNITS STATE OBEJCT

const currentUnits = {
  temp: 'celsius',
  speed: 'kmh',
  precip: 'mm'
};


// convert celsius to Fahrenheit if unit is imperial.

const formatTemp = (celsiusTemp) => {
  if (currentUnits.temp === 'fahrenheit') {
    const fahrenheit = (celsiusTemp * 9) / 5 + 32;
    return `${Math.round(fahrenheit)}°`;
  }
  return `${Math.round(celsiusTemp)}°`;
}

const formatSpeed = (kmhSpeed) => {
  if (currentUnits.speed === 'mph') {
    const mph = kmhSpeed * 0.621371;
    return `${Math.round(mph)}mph`;
  }
  return `${Math.round(kmhSpeed)}km/h`;
}

const formatPrecip = (mmPrecip) => {
  if (currentUnits.precip === 'inch') {
    const inches = mmPrecip * 0.0393701;
    return `${inches.toFixed(2)}in`;
  }
  return `${mmPrecip.toFixed(1)}mm`;
}

// WORKING ON THE CHECKMARK.

const updateDropdownCheckmarks = () => {
  const allLabels = document.querySelectorAll(".dropdown-label");

  allLabels.forEach((label) => {
    //Calling .textContent extracts only the visible text ("Celsius (C)") while ignoring the checkmark <img> tag entirely.
    const text = label.textContent.toLowerCase();

    // Check if this label matches the active state in currentUnits
    // This acts as a truth filter that determines whether a specific dropdown option should display a checkmark
    const isCelsius = text.includes("celsius") && currentUnits.temp === "celsius";
    const isFahrenheit = text.includes("fahrenheit") && currentUnits.temp === "fahrenheit";
    const isKmh = text.includes("km/h") && currentUnits.speed === "kmh";
    const isMph = text.includes("mph") && currentUnits.speed === "mph";
    const isMm = text.includes("millimeters") && currentUnits.precip === "mm";
    const isInch = text.includes("inches") && currentUnits.precip === "inch";

    // Toggle 'active' class that acts as a checkmark switcher
    if (isCelsius || isFahrenheit || isKmh || isMph || isMm || isInch) {
      label.classList.add("active");
    } else {
      label.classList.remove("active");
    }
  });
};



// THE MASTER TOGGLE BUTTON THAT CHANGES THE LABEL TEXT AND SI UNIT STATE

const updateMasterButtonText = () => {
  const imperialBtn = document.querySelector(".imperial");
  if (!imperialBtn) {
    return;
  }

  const isAllImperial =
    currentUnits.temp === "fahrenheit" &&
    currentUnits.speed === "mph" &&
    currentUnits.precip === "inch";
  //Evaluates three conditions. All three conditions must be true for isAllImperial to store true.
  if (isAllImperial) {
    imperialBtn.textContent = "Switch to Metric";
  } else {
    //It returns false at the start, and only becomes true after the user changes all three units to Imperial!
    imperialBtn.textContent = "Switch to Imperial";
  }
};


// MAIN DROPDOWN SETUP & LISTENERS
const setupUnitsDropdown = () => {
  const imperialBtn = document.querySelector(".imperial");
  const dropdownMenu = document.querySelector(".dropdown-menu");

  if (!dropdownMenu) {
    return;
  }


  // MASTER TOGGLE BUTTON HANDLER WWHEN WE CLICK ON THE IMPERIAL BUTTON 
  if (imperialBtn) {
    imperialBtn.addEventListener("click", (e) => {
      e.stopPropagation();

      const isImperial = imperialBtn.textContent.trim() === "Switch to Imperial";

      if (isImperial) {
        currentUnits.temp = "fahrenheit";
        currentUnits.speed = "mph";
        currentUnits.precip = "inch";
        imperialBtn.textContent = "Switch to Metric";
      } else {
        currentUnits.temp = "celsius";
        currentUnits.speed = "kmh";
        currentUnits.precip = "mm";
        imperialBtn.textContent = "Switch to Imperial";
      }
      // SO THAT THE CHECKMARK TOO WOULD ACT ACCORDINGLY.
      updateDropdownCheckmarks();


      if (currentWeatherData) {
        const parts = searchInput.value.split(',');

        let cityName = '';
        if (parts[0]) {
          cityName = parts[0].trim();
        } else {
          cityName = '';
        }

        let country = '';
        if (parts[1]) {
          country = parts[1].trim();
        } else {
          country = '';
        }

        renderCurrentWeather(currentWeatherData, activeCityName, activeCountry);
        renderDailyForecast(currentWeatherData);
      }
    });
  }

  // Individual Label Click Handler
  dropdownMenu.addEventListener("click", (e) => {
    const selectedLabel = e.target.closest(".dropdown-label");
    if (!selectedLabel) {
      return;
    }

    const labelText = selectedLabel.textContent.toLowerCase();

    if (labelText.includes("celsius")) {
      currentUnits.temp = "celsius";
    } else if (labelText.includes("fahrenheit")) {
      currentUnits.temp = "fahrenheit";
    } else if (labelText.includes("km/h")) {
      currentUnits.speed = "kmh";
    } else if (labelText.includes("mph")) {
      currentUnits.speed = "mph";
    } else if (labelText.includes("millimeters")) {
      currentUnits.precip = "mm";
    } else if (labelText.includes("inches")) {
      currentUnits.precip = "inch";
    }

    updateDropdownCheckmarks();
    updateMasterButtonText();

    if (currentWeatherData) {
      const parts = searchInput.value.split(',');

      let cityName = '';
      if (parts[0]) {
        cityName = parts[0].trim();
      } else {
        cityName = '';
      }

      let country = '';
      if (parts[1]) {
        country = parts[1].trim();
      } else {
        country = '';
      }

      renderCurrentWeather(currentWeatherData, activeCityName, activeCountry);
      renderDailyForecast(currentWeatherData);
    }
  });
};


// INITIALIZATION ON DOM LOAD
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    setupUnitsDropdown();
  });
} else {
  setupUnitsDropdown();
}





