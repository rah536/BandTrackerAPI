// 1. Atrapamos los elementos de la pantalla (El DOM)
const btnBuscar = document.getElementById('btnBuscar');
const btnLimpiar = document.getElementById('btnLimpiar');
const inputArtista = document.getElementById('inputArtista');
const divResultados = document.getElementById('resultados');
const divResumen = document.getElementById('resumenTemas');
const API_BASE_URL = 'https://bandtracker-api.onrender.com';

let htmlResultadosGuardados = '';
let recitalesActuales = []; // Guarda todo lo que trajo la búsqueda
let recitalesAsistidos = []; // Guarda solo los IDs de los shows que marcaste con "Estuve"

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
        const respuesta = await fetch(API_BASE_URL + '/api/Bandas/' + artista + '/Argentina');
        
        if (!respuesta.ok) throw new Error(`Error: ${respuesta.status}`);

        const datosJson = await respuesta.json();
        
        // 1. Verificamos si la banda tiene recitales
        const recitales = datosJson.setlist;
        // guardamamos el valor de los recis seleccionados
        recitalesActuales = recitales;

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
                            
                            <!-- Contenedor Flex para alinear Fecha a la izquierda y Switch a la derecha -->
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <h5 class="card-title text-warning fw-bold mb-0">📅 ${fecha}</h5>
                                
                                <div class="form-check form-switch mb-0">
                                    <input class="form-check-input switch-asistencia" type="checkbox" 
                                        id="switch_${idRecital}" 
                                        onchange="alternarAsistencia('${idRecital}', this.checked)">
                                    <!-- Dejé el label vacío para que quede más limpio, pero podés volver a poner "Fui a este show" adentro si preferís -->
                                    <label class="form-check-label text-light" for="switch_${idRecital}"></label>
                                </div>
                            </div>

                            <p class="card-text mb-1 mt-3">🏟️ ${estadio}</p>
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
    
    // Vaciamos la lista de recitales asistidos
    recitalesAsistidos = [];

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
        const respuesta = await fetch(API_BASE_URL + '/api/Bandas/setlist/' + idRecital);
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

function alternarAsistencia(idRecital, estaMarcado) {
    if (estaMarcado) {
        // Lo agregamos a la lista de asistidos
        recitalesAsistidos.push(idRecital);
    } else {
        // Lo sacamos de la lista si lo desmarca
        recitalesAsistidos = recitalesAsistidos.filter(id => id !== idRecital);
    }
    
    // Cada vez que tocás un switch, recalculamos el resumen
    generarResumenEscuchadas();
}

function generarResumenEscuchadas() {
    // Acá vamos a agrupar los temas. 
    // Usamos un objeto donde la clave es la canción y el valor es un array de lugares.
    let temasEscuchados = {}; 

    recitalesAsistidos.forEach(idAsistido => {
        // Buscamos el show completo en nuestra variable global
        const show = recitalesActuales.find(r => r.id === idAsistido);
        if (!show || !show.sets || !show.sets.set) return;

        const anio = show.eventDate.split('-')[2]; // Extraemos el año de la fecha
        const lugar = `${show.venue.name} ${anio}`;

        // Recorremos las canciones de ese show
        show.sets.set.forEach(set => {
            set.song.forEach(cancion => {
                const nombreCancion = cancion.name || "Desconocida";
                
                // Si la canción no existe en nuestro objeto, la creamos
                if (!temasEscuchados[nombreCancion]) {
                    temasEscuchados[nombreCancion] = [];
                }
                
                // Agregamos el lugar al historial de esa canción
                temasEscuchados[nombreCancion].push(lugar);
            });
        });
    });

    imprimirResumen(temasEscuchados);
}

function imprimirResumen(temasEscuchados) {
    // Si desmarcamos todos los switches, vaciamos y ocultamos la caja
    if (recitalesAsistidos.length === 0) {
        divResumen.innerHTML = '';
        return;
    }

    let htmlResumen = `
        <div class="col-12 col-md-10 bg-secondary p-4 rounded shadow border border-warning">
            <h2 class="text-warning text-center fw-bold mb-4">Lista de Temas Escuchados</h2>
            <ol class="fs-5 text-light" style="line-height: 2;">
    `;

    // Recorremos cada canción y sus lugares
    for (const [cancion, lugares] of Object.entries(temasEscuchados)) {
        // Unimos el array de lugares con comas
        const lugaresTexto = lugares.join(', ');
        
        // Armamos el renglón (usando un fondo blanco para el texto entre paréntesis como en tu diseño)
        htmlResumen += `
            <li>
                <span class="text-info">${cancion}</span> 
                <span class="bg-light text-dark px-2 py-1 rounded fw-bold ms-2" style="font-size: 0.9em;">
                    (${lugaresTexto})
                </span>
            </li>
        `;
    }

    htmlResumen += `
            </ol>
        </div>
    `;

    // Inyectamos todo en la pantalla
    divResumen.innerHTML = htmlResumen;
}