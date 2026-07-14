// 1. Atrapamos los elementos de la pantalla (El DOM)
const btnBuscar = document.getElementById('btnBuscar');
const btnLimpiar = document.getElementById('btnLimpiar');
const inputArtista = document.getElementById('inputArtista');
const divResultados = document.getElementById('resultados');

let htmlResultadosGuardados = '';

// 2. Le decimos al botón qué hacer cuando le hagan clic
btnBuscar.addEventListener('click', buscarShows);
btnLimpiar.addEventListener('click', limpiarFiltro);

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
                    Resultados para <span class="text-warning">${artista} en Argentina</span>
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

        // GUARDAMOS EL HTML EN MEMORIA ANTES DE IMPRIMIRLO
        htmlResultadosGuardados = htmlTarjetas;

        // 4. Inyectamos todas las tarjetas juntas en la pantalla
        divResultados.innerHTML = htmlTarjetas;

    } catch (error) {
        divResultados.innerHTML = `<div class="alert alert-danger text-center"><b>Artista no encontrado - Error:</b> ${error.message}</div>`;
    }
}

function limpiarFiltro() {
    // Vaciamos el input de texto
    inputArtista.value = '';
    
    // Vaciamos el contenedor de las tarjetas
    divResultados.innerHTML = `
        <div class="col-md-10 text-center text-secondary mt-4">
            Ingresá el artista para comenzar y conocer tu historial.
        </div>
    `;
    
    // Opcional: devolvemos el cursor al input para que sea más rápido volver a escribir
    inputArtista.focus(); 
}

// Dejamos esta función preparada para el próximo paso
async function verTemas(idRecital) {
    // 1. Mostramos que estamos cargando y reemplazamos temporalmente la pantalla
    divResultados.innerHTML = `
        <div class="col-12 text-center text-info my-4">
            <div class="spinner-border spinner-border-sm me-2" role="status"></div>
            Buscando las canciones del show...
        </div>
    `;

    try {
        // 2. Llamamos a nuestro nuevo endpoint del backend
        const respuesta = await fetch('/api/Bandas/setlist/' + idRecital);
        if (!respuesta.ok) throw new Error("No se pudo cargar el setlist.");
        const datos = await respuesta.json();

        // 3. Preparamos el HTML para mostrar la lista
        let htmlCanciones = `
            <div class="col-12 col-md-8 text-start bg-secondary p-4 rounded shadow-sm border border-warning">
                <h3 class="text-warning text-center fw-bold mb-3">Lista de Temas</h3>
        `;

        // 4. Verificamos si alguien ya cargó las canciones de esta fecha
        if (datos.sets && datos.sets.set && datos.sets.set.length > 0) {
            htmlCanciones += `<ol class="list-group list-group-numbered list-group-flush" data-bs-theme="dark">`;
            
            // Recorremos los "sets" (a veces dividen el show en set principal y los bises/encore)
            datos.sets.set.forEach(set => {
                set.song.forEach(cancion => {
                    // A veces hay zapadas, intros o solos que no tienen la propiedad "name"
                    const nombreCancion = cancion.name || cancion.info || "Pista desconocida";
                    htmlCanciones += `<li class="list-group-item bg-secondary text-light border-secondary">${nombreCancion}</li>`;
                });
            });
            htmlCanciones += `</ol>`;
        } else {
            htmlCanciones += `
                <div class="alert alert-dark text-center border-secondary mt-3">
                    Todavía nadie cargó los temas de esta fecha en Setlist.fm 😢
                </div>`;
        }

        // 5. Agregamos un botón para volver a la pantalla limpia
        htmlCanciones += `
                <div class="text-center mt-4">
                    <button class="btn btn-outline-info" onclick="volverAtras()">⬅ Volver a los resultados</button>
                </div>
            </div>
        `;

        // 6. Imprimimos todo
        divResultados.innerHTML = htmlCanciones;

    } catch (error) {
        divResultados.innerHTML = `<div class="alert alert-danger text-center">Error: ${error.message}</div>`;
    }
}

function volverAtras() {
    // Restauramos las tarjetas que habíamos guardado
    divResultados.innerHTML = htmlResultadosGuardados;
}