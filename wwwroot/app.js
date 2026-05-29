// 1. Atrapamos los elementos de la pantalla (El DOM)
const btnBuscar = document.getElementById('btnBuscar');
const inputArtista = document.getElementById('inputArtista');
const divResultados = document.getElementById('resultados');

// 2. Le decimos al botón qué hacer cuando le hagan clic
btnBuscar.addEventListener('click', buscarShows);

// 3. La función asíncrona que hace el trabajo (el equivalente a tu controlador)
async function buscarShows() {
    const artista = inputArtista.value.trim();
    if (artista === "") return;

    divResultados.innerHTML = `
        <div class="col-12 text-center text-info my-4">
            <div class="spinner-border spinner-border-sm me-2" role="status"></div>
            Buscando recitales de <b>${artista}</b>...
        </div>
    `;

    try {
        const respuesta = await fetch('/api/Bandas/' + artista + '/Argentina');
        
        if (!respuesta.ok) throw new Error(`Error: ${respuesta.status}`);

        const datosJson = await respuesta.json();
        
        // 1. Verificamos si la banda tiene recitales
        const recitales = datosJson.setlist;
        if (!recitales || recitales.length === 0) {
            divResultados.innerHTML = `<div class="alert alert-warning text-center">No se encontraron shows de ${artista} en Argentina.</div>`;
            return;
        }
       
        let htmlTarjetas = `
            <div class="col-12 text-center mb-4 mt-2">
                <h2 class="text-light fw-bold">
                    Resultados para <span class="text-warning">${artista}</span>
                </h2>
                <hr class="border-secondary">
            </div>
            <div class="row w-100">
        `;
        
        // 3. Recorremos cada recital que vino en el JSON
        recitales.forEach(show => {
            // Extraemos los datos (usamos el signo ? por si algún dato viene vacío de la API)
            const fecha = show.eventDate;
            const estadio = show.venue?.name || "Estadio desconocido";
            const ciudad = show.venue?.city?.name || "Ciudad desconocida";
            const idRecital = show.id; // Nos va a servir después para ver los temas

            // Agregamos una tarjeta por cada show
            htmlTarjetas += `
                <div class="col-md-6 col-lg-4 mb-4">
                    <div class="card h-100 bg-secondary text-light border-warning shadow-sm">
                        <div class="card-body">
                            <h5 class="card-title text-warning fw-bold">📅 ${fecha}</h5>
                            <p class="card-text mb-1">🏟️ ${estadio}</p>
                            <p class="card-text text-light opacity-75">📍 ${ciudad}</p>
                        </div>
                        <div class="card-footer bg-dark border-0">
                            <button class="btn btn-outline-warning btn-sm w-100" onclick="verTemas('${idRecital}')">
                                Ver Lista de Temas
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });

        htmlTarjetas += '</div>';

        // 4. Inyectamos todas las tarjetas juntas en la pantalla
        divResultados.innerHTML = htmlTarjetas;

    } catch (error) {
        divResultados.innerHTML = `<div class="alert alert-danger text-center"><b>Artista no encontrado - Error:</b> ${error.message}</div>`;
    }
}

// Dejamos esta función preparada para el próximo paso
function verTemas(idRecital) {
    alert("Próximamente: Acá vamos a mostrar los temas del recital con ID: " + idRecital);
}