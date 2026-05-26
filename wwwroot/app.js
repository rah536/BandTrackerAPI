// 1. Atrapamos los elementos de la pantalla (El DOM)
const btnBuscar = document.getElementById('btnBuscar');
const inputArtista = document.getElementById('inputArtista');
const divResultados = document.getElementById('resultados');

// 2. Le decimos al botón qué hacer cuando le hagan clic
btnBuscar.addEventListener('click', buscarShows);

// 3. La función asíncrona que hace el trabajo (el equivalente a tu controlador)
async function buscarShows() {
    const artista = inputArtista.value.trim();
    
    if (artista === "") return; // Evitamos buscar si está vacío

    // Mostramos un mensaje de carga
    divResultados.innerHTML = `
        <div class="col-12 text-center text-info my-4">
            <div class="spinner-border spinner-border-sm me-2" role="status"></div>
            Buscando información de <b>${artista}</b>...
        </div>
    `;

    try {
        // Llamamos a tu propia API en .NET (Ruta relativa porque viven en el mismo server)
        const respuesta = await fetch('/api/Bandas/' + artista + '/Argentina');
        
        if (!respuesta.ok) {
            throw new Error(`El servidor respondió con error: ${respuesta.status}`);
        }

        // Convertimos la respuesta a JSON
        const datosJson = await respuesta.json();
        
        // Dibujamos el resultado en pantalla
        divResultados.innerHTML = `
            <div class="col-md-10">
                <div class="alert alert-success border-0 bg-success bg-opacity-25 text-light text-center mb-3">
                    ¡Conexión exitosa con la API de .NET!
                </div>
                <pre class="caja-json text-light p-3 rounded"><code>${JSON.stringify(datosJson, null, 2)}</code></pre>
            </div>
        `;

    } catch (error) {
        // Si la API está apagada o hay un error, lo mostramos
        divResultados.innerHTML = `
            <div class="col-md-8">
                <div class="alert alert-danger text-center">
                    <b>Error de conexión:</b> ${error.message}
                    <hr>
                    ¿Verificaste que la API de C# esté corriendo?
                </div>
            </div>
        `;
    }
}