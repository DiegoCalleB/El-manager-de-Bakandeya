// Shared region and location dictionary for Spanish cities and regions

export const KNOWN_LOCATIONS = [
  "Navarra", "Pamplona", "Iruña", "Sevilla", "Granada", "Málaga", "Malaga", 
  "Cádiz", "Cadiz", "Córdoba", "Cordoba", "Huelva", "Jaén", "Jaen", "Almería", "Almeria", "Andalucía", "Andalucia",
  "Madrid", "Barcelona", "Girona", "Lleida", "Tarragona", "Cataluña", "Catalunya",
  "Valencia", "Alicante", "Castellón", "Castellon", "Bilbao", "San Sebastián", "San_Sebastian", "San Sebastian", "Donostia",
  "Vitoria", "Gasteiz", "Álava", "Alava", "Guipúzcoa", "Guipuzcoa", "Vizcaya", "País Vasco", "Pais Vasco", "Euskadi",
  "Zaragoza", "Huesca", "Teruel", "Aragón", "Aragon", "Galicia", "Vigo", "A Coruña", "Coruña", "Ourense", "Pontevedra", "Lugo",
  "Cantabria", "Santander", "Asturias", "Oviedo", "Gijón", "Gijon", "Islas Baleares", "Baleares", "Mallorca", "Ibiza", "Menorca",
  "Canarias", "Tenerife", "Las Palmas", "Gran Canaria", "Murcia", "Toledo", "Albacete", "Ciudad Real", "Cuenca", "Guadalajara",
  "Castilla-La Mancha", "Castilla La Mancha", "Valladolid", "Burgos", "León", "Leon", "Salamanca", "Segovia", "Soria", "Zamora",
  "Ávila", "Avila", "Palencia", "Castilla y León", "Castilla y Leon", "Badajoz", "Cáceres", "Caceres", "Extremadura",
  "Logroño", "Logrono", "La Rioja", "rioja"
];

export const CANONICAL_LOCATION_MAP: Record<string, string> = {
  "pamplona": "Pamplona", "iruña": "Pamplona", "iruna": "Pamplona",
  "navarra": "Navarra",
  "sevilla": "Sevilla", "granada": "Granada", "málaga": "Málaga", "malaga": "Málaga",
  "cádiz": "Cádiz", "cadiz": "Cádiz", "córdoba": "Córdoba", "cordoba": "Córdoba",
  "huelva": "Huelva", "jaén": "Jaén", "jaen": "Jaén", "almería": "Almería", "almeria": "Almería",
  "andalucía": "Andalucía", "andalucia": "Andalucía",
  "madrid": "Madrid", "barcelona": "Barcelona", "girona": "Girona", "lleida": "Lleida", "tarragona": "Tarragona",
  "cataluña": "Cataluña", "catalunya": "Cataluña",
  "valencia": "Valencia", "alicante": "Alicante", "castellón": "Castellón", "castellon": "Castellón",
  "bilbao": "Bilbao", "san sebastián": "San Sebastián", "san sebastian": "San Sebastián", "donostia": "San Sebastián",
  "vitoria": "Vitoria", "gasteiz": "Vitoria", "álava": "Álava", "alava": "Álava", "guipúzcoa": "Guipúzcoa", "guipuzcoa": "Guipúzcoa",
  "vizcaya": "Vizcaya", "país vasco": "País Vasco", "pais vasco": "País Vasco", "euskadi": "País Vasco",
  "zaragoza": "Zaragoza", "huesca": "Huesca", "teruel": "Teruel", "aragón": "Aragón", "aragon": "Aragón",
  "galicia": "Galicia", "vigo": "Vigo", "a coruña": "A Coruña", "coruña": "A Coruña", "ourense": "Ourense", "pontevedra": "Pontevedra", "lugo": "Lugo",
  "cantabria": "Cantabria", "santander": "Santander", "asturias": "Asturias", "oviedo": "Oviedo", "gijón": "Gijón", "gijon": "Gijón",
  "islas baleares": "Islas Baleares", "baleares": "Islas Baleares", "mallorca": "Mallorca", "ibiza": "Ibiza", "menorca": "Menorca",
  "canarias": "Canarias", "tenerife": "Tenerife", "las palmas": "Las Palmas", "gran canaria": "Gran Canaria",
  "murcia": "Murcia", "toledo": "Toledo", "albacete": "Albacete", "ciudad real": "Ciudad Real", "cuenca": "Cuenca", "guadalajara": "Guadalajara",
  "castilla-la mancha": "Castilla-La Mancha", "castilla la mancha": "Castilla-La Mancha",
  "valladolid": "Valladolid", "burgos": "Burgos", "león": "León", "leon": "León", "salamanca": "Salamanca", "segovia": "Segovia", "soria": "Soria",
  "zamora": "Zamora", "ávila": "Ávila", "avila": "Ávila", "palencia": "Palencia", "castilla y león": "Castilla y León", "castilla y leon": "Castilla y León",
  "badajoz": "Badajoz", "cáceres": "Cáceres", "caceres": "Cáceres", "extremadura": "Extremadura",
  "logroño": "Logroño", "logrono": "Logroño", "la rioja": "La Rioja", "rioja": "La Rioja"
};

/**
 * Maps a city name or string to its corresponding Spanish Autonomous Community / Region
 */
export function getRegionForCity(ciudadInput: string): string {
  if (!ciudadInput) return "Madrid";
  const ciudadLower = ciudadInput.toLowerCase().trim();

  if (ciudadLower.includes("pamplona") || ciudadLower.includes("navarra") || ciudadLower.includes("iruña")) {
    return "Navarra";
  }
  if (ciudadLower.includes("granada") || ciudadLower.includes("sevilla") || ciudadLower.includes("málaga") || ciudadLower.includes("malaga") || ciudadLower.includes("córdoba") || ciudadLower.includes("cordoba") || ciudadLower.includes("cádiz") || ciudadLower.includes("cadiz") || ciudadLower.includes("almería") || ciudadLower.includes("almeria") || ciudadLower.includes("jaén") || ciudadLower.includes("jaen") || ciudadLower.includes("huelva") || ciudadLower.includes("jerez") || ciudadLower.includes("andalucía") || ciudadLower.includes("andalucia")) {
    return "Andalucía";
  }
  if (ciudadLower.includes("madrid")) {
    return "Madrid";
  }
  if (ciudadLower.includes("barcelona") || ciudadLower.includes("girona") || ciudadLower.includes("lleida") || ciudadLower.includes("tarragona") || ciudadLower.includes("cataluña") || ciudadLower.includes("catalunya")) {
    return "Cataluña";
  }
  if (ciudadLower.includes("valencia") || ciudadLower.includes("alicante") || ciudadLower.includes("castellón") || ciudadLower.includes("castellon") || ciudadLower.includes("valenciana")) {
    return "Comunidad Valenciana";
  }
  if (ciudadLower.includes("bilbao") || ciudadLower.includes("san sebastián") || ciudadLower.includes("san sebastian") || ciudadLower.includes("vitoria") || ciudadLower.includes("gasteiz") || ciudadLower.includes("donostia") || ciudadLower.includes("bizkaia") || ciudadLower.includes("gipuzkoa") || ciudadLower.includes("araba") || ciudadLower.includes("euskadi") || ciudadLower.includes("país vasco") || ciudadLower.includes("pais vasco")) {
    return "País Vasco";
  }
  if (ciudadLower.includes("zaragoza") || ciudadLower.includes("huesca") || ciudadLower.includes("teruel") || ciudadLower.includes("aragón") || ciudadLower.includes("aragon")) {
    return "Aragón";
  }
  if (ciudadLower.includes("santiago") || ciudadLower.includes("coruña") || ciudadLower.includes("vigo") || ciudadLower.includes("lugo") || ciudadLower.includes("ourense") || ciudadLower.includes("pontevedra") || ciudadLower.includes("galicia")) {
    return "Galicia";
  }
  if (ciudadLower.includes("santander") || ciudadLower.includes("cantabria")) {
    return "Cantabria";
  }
  if (ciudadLower.includes("oviedo") || ciudadLower.includes("gijón") || ciudadLower.includes("gijon") || ciudadLower.includes("asturias")) {
    return "Asturias";
  }
  if (ciudadLower.includes("palma") || ciudadLower.includes("mallorca") || ciudadLower.includes("ibiza") || ciudadLower.includes("menorca") || ciudadLower.includes("baleares")) {
    return "Islas Baleares";
  }
  if (ciudadLower.includes("las palmas") || ciudadLower.includes("tenerife") || ciudadLower.includes("canarias")) {
    return "Canarias";
  }
  if (ciudadLower.includes("murcia")) {
    return "Murcia";
  }
  if (ciudadLower.includes("toledo") || ciudadLower.includes("ciudad real") || ciudadLower.includes("albacete") || ciudadLower.includes("cuenca") || ciudadLower.includes("guadalajara") || ciudadLower.includes("mancha")) {
    return "Castilla-La Mancha";
  }
  if (ciudadLower.includes("valladolid") || ciudadLower.includes("burgos") || ciudadLower.includes("salamanca") || ciudadLower.includes("león") || ciudadLower.includes("leon") || ciudadLower.includes("segovia") || ciudadLower.includes("soria") || ciudadLower.includes("ávila") || ciudadLower.includes("avila") || ciudadLower.includes("zamora") || ciudadLower.includes("palencia") || ciudadLower.includes("castilla")) {
    return "Castilla y León";
  }
  if (ciudadLower.includes("cáceres") || ciudadLower.includes("caceres") || ciudadLower.includes("badajoz") || ciudadLower.includes("extremadura")) {
    return "Extremadura";
  }
  if (ciudadLower.includes("logroño") || ciudadLower.includes("rioja")) {
    return "La Rioja";
  }

  // Fallback if unmatched
  return ciudadInput;
}
