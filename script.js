const searchInput = document.querySelector('.input-text');
const searchDropdown = document.querySelector('.search-dropdown');
//units dropdown 
const dropdownContainer = document.querySelector('.units-dropdown');
const dropdownBtn = document.querySelector('.dropdown-toggle');

//Hourly dropdown code
const hourlyDropDownContainer = document.querySelector('.hourly-dropdown');
const hourlyDropDownBtn = document.querySelector('.hourly-dropdown-toggle');

searchInput.addEventListener('focus', () => {
  searchDropdown.classList.add('is-visible');
})

document.addEventListener('click', (event) => {
  if (!event.target.closest('.search_container')) {
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




