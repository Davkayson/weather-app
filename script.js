let currentWeatherData = null;
const searchInput = document.querySelector('.input-text');
const searchDropdown = document.querySelector('.search-dropdown');
const dropdownContainer = document.querySelector('.units-dropdown');
const dropdownBtn = document.querySelector('.dropdown-toggle');
const hourlyDropDownContainer = document.querySelector('.hourly-dropdown');
const hourlyDropDownBtn = document.querySelector('.hourly-dropdown-toggle');
const cityInput = document.getElementById('citySearchInput');
const searchResults = document.getElementById('searchResults');

const isEmpty = (value) => {
  if (typeof value === 'string') {
    return value.length > 0;
  }
};

searchDropdown.addEventListener('input', (e) => {
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
  // getCoordinates("Lagos") returns an array of matching locations.
  //   [
  //   { "name": "Lagos", "country": "Nigeria", "admin1": "Lagos", "latitude": 6.5244, "longitude": 3.3792 },
  //   { "name": "Lagos", "country": "Portugal", "admin1": "Faro", "latitude": 37.1028, "longitude": -8.6730 }
  // ]


  // Once the user picks one (e.g., index 0), you pass its latitude (6.5244) and longitude (3.3792) directly into getWeatherData(6.5244, 3.3792).

  try {
    const encodedCity = encodeURIComponent(cityName.trim());

    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodedCity}&count=5&language=en&format=json`;

    const response = await fetch(url);
    const data = await response.json();


    if (!data.results || data.results.length == 0) {
      return [];
    }



    // return data.results.map((city) => ({
    //   name: city.name,
    //   country: city.country || '',
    //   admin1: city.admin1 || '',
    //   longitude: city.logitude,
    //   latitude: city.latitude
    // }));



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

// We are wiring the search input to show city options.

// scope variable to track our debounce timer.
let debounceTimer;

// attaching an input event listener to our search bar.
searchInput.addEventListener('input', (e) => {
  const value = e.target.value.trim();

  // ALWAYS cancel any existing timer from a previous keypress
  clearTimeout(debounceTimer);

  // Guard clause: If input is cleared or empty, hide dropdown.

  if (!isEmpty(value)) {
    searchDropdown.classList.remove("is-visible");
    searchDropdown.innerHTML = "";
    return;
    // the return here give it an early exit that prevents it form reaching the show loading state... if the return isn't there it would move to the show loading state.... We can add an else block in place of the "return".
  }

  // 2. Show loading state inside the dropdown.
  searchDropdown.classList.add("is-visible");
  searchDropdown.innerHTML = `<p class="dropdown-status">Searching locations...</p>`;

  // Start the delay timer
  debounceTimer = setTimeout(async () => {

    // saftey check: verify input wasn't erased during the 500ms wait.
    // Safety check: Did the user clear the input while waiting 500ms?

    // Safety Net: Re-check if search box was erased during the 500ms delay
    if (!isEmpty(searchInput.value)) {
      //In JavaScript, writing return; inside a function tells the computer: Stop immediately and exit this function right now. Do NOT execute any lines of code below this
      return;
    }

    const cities = await getCoordinates(value);


    if (cities.length === 0) {
      searchDropdown.innerHTML = `<p class="dropdown-status">No Location found for '${value}'</p>`
      return;
    };


    // Declares a variable whose value can change over time.

    // The variable name. It acts as an empty container (a string) where we will accumulate each <li> HTML element as the loop runs.

    // An empty string. Initializing it with an empty string ensures that when we append text to it later, JavaScript treats it as text rather than trying to add strings to undefined.


    let dropdownHTML = '';

    for (let i = 0; i < cities.length; i++) {
      const city = cities[i]

      //Initializes an empty string variable for the state/region text.
      let stateText = '';
      if (city.admin1) {
        stateText = ", " + city.admin1;
      }

      // ", " + "California"   becomes ", California").

      // Backticks (`): Denotes a Template Literal, allowing multi-line strings and inline variable evaluation.

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

// When a user clicks a city suggestion:
// Extract data-lat and data-lon using .closest(".dropdown-item").
// Hide the dropdown.
// Pass lat and lon straight into getWeatherData(lat, lon).

searchDropdown.addEventListener('click', async (e) => {
  // Find the clicked item using event delegation
  const selectedItem = e.target.closest('.dropdown-item')

  // e (Event Object): The browser automatically creates this object when an action happens (like a click event). It carries all the technical details about that specific click.

  // e.target: Refers to the exact HTML element clicked by the user

  // .closest(".dropdown-item"): A DOM method that searches upward through the HTML tree (starting from e.target) until it finds the nearest parent element with the class .dropdown-item.

  // climbs up to find the main container item.

  // const selectedItem: A variable storing a direct reference to that parent .dropdown-item element so you can extract its data or manipulate it.

  //Safety Check: If the user clicks outside or on an area without .dropdown-item, selectedItem evaluates to null.

  // If clicked outside a city option, ignore


  // Why This Code Is Necessary : If a user clicks near the dropdown menu (for example, on a blank border or spacing between items), e.target.closest(".dropdown-item") will not find a match and will return null.

  if (!selectedItem) {
    return;
  }

  // Extracting HTML data-* Attributes

  const lat = selectedItem.dataset.lat;
  const lon = selectedItem.dataset.lon;
  const cityName = selectedItem.dataset.name;
  const country = selectedItem.dataset.country;


  // We only checked for country because cityName is guaranteed to exist for every valid city returned by the Open-Meteo Geocoding API, whereas country is optional and can sometimes be an empty string or missing (for example, for micro-regions, island territories, or disputed areas).

  if (country) {
    searchInput.value = `${cityName}, ${country}`;
  } else {
    searchInput.value = cityName;
  }

  searchDropdown.classList.remove('is-visible');
  searchDropdown.innerHTML = '';

  currentWeatherData = await getWeatherData(lat, lon);
  renderCurrentWeather(currentWeatherData, cityName, country);
  renderDailyForecast(currentWeatherData);

  // setupHourlyDropdownMenu(currentWeatherData);
  // renderHourlyForecast(currentWeatherData, 0);
  // setupHourlyDropdown();
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
    //A built-in JavaScript constructor that creates a new Date object containing the current date and exact time from the computer or device running the code.

    //Why it was used: JavaScript needs a starting point to know what today is. Writing new Date() grabs the current live timestamp so you can work with it in your code.
    const today = new Date();
    //A plain JavaScript configuration object containing key-value pairs that tell JavaScript how to format the raw date.
    const dateOptions = {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric"
    }
    dateEl.textContent = today.toLocaleDateString('en-us', dateOptions)
  }
  // 
  // Updating the Weather Icon

  const iconEl = document.getElementById('current_weather-icon');

  if (iconEl) {
    iconEl.src = getWeatherIconPath(current.weather_code);
  }

  const mainTempEl = document.getElementById('current_main-temp');

  if (mainTempEl) {
    mainTempEl.innerHTML = `${Math.round(current.temperature_2m)}&deg`;
  }


  const feelsLIkeEl = document.getElementById('feels_like');

  if (feelsLIkeEl) {
    let feelsValue;

    if (current.apparent_temperature !== undefined) {
      feelsValue = current.apparent_temperature;
    } else {
      feelsValue = current.temperature_2m;
    }
    feelsLIkeEl.innerHTML = `${Math.round(feelsValue)}&deg;`
  }

  const humidityEl = document.getElementById('Humidity');

  if (humidityEl) {
    humidityEl.textContent = `${current.relative_humidity_2m}%`;
  }

  const windEl = document.getElementById('wind');

  if (windEl) {
    const windMph = Math.round(current.wind_speed_10m * 0.621371);
    windEl.textContent = `${windMph}mph`;
  }

  const precipEl = document.getElementById('precipitation');

  if (precipEl) {
    const precipiInches = (current.precipitation * 0.0393701).toFixed(2);
    precipEl.textContent = `${precipiInches}in`;
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

    const maxTemp = Math.round(daily.temperature_2m_max[i]);
    const minTemp = Math.round(daily.temperature_2m_min[i]);

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
            <p>${maxTemp}&deg;</p>
            <p>${minTemp}&deg;</p>
          </div>
        </div>
      </div>

    `;
  }
  dailyContainer.innerHTML = cardsHTML;

}


const currentUnits = {
  temp: 'celsius',
  speed: 'kmh',
  precip: 'mm'
};


// convert celsius to Fahrenheit if unit is imperial.

const formatTemp = (celsiusTemp) => {
  if (currentUnits.temp === 'fahrenheit') {
    const fahrenheit = (celsiusTemp * 9) / 5 + 32;
    return `${Math.random(fahrenheit)}°F`;
  }
  return `${Math.round(celsiusTemp)}°C`;
}

const formatSpeed = (kmhSpeed) => {
  if (currentUnits.speed === 'mph') {
    const mph = `kmhSpeed * 0.621371`;
    return `${Math.round(mph)}mph`;
  }
  return `${Math.round(kmhSpeed)}km/h`;
}

const formatPrecipitation = (mmPrecip) => {
  if (currentUnits.precip === 'inch') {
    const inches = mmPrecip * 0.0393701;
    return `${inches.toFixed(2)}in`;
  }
  return `${mmPrecip.toFixed}(1)mm`;
}



const updateDropdownCheckmarks = () => {
  const allLabels = document.querySelectorAll(".dropdown-label");

  allLabels.forEach((label) => {
    //Calling .textContent extracts only the visible text ("Celsius (C)") while ignoring the checkmark <img> tag entirely.
    const text = label.textContent.toLowerCase();

    // Check if this label matches the active state in currentUnits
    const isCelsius = text.includes("celsius") && currentUnits.temp === "celsius";
    const isFahrenheit = text.includes("fahrenheit") && currentUnits.temp === "fahrenheit";
    const isKmh = text.includes("km/h") && currentUnits.speed === "kmh";
    const isMph = text.includes("mph") && currentUnits.speed === "mph";
    const isMm = text.includes("millimeters") && currentUnits.precip === "mm";
    const isInch = text.includes("inches") && currentUnits.precip === "inch";

    // Toggle 'active' class
    if (isCelsius || isFahrenheit || isKmh || isMph || isMm || isInch) {
      label.classList.add("active");
    } else {
      label.classList.remove("active");
    }
  });
};



// SYNC MASTER BUTTON LABEL TEXT

const updateMasterButtonText = () => {
  const imperialBtn = document.querySelector(".imperial");
  if (!imperialBtn) return;

  const isAllImperial =
    currentUnits.temp === "fahrenheit" &&
    currentUnits.speed === "mph" &&
    currentUnits.precip === "inch";
  //Evaluates three conditions. All three conditions must be true for isAllImperial to store true.
  if (isAllImperial) {
    imperialBtn.textContent = "Switch to Metric";
  } else {
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

  // --- A. Master Toggle Button Handler ---
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

      updateDropdownCheckmarks();
    });
  }

  // --- B. Individual Label Click Handler ---
  dropdownMenu.addEventListener("click", (e) => {
    const selectedLabel = e.target.closest(".dropdown-label");
    if (!selectedLabel) return;

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


