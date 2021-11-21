// Custom Http Module
function customHttp() {
  return {
    get(url, cb) {
      try {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", url);
        xhr.addEventListener("load", () => {
          if (Math.floor(xhr.status / 100) !== 2) {
            cb(`Error. Status code: ${xhr.status}`, xhr);
            return;
          }
          const response = JSON.parse(xhr.responseText);
          cb(null, response);
        });

        xhr.addEventListener("error", () => {
          cb(`Error. Status code: ${xhr.status}`, xhr);
        });

        xhr.send();
      } catch (error) {
        cb(null, error);
      }
    },
    post(url, body, headers, cb) {
      try {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", url);
        xhr.addEventListener("load", () => {
          if (Math.floor(xhr.status / 100) !== 2) {
            cb(`Error. Status code: ${xhr.status}`, xhr);
            return;
          }
          const response = JSON.parse(xhr.responseText);
          cb(null, response);
        });

        xhr.addEventListener("error", () => {
          cb(`Error. Status code: ${xhr.status}`, xhr);
        });

        if (headers) {
          Object.entries(headers).forEach(([key, value]) => {
            xhr.setRequestHeader(key, value);
          });
        }

        xhr.send(JSON.stringify(body));
      } catch (error) {
        cb(null, error);
      }
    },
  };
}

// Init http module
const http = customHttp();

//Object of news
const newsService = (function () {
  const apiKey = "994d39d771a84aada67b6bce640cfb6e";
  const apiUrl = "https://newsapi.org/v2";

  return {
    topHeadlines(country = "us", category, cb) {
      http.get(
        `${apiUrl}/top-headlines?country=${country}&category=${category}&apiKey=${apiKey}`,
        cb
      );
    },
    everything(text, cb) {
      http.get(`${apiUrl}/everything?q=${text}&apiKey=${apiKey}`, cb);
    },
  };
})();

const form = document.forms["newsControls"];
const countrySelect = form.elements["country"];
const categorySelect = form.elements["category"];
const searchInput = form.elements["search"];

// Load news
function loadNews() {
  showLoader();
  const country = countrySelect.value;
  const searchText = searchInput.value;
  const category = categorySelect.value;

  if (!searchText) {
    newsService.topHeadlines(country, category, onGetResponse);
  } else {
    newsService.everything(searchText, onGetResponse);
  }
}

// Load countries to SelectList
function loadListCountries() {
  const url = "../data/countries.json";

  http.get(url, onGetCountries);
}

// Load categories to SelectList
function loadListCategories() {
  const url = "../data/categories.json";

  http.get(url, onGetCategories);
}

//Get a list of countries
function onGetCountries(error, response) {
  if (error) {
    showAlert(error, "error-msg");
    return;
  }

  const countries = document.getElementById("country");

  response.forEach(({ name, code }) => {
    const option = createCountryOption(code, name);
    countries.appendChild(option);
  });

  M.FormSelect.init(countries);
}

function onGetCategories(error, response) {
  if (error) {
    showAlert(error, "error-msg");
    return;
  }

  const categories = document.getElementById("category");

  response.forEach((category) => {
    const option = createCategoryOption(category);
    categories.appendChild(option);
  });

  M.FormSelect.init(categories);
}

// Create an option for each country
function createCountryOption(value, country) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = country;

  return option;
}

function createCategoryOption(category) {
  const option = document.createElement("option");
  option.value = category;
  option.textContent = category[0].toUpperCase() + category.slice(1);

  return option;
}

//Get response from the server
function onGetResponse(error, response) {
  removePreloader();
  if (error) {
    showAlert(error, "error-msg");
    return;
  }

  if (!response.articles.length) {
    showAlert("No news", "yellow accent-2 blue-text");
    return;
  }
  renderNews(response.articles);
}

// Render news
function renderNews(news) {
  const newsContainer = document.querySelector(".news-container .row");
  let fragment = "";

  if (newsContainer.children.length) {
    clearContainer(newsContainer);
  }

  news.forEach((newsItem) => {
    const el = newsTemplate(newsItem);
    fragment += el;
  });

  newsContainer.insertAdjacentHTML("beforeend", fragment);
}

//Clear innerHTML of container
function clearContainer(container) {
  let child = container.lastElementChild;
  while (child) {
    container.removeChild(child);
    child = container.lastElementChild;
  }
}

// Create item template
function newsTemplate({ urlToImage, title, url, description } = {}) {
  if (!urlToImage) {
    urlToImage = "images/no_image.png";
  }

  if (!description) {
    description = "No description";
  }

  return `
      <div class="col s12 m4">
        <div class="card large">
          <div class="card-image">
            <img src="${urlToImage}"/>
            <span class="card-title">${title || ""}</span>
          </div>
          <div class="card-content">
            <p>${description || ""}</p>
          </div>
          <div class="card-action">
            <a href="${url}">Read more</a>
          </div>
        </div>
      </div>
    `;
}

// Show error message
function showAlert(msg, type = "success") {
  M.toast({ html: msg, classes: type });
}

//  init selects
document.addEventListener("DOMContentLoaded", function () {
  M.AutoInit();
  loadNews();
  loadListCountries();
  loadListCategories();
});

// Add listener 'submit' sending data on the server
form.addEventListener("submit", (e) => {
  e.preventDefault();
  loadNews();
});

// Show loader function
function showLoader() {
  document.body.insertAdjacentHTML(
    "afterbegin",
    `
    <div class="progress">
      <div class="indeterminate"></div>
    </div>
    `
  );
}

// Remove loader function
function removePreloader() {
  const loader = document.querySelector(".progress");
  if (loader) {
    loader.remove();
  }
}
