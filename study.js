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
    return value.length > 0
  } else {
    return false;
  }
};



searchInput.addEventListener('input', (e) => {
  const { value } = e.target;
  if (isEmpty(value)) {
    searchDropdown.classList.add('is-visible');
  } else {
    searchDropdown.classList.remove('is-visible');
  }
})

//CLICKING OUTSIDE THE SEARCH INPUT TO CLOSE THE DROPDOWN.

document.addEventListener('click', (e) => {
  if (e.target !== searchInput) {
    searchDropdown.classList.remove('is-visible');
  }
})

function setupDropdown(btnSelector, wrapperSelector) {
  const btn = document.querySelector(btnSelector);
  const wrapper = document.querySelector(wrapperSelector);



  if (btn) {
    if (wrapper) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.is-open').forEach((openEl) => {
          if (openEl !== wrapper) {
            openEl.classList.remove('is-open')
          } else {
            console.log('This is the current wrapper, so leave it open')
          }
        })
        wrapper.classList.toggle('is-open');
      })
    } else {
      //btn found , but wrapper is mising
      console.log("couln not setup dropdown: wrapper element is missing")
      return;
    }
  } else {
    //btn is missing
    console.log('could not setup dropdown: button element is missing');
    return;
  }




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
  })
}
setupDropdown(".dropdown-toggle", ".units-dropdown");
setupDropdown(".hourly-dropdown-toggle", ".hourly-dropdown");

//CLICKING OUTSIDE, BOTH THE UNITS AND HOURLY DROPDOWN CLOSES THE DROPDWONS

document.addEventListener('click', () => {
  document.querySelectorAll('.is-open').forEach((openEl) => {
    openEl.classList.remove('is-open');
  });
})

async function getCoordinates(cityName) {
  try {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=10&language=en&format=json`;

    const response = await fetch(geoUrl);
    const data = await response.json();

    // checking the data return by the server 
    // If no result exist, return null.

    if (!data.results || data.results.length === 0) {
      return null;
    }

    // can we also so say if data doesn't exist we should do 
    // searchResult.innerHTML = `<div class="no-result">No Location Found</div>`
    // searchResult.classList.remove('hidden);
    //return;

    // Extract the coordinates & name from the first result (index 0)
    // i.e  if a match exist, grab its latitude, longitude, etc....
    const { latitude, longitude, name, country } = data.results[0];
    // return a clean object with just what we need.
    // We give this 4 clean item object to whoever called the function. 
    return { latitude, longitude, name, country };


  } catch (error) {
    console.error('Geocoding failed:', error);
    return null;
  }
}

async function getWeatherData(lat, lon) {
  try {
    //plugging the coordinates into my forcast url to request current, hourly & daily weather forecast.
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,weather_code,relative_humidity_2m,wind_speed_10m&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;

    // sending Request to the sever to fetch the data 
    const response = await fetch(url);
    // converting the data response from the sever to readable javascript object containing our current, hourly and daily weather properties.
    const data = await response.json();
    // returning the parsed data; i.e returns the complete weather data object back to whoever called the function.
    return data;

  } catch (error) {
    console.error('Weather API Error:', error);
    return null;
  }
}

// if (isEmpty(value)) {
//   searchDropdown.classList.add('is-visible');
//   searchDropdown.innerHTML = `<p>Searching Weather...</p>`;

//   setTimeout(() => {

//   }, 500)
// } else {
//   searchDropdown.classList.remove('is-visible');
// }


let debounceTimer;

searchInput.addEventListener('input', (e) => {
  // Read and clean the typed input text.
  const value = e.target.value.trim();
  // Clear previous pending timer, every time a key was pressed
  clearTimeout(debounceTimer);
  // Check if the input has text
  // Why do we need to check if the input has text.

  if (isEmpty(value)) {
    searchDropdown.classList.add('is-visible');
    searchDropdown.innerHTML = `<p>Searching Weather...</p>`;

    // Set a 500ms pause timer (Debounce)
    debounceTimer = setTimeout(async () => {
      if (!isEmpty(searchInput.value)) {
        return;
      }
      // convert typed city name into coordinates
      const location = await getCoordinates(value);

      // stop if no city was found

      if (!location) {
        searchDropdown.innerHTML = `<p>No results found for '${value}'</p>`;
        //  The no result found for '${value}, why is it there ?.
        // what's is suppose to be at the else block.
        return
      }

      // Pass coordinates into the  weather-fetcher tool
      const weatherData = await getWeatherData(location.latitude, location.longitude)

      // We're checking if weather data exist and display it.
      // Why are we checking for it, and what's weatherData.current
      // we're checking for it so that our app won't crash if the API response is incomplete.
      if (weatherData && weatherData.current) {
        // weatherData: verifies that the API returned a valid object and not null or undefined. 

        const temp = Math.round(weatherData.current.temperature_2m);
        // Extracting current temperature and rounding it

        const humidity = weatherData.current.relative_humidity_2m;
        const wind = weatherData.current.wind_speed_10m;

        //Render into searchDropdown UI
        /* what does these means */
        searchDropdown.innerHTML =
          `
          <div class="weather-result">
            <h3> ${location.name}, ${location.country || ''} </h3>
            <p class="temp">${temp} °C</p>
            <p>Humidity: ${humidity}% | wind: ${wind} km/h</p>
          </div>
        
        `;

      } else {
        searchDropdown.innerHTML = `<p>Unable to retrieve weather data.</p>`;
      }

    }, 500);

  } else {
    //Hide search dropdown when input is completely cleared
    searchDropdown.classList.remove('is-visible');
  }


});






let message = 'Temperature: 25';

message += '°C';

console.log(message);



const dropdown = document.querySelector("search-results");

const newItem = document.createElement('li');
newItem.textContent = 'London, UK';
dropdown.append(newItem);

const setupUnitsDropdown = () => {
  const imperialBtn = document.querySelector('.imperial');
  const dropdownMenu = document.querySelector('.dropdown-menu');

  if (!dropdownMenu) {
    return;
  }

  if (imperialBtn) {
    imperialBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isImperial = imperialBtn.textContent.trim() === 'Switch to Imperial';
    })
  }

}





































































































//&count=1	Limits the search results to just the top 1 matching location.


// utility function
// helper function 








