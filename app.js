// Endpoints de la API para diferentes categorías
const apiEndpoints = {
    characters: "https://swapi.dev/api/people/",
    planets: "https://swapi.dev/api/planets/",
    vehicles: "https://swapi.dev/api/vehicles/",
    films: "https://swapi.dev/api/films/",
};

// Caché para almacenar datos descargados de cada categoría
const dataCache = {
    characters: [],
    planets: [],
    vehicles: [],
    films: [],
};

// Caché para almacenar datos resueltos desde URLs relacionadas
const resolvedCache = {};

// Contenedores del DOM donde se mostrarán los datos de cada sección
const sections = {
    characters: document.getElementById("characters-container"),
    planets: document.getElementById("planets-container"),
    vehicles: document.getElementById("vehicles-container"),
    films: document.getElementById("films-container"),
};

// Campo de búsqueda en el DOM
const searchInput = document.getElementById("search");

// Mostrar una sección específica y configurar la búsqueda
function showSection(section) {
    // Ocultar todas las secciones y mostrar solo la seleccionada
    Object.values(sections).forEach((container) =>
        container.classList.add("hidden")
    );
    document.getElementById("search-container").classList.remove("hidden");
    sections[section].classList.remove("hidden");

    // Limpiar el campo de búsqueda y configurar el evento de entrada
    searchInput.value = "";
    searchInput.oninput = () => filterList(section, searchInput.value);

    // Si no hay datos en la caché, descargar datos desde la API
    if (dataCache[section].length === 0) {
        fetchAndDisplay(section);
    } else {
        // Si ya hay datos, renderizarlos directamente
        renderList(section, dataCache[section]);
    }
}

// Filtrar los elementos de la lista según la consulta del usuario
function filterList(section, query) {
    // Filtrar datos según el nombre o título y hacerlos insensibles a mayúsculas
    const filteredItems = dataCache[section].filter((item) =>
        (item.name || item.title).toLowerCase().includes(query.toLowerCase())
    );
    // Renderizar la lista filtrada
    renderList(section, filteredItems);
}

// Descargar datos de la API y mostrarlos
async function fetchAndDisplay(section) {
    try {
        // Realizar la solicitud a la API
        const response = await fetch(apiEndpoints[section]);
        const data = await response.json();
        // Guardar los datos descargados en la caché
        dataCache[section] = data.results;
        // Renderizar los datos descargados
        renderList(section, data.results);
    } catch (error) {
        console.error(`Error fetching ${section}:`, error);
    }
}

// Extraer el ID de un objeto desde su URL (útil para imágenes y detalles)
function extractIdFromUrl(url) {
    const match = url.match(/\/([0-9]*)\/$/);
    return match ? match[1] : null;
}

// Renderizar la lista de elementos en el contenedor correspondiente
function renderList(section, items) {
    // Obtener el contenedor de la sección actual
    const container = sections[section];
    container.innerHTML = "";

    // Ordenar los elementos alfabéticamente por nombre o título
    items.sort((a, b) => (a.name || a.title).localeCompare(b.name || b.title));

    // Crear y agregar tarjetas para cada elemento
    items.forEach((item) => {
        const itemName = item.name || item.title; // Obtener el nombre o título
        const itemId = extractIdFromUrl(item.url); // Obtener el ID desde la URL

        // Crear la tarjeta del elemento
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

        // Agregar evento de clic para mostrar detalles
        card.addEventListener("click", () => displayDetails(section, item));
        container.appendChild(card);
    });
}

// Resolver URLs relacionadas para obtener nombres o títulos legibles
async function resolveUrls(urls) {
    const promises = urls.map(async (url) => {
        // Si ya está resuelto en la caché, devolverlo
        if (resolvedCache[url]) {
            return resolvedCache[url];
        }

        try {
            // Descargar y guardar datos resueltos en la caché
            const response = await fetch(url);
            const data = await response.json();
            resolvedCache[url] = data.name || data.title;
            return data.name || data.title;
        } catch (error) {
            console.error(`Error resolving URL ${url}:`, error);
            return "Desconocido";
        }
    });

    return Promise.all(promises); // Esperar a que todas las URLs sean resueltas
}

// Mostrar los detalles de un elemento seleccionado en un modal
async function displayDetails(section, item) {
    const itemId = extractIdFromUrl(item.url);

    // Crear el modal para mostrar los detalles
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

    // Obtener elementos del modal
    const detailsList = document.getElementById("details-list");
    const loadingIndicator = document.getElementById("details-loading");
    const relatedFields = [
        "characters",
        "planets",
        "starships",
        "vehicles",
        "species",
    ];

    // Procesar y mostrar campos relacionados
    for (const field of relatedFields) {
        if (item[field]?.length) {
            const names = await resolveUrls(item[field]);
            const listItem = document.createElement("li");
            listItem.innerHTML = `<strong>${field}:</strong> ${names.join(", ")}`;
            detailsList.appendChild(listItem);
        }
    }

    // Mostrar otros campos relevantes del elemento
    Object.entries(item).forEach(([key, value]) => {
        if (!relatedFields.includes(key) && typeof value !== "object") {
            const listItem = document.createElement("li");
            listItem.innerHTML = `<strong>${key}:</strong> ${value}`;
            detailsList.appendChild(listItem);
        }
    });

    // Finalizar carga y mostrar lista de detalles
    detailsList.classList.remove("hidden");
    loadingIndicator.classList.add("hidden");
}

// Cerrar el modal de detalles
function closeDetails() {
    document.querySelector(".fixed.inset-0").remove();
}

// Mostrar la sección inicial al cargar la página
showSection("characters");
