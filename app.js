const apiEndpoints = {
    characters: "https://swapi.dev/api/people/",
    planets: "https://swapi.dev/api/planets/",
    vehicles: "https://swapi.dev/api/vehicles/",
    films: "https://swapi.dev/api/films/",
};

const dataCache = {
    characters: [],
    planets: [],
    vehicles: [],
    films: [],
};

const resolvedCache = {}; // Cache para almacenar datos resueltos desde URLs

// Sección de contenedores
const sections = {
    characters: document.getElementById("characters-container"),
    planets: document.getElementById("planets-container"),
    vehicles: document.getElementById("vehicles-container"),
    films: document.getElementById("films-container"),
};

const searchInput = document.getElementById("search");

// Mostrar una sección y configurar búsqueda
function showSection(section) {
    Object.values(sections).forEach((container) =>
        container.classList.add("hidden")
    );
    document.getElementById("search-container").classList.remove("hidden");
    sections[section].classList.remove("hidden");

    searchInput.value = "";
    searchInput.oninput = () => filterList(section, searchInput.value);

    if (dataCache[section].length === 0) {
        fetchAndDisplay(section);
    } else {
        renderList(section, dataCache[section]);
    }
}

// Filtrar la lista
function filterList(section, query) {
    const filteredItems = dataCache[section].filter((item) =>
        (item.name || item.title).toLowerCase().includes(query.toLowerCase())
    );
    renderList(section, filteredItems);
}

// Obtener datos desde la API
async function fetchAndDisplay(section) {
    try {
        const response = await fetch(apiEndpoints[section]);
        const data = await response.json();
        dataCache[section] = data.results;
        renderList(section, data.results);
    } catch (error) {
        console.error(`Error fetching ${section}:`, error);
    }
}

// Extraer ID del objeto desde su URL
function extractIdFromUrl(url) {
    const match = url.match(/\/([0-9]*)\/$/);
    return match ? match[1] : null;
}

// Renderizar la lista de elementos
function renderList(section, items) {
    const container = sections[section];
    container.innerHTML = "";

    items.sort((a, b) => (a.name || a.title).localeCompare(b.name || b.title));
    items.forEach((item) => {
        const itemName = item.name || item.title;
        const itemId = extractIdFromUrl(item.url);

        const card = document.createElement("div");
        card.className =
            "bg-gray-800 rounded-lg shadow-md p-4 text-center hover:bg-gray-700 cursor-pointer";
        card.innerHTML = `
        <img src="https://starwars-visualguide.com/assets/img/${section}/${itemId}.jpg" 
             alt="${itemName}" 
             onerror="this.src='https://starwars-visualguide.com/assets/img/placeholder.jpg';"
             class="rounded-lg mb-4 w-full h-48 object-cover" />
        <h3 class="text-lg font-bold">${itemName}</h3>
      `;
        card.addEventListener("click", () => displayDetails(section, item));
        container.appendChild(card);
    });
}

// Resolver URLs relacionadas
async function resolveUrls(urls) {
    const promises = urls.map(async (url) => {
        if (resolvedCache[url]) {
            return resolvedCache[url];
        }

        try {
            const response = await fetch(url);
            const data = await response.json();
            resolvedCache[url] = data.name || data.title;
            return data.name || data.title;
        } catch (error) {
            console.error(`Error resolving URL ${url}:`, error);
            return "Desconocido";
        }
    });

    return Promise.all(promises);
}

// Mostrar detalles en un modal
async function displayDetails(section, item) {
    const itemId = extractIdFromUrl(item.url);

    const detailsModal = document.createElement("div");
    detailsModal.className =
        "fixed inset-0 bg-gray-900 bg-opacity-90 flex items-center justify-center z-50 p-6";
    detailsModal.innerHTML = `
      <div class="bg-gray-800 rounded-lg p-6 shadow-lg max-w-xl text-white text-center">
        <img src="https://starwars-visualguide.com/assets/img/${section}/${itemId}.jpg" 
             alt="${item.name || item.title}" 
             onerror="this.src='https://starwars-visualguide.com/assets/img/placeholder.jpg';"
             class="rounded-lg mb-4 w-full h-64 object-cover" />
        <h2 class="text-2xl font-bold mb-4">${item.name || item.title}</h2>
        <div id="details-loading" class="text-yellow-400 mb-4">Cargando información adicional...</div>
        <ul id="details-list" class="hidden text-gray-400 text-left"></ul>
        <button class="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700" onclick="closeDetails()">Cerrar</button>
      </div>
    `;
    document.body.appendChild(detailsModal);

    const detailsList = document.getElementById("details-list");
    const loadingIndicator = document.getElementById("details-loading");
    const relatedFields = [
        "characters",
        "planets",
        "starships",
        "vehicles",
        "species",
    ];

    for (const field of relatedFields) {
        if (item[field]?.length) {
            const names = await resolveUrls(item[field]);
            const listItem = document.createElement("li");
            listItem.innerHTML = `<strong>${field}:</strong> ${names.join(", ")}`;
            detailsList.appendChild(listItem);
        }
    }

    Object.entries(item).forEach(([key, value]) => {
        if (!relatedFields.includes(key) && typeof value !== "object") {
            const listItem = document.createElement("li");
            listItem.innerHTML = `<strong>${key}:</strong> ${value}`;
            detailsList.appendChild(listItem);
        }
    });

    detailsList.classList.remove("hidden");
    loadingIndicator.classList.add("hidden");
}

// Cerrar el modal
function closeDetails() {
    document.querySelector(".fixed.inset-0").remove();
}

// Inicializar mostrando personajes
showSection("characters");
