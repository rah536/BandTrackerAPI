using Microsoft.AspNetCore.Mvc;

namespace BandTrackerAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BandasController : ControllerBase
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;

        // Inyectamos las herramientas que configuraste en Program.cs
        public BandasController(IHttpClientFactory httpClientFactory, IConfiguration configuration)
        {
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;
        }

        [HttpGet("{artista}/argentina")]
        public async Task<IActionResult> GetShowsArgentina(string artista)
        {
            // 1. Buscamos tu clave de Setlist.fm en los secrets
            var apiKey = _configuration["SetlistFmApiKey"];
            if (string.IsNullOrEmpty(apiKey)) 
            {
                return StatusCode(500, "Error interno: Falta configurar la API Key de Setlist.fm en el servidor.");
            }

            // 2. Preparamos el "teléfono" para llamar a Setlist.fm
            var cliente = _httpClientFactory.CreateClient();

            // 3. Setlist.fm exige estos dos encabezados sí o sí
            cliente.DefaultRequestHeaders.Add("x-api-key", apiKey);
            cliente.DefaultRequestHeaders.Add("Accept", "application/json");

            // 4. Armamos la URL exacta (Buscamos por nombre de artista y código de país 'AR')
            string url = $"https://api.setlist.fm/rest/1.0/search/setlists?artistName={artista}&countryCode=AR";

            try
            {
                // 5. Hacemos la llamada HTTP (tu API llama a su API)
                var respuesta = await cliente.GetAsync(url);

                if (respuesta.IsSuccessStatusCode)
                {
                    // Leemos el texto gigante que nos mandaron
                    var datosJson = await respuesta.Content.ReadAsStringAsync();
                    
                    // Se lo reenviamos a tu Frontend tal cual como llegó
                    return Content(datosJson, "application/json");
                }
                else
                {
                    return StatusCode((int)respuesta.StatusCode, "La API externa rechazó la petición (¿Clave incorrecta?).");
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Fallo de red al intentar conectar: {ex.Message}");
            }
        }
        
        [HttpGet("setlist/{idRecital}")]
        public async Task<IActionResult> GetSetlist(string idRecital)
        {
            var apiKey = _configuration["SetlistFmApiKey"];
            if (string.IsNullOrEmpty(apiKey)) return StatusCode(500, "Falta API Key");

            var cliente = _httpClientFactory.CreateClient();
            cliente.DefaultRequestHeaders.Add("x-api-key", apiKey);
            cliente.DefaultRequestHeaders.Add("Accept", "application/json");

            // Esta URL apunta directamente al ID del recital en lugar de buscar por nombre
            string url = $"https://api.setlist.fm/rest/1.0/setlist/{idRecital}";

            try
            {
                var respuesta = await cliente.GetAsync(url);
                if (respuesta.IsSuccessStatusCode)
                {
                    var datosJson = await respuesta.Content.ReadAsStringAsync();
                    return Content(datosJson, "application/json");
                }
                return StatusCode((int)respuesta.StatusCode, "No se encontró el setlist.");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error de red: {ex.Message}");
            }
        }
    }
}