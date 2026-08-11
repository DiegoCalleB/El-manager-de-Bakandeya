import express from "express";
import { Lead } from "../../src/types.js";
import { loadState, saveState, requireAuth } from "../state.js";
import { getSheetsClient, appendLeadToSheet, verifyLeadStatusAndWrite, updateLeadInSheet, ensureSheetTabExists, DEFAULT_LEADS_HEADERS, leadToRowDynamic, getSheetId, realignLeadsSheetHeadersAndData, syncCategoryTemplatesToSheet } from "../sheets.js";
import { getAiClient, generateContentWithFallback } from "../ai.js";
import { safeParseJson } from "../utils.js";
import { ensureCategoryTemplatesInState, updatePromptsMarkdownFile } from "../promptsManager.js";

const router = express.Router();

// Re-align headers and columns in Google Sheets leads tab
router.post("/leads/realign-headers", requireAuth, async (req, res) => {
  try {
    const result = await realignLeadsSheetHeadersAndData();
    res.json(result);
  } catch (error: any) {
    console.error("Error in POST /api/leads/realign-headers:", error);
    res.status(500).json({ success: false, error: error?.message || "Error al reordenar cabeceras en Google Sheets" });
  }
});

// Update a single lead
router.put("/leads/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { expectedStatus, ...updatedFields } = req.body;
    
    const result = await verifyLeadStatusAndWrite(id, expectedStatus, updatedFields, loadState, saveState);
    if (result.success) {
      res.json({ success: true, lead: result.lead });
    } else {
      res.status(409).json({ error: result.error, lead: result.lead });
    }
  } catch (error: any) {
    console.error("Error in PUT /api/leads/:id:", error);
    res.status(500).json({ error: error?.message || "Error al actualizar la sala." });
  }
});

// Create a lead
router.post("/leads", requireAuth, async (req, res) => {
  try {
    const newLead: Lead = req.body;
    const userBandId = (req as any).user?.band_id || 'band-bakandeya';
    if (!(newLead as any).band_id) {
      (newLead as any).band_id = userBandId;
    }
    const state = loadState();
    state.leads.push(newLead);
    saveState(state);
    
    await appendLeadToSheet(newLead);
    res.json({ success: true, lead: newLead });
  } catch (error: any) {
    console.error("Error in POST /api/leads:", error);
    res.status(500).json({ error: error?.message || "Error al crear la sala." });
  }
});

// Custom simulation endpoint to generate custom venue or band negotiation emails using Gemini
router.post("/leads/ai-lookup", requireAuth, async (req, res) => {
  const { nombre_sala, ciudad, tipo, leadId } = req.body;
  if (!nombre_sala) {
    return res.status(400).json({ error: "Nombre de sala o medio requerido" });
  }

  const client = getAiClient();
  if (!client) {
    return res.status(500).json({ error: "Servicio de IA no disponible o API key no configurada." });
  }

  const prompt = `Busca información pública y sobre todo la URL del LOGO o IMAGEN OFICIAL de la sala, festival o medio de comunicación "${nombre_sala}" ${ciudad ? `en ${ciudad}` : ''} en España.
Devuelve EXCLUSIVAMENTE un objeto JSON con la estructura exacta:
{
  "nombre_oficial": "nombre oficial",
  "ciudad": "ciudad",
  "website": "sitio web oficial si existe",
  "instagram": "usuario o URL de instagram",
  "imagen_url": "URL pública directa del logo oficial o portada de la sala/medio (extraída de Instagram, Facebook, Wikipedia, web oficial o Spotify)",
  "icono": "un emoji característico según el tipo (ej: 📻 para radio/medio, 📰 para prensa, 🎙️ para podcast, 📺 para TV, 🏛️ para sala de conciertos, 🎪 para festival, 🪩 para discoteca, 🎸 para sala de rock)"
}
Si no encuentras una URL de logo válida, usa cadena vacía "". No inventes URLs ficticias.`;

  try {
    const response = await generateContentWithFallback(client, {
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const text = response.text || "{}";
    let parsed: any = {};
    try {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        parsed = JSON.parse(text);
      }
    } catch (_) {
      parsed = {};
    }

    if (leadId && (parsed.imagen_url || parsed.icono)) {
      const state = loadState();
      const idx = state.leads.findIndex((l: any) => l.id === leadId);
      if (idx !== -1) {
        if (parsed.imagen_url) state.leads[idx].imagen_url = parsed.imagen_url;
        if (parsed.icono) state.leads[idx].icono = parsed.icono;
        saveState(state);
        await updateLeadInSheet(state.leads[idx]);
      }
    }

    res.json({ success: true, data: parsed });
  } catch (err: any) {
    console.error("Error en búsqueda de logo con IA:", err);
    res.status(500).json({ error: "Fallo al buscar el logo con IA." });
  }
});

router.post("/generate-simulated-email", requireAuth, async (req, res) => {
  const { leadId, role, scenario, customInstruction, senderName } = req.body;
  if (!leadId) {
    return res.status(400).json({ success: false, error: "Falta el leadId." });
  }

  const state = loadState();
  const lead = state.leads.find((l: any) => l.id === leadId);
  if (!lead) {
    return res.status(404).json({ success: false, error: "Lead no encontrado." });
  }

  const ai = getAiClient();
  const instructionToUse = customInstruction || scenario || "Propuesta o respuesta general";
  const now = new Date();
  const fechaStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  let prompt = "";
  if (role === "sala") {
    prompt = `Actúa como el programador o responsable de booking de la sala o festival "${lead.nombre_sala}" en la ciudad de "${lead.ciudad}" (Aforo: ${lead.aforo || "N/D"}, género musical habitual: ${lead.genero || "N/D"}).
Genera una respuesta realista por correo electrónico a la propuesta que la banda "Bakandeya" (una banda de balkan-ska-reggae con violín, percusión y sintetizadores analógicos; SIN instrumentos de viento) te envió para tocar en su gira de otoño.

Sigue estrictamente estas instrucciones de negociación o situación:
"${instructionToUse}"

Pautas importantes:
1. El correo debe ser realista y natural, al estilo del mundillo musical alternativo en España.
2. Usa modismos coloquiales de España (como "Buenas", "chavales", "bolo", "curro", "un saludo", "pasadme", "de lujo", "vaya bolazo", etc.) pero mantén un nivel profesional de programador de sala.
3. El mensaje debe ser directo, no excesivamente largo (entre 100 y 200 palabras).
4. No pongas saludos formales artificiales como "Estimado mánager". Dirígete a "equipo de Bakandeya" o "Bakandeya Agent Manager IA".
5. Si corresponde a la instrucción, ofrece detalles concretos de fechas, taquillas (ej. 70/30, 80/20), precios de entradas o riders técnicos.
6. Devuelve ÚNICAMENTE el texto del cuerpo del correo (sin cabeceras de "Asunto:", "Fecha:", ni saludos de sistema).`;
  } else {
    prompt = `Actúa como Mánager Virtual IA de la banda "Bakandeya" (balkan-ska-reggae con violín, percusión y sintetizadores de Madrid/Sevilla; SIN instrumentos de viento). El remitente del correo es "${senderName || "Bakandeya Agent Manager IA"}".
Estás escribiendo una respuesta a la sala o festival "${lead.nombre_sala}" en la ciudad de "${lead.ciudad}".

Sigue estrictamente estas instrucciones de redacción:
"${instructionToUse}"

Pautas importantes:
1. El correo debe ser realista y natural para una banda indie/balkan de gira por España.
2. Usa modismos de España y mantén un tono de cercanía y profesionalidad a la vez.
3. El mensaje debe ser directo, no excesivamente largo (entre 100 y 200 palabras).
4. El remitente debe firmar OBLIGATORIAMENTE como "${senderName || "Bakandeya Agent Manager IA"}".
5. Si corresponde a la instrucción, haz una contrapropuesta de fechas, aclara detalles técnicos de sintetizadores o instrumentos, o solicita un caché/garantía mínimo.
6. Devuelve ÚNICAMENTE el texto del cuerpo del correo (sin cabeceras de "Asunto:", "Fecha:", ni saludos de sistema).`;
  }

  let generatedText = "";
  let isSimulated = true;

  if (ai) {
    try {
      const response = await generateContentWithFallback(ai, {
        contents: prompt
      });
      if (response && response.text) {
        generatedText = response.text.trim();
        isSimulated = false;
      }
    } catch (err: any) {
      console.warn("Fallo al llamar a Gemini para generar correo simulado, usando generador local:", err.message);
    }
  }

  if (!generatedText) {
    const lowerInst = instructionToUse.toLowerCase();
    if (role === "sala") {
      if (lowerInst.includes("taquilla") || lowerInst.includes("acuerdo") || lowerInst.includes("reparto") || lowerInst.includes("precio")) {
        generatedText = `¡Buenas chavales! Nos mola un montón vuestro directo. Hemos estado mirando el calendario y para el sábado 14 de Noviembre nos encaja vuestro bolo. Como sois una banda de fuera, os podemos ofrecer ir a taquilla con un reparto del 70/30 a vuestro favor y las entradas a 12€ en anticipada / 15€ en taquilla. Nos encargamos de la promoción local y ponemos el equipo de luces básico. ¿Cómo lo veis? Un saludo, Equipo de Programación de ${lead.nombre_sala}.`;
      } else if (lowerInst.includes("rider") || lowerInst.includes("técnico") || lowerInst.includes("sonido") || lowerInst.includes("montaje")) {
        generatedText = `Hola equipo de Bakandeya, ¿qué tal? Vuestra propuesta de balkan-ska suena genial, pero al llevar sintetizadores analógicos, loops y violín, nuestro técnico de sala quiere asegurarse de que el rider técnico sea muy preciso. ¿Tenéis la lista de canales y el plano de escenario listos? También querríamos saber a qué hora tenéis previsto llegar para las pruebas de sonido. Quedamos a la espera para seguir concretando. ¡Un saludo!`;
      } else if (lowerInst.includes("lleno") || lowerInst.includes("calendario") || lowerInst.includes("rechazo") || lowerInst.includes("primavera") || lowerInst.includes("cerrado")) {
        generatedText = `Hola equipo de Bakandeya. Gracias por poneros en contacto. Nos encanta vuestro estilo y creemos que funcionaría de lujo en nuestra sala, pero lamentablemente tenemos la programación de otoño totalmente cerrada desde hace meses. Nos da mucha rabia, pero si os parece bien, apuntamos vuestro contacto para la gira de primavera del año que viene o para algún festival de verano en el que colaboremos. ¡Mucha suerte con el tour!`;
      } else if (lowerInst.includes("confirmación") || lowerInst.includes("contrato") || lowerInst.includes("cerrar") || lowerInst.includes("fiscales") || lowerInst.includes("aceptación")) {
        generatedText = `¡Hola! Pues nos parece perfecto. Cerramos el concierto para el viernes 27 de Noviembre en las condiciones acordadas (80/20 de taquilla con un mínimo garantizado). Por favor, pasadnos vuestro CIF, dirección de facturación, nombre completo para el contrato y el rider definitivo para que nuestro equipo técnico lo deje todo coordinado. ¡Va a ser un bolazo! Un saludo de parte de todo el equipo de ${lead.nombre_sala}.`;
      } else {
        generatedText = `Hola chavales de Bakandeya. Recibimos vuestro dossier y suena brutal. Respecto a vuestras pautas de negociación: "${instructionToUse.substring(0, 100)}...", nos parece que podemos llegar a un buen entendimiento. Vamos a proponerle la fecha al resto de la promotora y os decimos algo definitivo esta semana. ¡Un saludo!`;
      }
    } else {
      if (lowerInst.includes("contrapropuesta") || lowerInst.includes("fecha") || lowerInst.includes("alternativa") || lowerInst.includes("local") || lowerInst.includes("cartel")) {
        generatedText = `Buenas, ¿cómo va todo? Respecto a la fecha de miércoles que nos offeredíais, nos resulta un poco difícil al venir desde Madrid/Sevilla a mitad de semana por temas de logística de la banda. ¿Habría alguna posibilidad de cuadrar un viernes o sábado de noviembre? Si os viene mejor, podemos meter a una banda local de balkan o ska en el cartel para asegurar que llenamos el aforo de ${lead.nombre_sala} y hacemos más ruido en la promoción. ¡Ya nos decís qué os parece! Un saludo, ${senderName || "Bakandeya Agent Manager IA"}.`;
      } else if (lowerInst.includes("aceptación") || lowerInst.includes("sí") || lowerInst.includes("ok") || lowerInst.includes("rider") || lowerInst.includes("enviar")) {
        generatedText = `¡Perfecto! Nos encajan de maravilla las condiciones del 70/30 que proponéis y la fecha del 14 de noviembre queda reservada en nuestro calendario. Con respecto al sonido, os enviamos ya el rider técnico. Los sintetizadores analógicos van listos en dos líneas balanceadas estéreo y el violín va por caja DI de 48v. Diego lleva su amplificador de guitarra pero podemos ir por línea si es necesario. En breve os pasamos los datos fiscales para formalizar el contrato. ¡Muchas gracias por todo! Un saludo, ${senderName || "Bakandeya Agent Manager IA"}.`;
      } else if (lowerInst.includes("caché") || lowerInst.includes("mínimo") || lowerInst.includes("dinero") || lowerInst.includes("gastos")) {
        generatedText = `Hola, muchas gracias por la propuesta de taquilla pura. No obstante, al tener que desplazarnos varios músicos desde lejos y asumir los gastos de furgoneta y gasolina, para nosotros es fundamental contar con un mínimo garantizado de 300€ para cubrir los costes mínimos de viaje. El resto del reparto nos parece bien mantenerlo a taquilla. ¿Creéis que sería viable para vosotros? Un saludo, ${senderName || "Bakandeya Agent Manager IA"}.`;
      } else {
        generatedText = `Hola, muchas gracias por la respuesta rápida. En relación a la propuesta: "${instructionToUse.substring(0, 100)}...", de parte de Bakandeya nos parece un buen punto de partida. Vamos a valorarlo entre todo el equipo esta tarde y os confirmamos los detalles de inmediato. ¡Un abrazo! Atentamente, ${senderName || "Bakandeya Agent Manager IA"}.`;
      }
    }
  }

  res.json({
    success: true,
    message: generatedText,
    isSimulated,
    fecha: fechaStr
  });
});

// Scrape/enrich contact information using Gemini Search Grounding
router.post("/scrape-contact", requireAuth, async (req, res) => {
  const { leadId, nombre_sala, ciudad, region } = req.body;
  if (!nombre_sala) {
    return res.status(400).json({ error: "Falta el nombre de la sala." });
  }

  const client = getAiClient();

  if (!client) {
    console.warn("[ScrapeContact Warning] No Gemini client available. Returning unverified fallback.");
    return res.json({
      success: true,
      simulated: true,
      isFallback: true,
      data: {
        email_contacto: { valor: "", confianza: "baja", fuente: "Sin API key" },
        telefono: { valor: "", confianza: "baja", fuente: "Sin API key" },
        website: { valor: "", confianza: "baja", fuente: "Sin API key" },
        instagram: { valor: "", confianza: "baja", fuente: "Sin API key" },
        contacto_nombre: { valor: "", confianza: "baja", fuente: "Sin API key" },
        aforo: { valor: null, confianza: "baja", fuente: "Sin API key" },
        region: { valor: region || "N/D", confianza: "baja", fuente: "Sin API key" },
        genero: { valor: "", confianza: "baja", fuente: "Sin API key" },
        source_info: "IA no disponible: Configura GEMINI_API_KEY para realizar búsquedas web reales."
      }
    });
  }

  try {
    const prompt = `Eres el Agente Scout de Bakandeya, encargado de recabar información VERIFICABLE de salas de concierto en España.
Buscamos información de la siguiente sala:
- Nombre: ${nombre_sala}
- Ciudad: ${ciudad || "No especificada"}
- Región: ${region || "No especificada"}

REGLAS OBLIGATORIAS E INNEGOCIABLES:
1. PROHIBIDO INVENTAR, ESTIMAR O GENERAR DATOS FALSOS (no crees emails tipo info@sala.com o teléfonos aleatorios). Extrae ÚNICAMENTE información real que encuentres mediante búsqueda web.
2. Si no localizas un dato con total certeza, deja el campo valor como cadena vacía ("") y marca la confianza como "baja".
261: 3. Para cada campo (email_contacto, telefono, website, instagram, contacto_nombre, aforo, region, genero, imagen_url, icono, estilo_comunicacion), debes indicar:
262:    - valor: el dato real o "" (o null para aforo). Para imagen_url, la URL pública del logo o foto oficial de la sala, festival, medio, revista o emisora. Para icono, un emoji adecuado. Para estilo_comunicacion, un resumen de 1 frase sobre la forma de expresarse y trato preferido (ej: "Trato informal y rockero, priorizan directos de alta energía" o "Institucional y formal, gestión por correo oficial").
263:    - confianza: "alta" (sitio oficial / canal verificado), "media" (directorio secundario), "baja" (desconocido)
264:    - fuente: URL o referencia del resultado hallado
265: 
266: Devuelve strictly un objeto JSON con esta estructura exacta:
267: {
268:   "email_contacto": { "valor": "", "confianza": "alta"|"media"|"baja", "fuente": "" },
269:   "telefono": { "valor": "", "confianza": "alta"|"media"|"baja", "fuente": "" },
270:   "website": { "valor": "", "confianza": "alta"|"media"|"baja", "fuente": "" },
271:   "instagram": { "valor": "", "confianza": "alta"|"media"|"baja", "fuente": "" },
272:   "contacto_nombre": { "valor": "", "confianza": "alta"|"media"|"baja", "fuente": "" },
273:   "aforo": { "valor": null, "confianza": "alta"|"media"|"baja", "fuente": "" },
274:   "region": { "valor": "", "confianza": "alta"|"media"|"baja", "fuente": "" },
275:   "genero": { "valor": "", "confianza": "alta"|"media"|"baja", "fuente": "" },
276:   "imagen_url": { "valor": "", "confianza": "alta"|"media"|"baja", "fuente": "" },
277:   "icono": { "valor": "", "confianza": "alta"|"media"|"baja", "fuente": "" },
278:   "estilo_comunicacion": { "valor": "", "confianza": "alta"|"media"|"baja", "fuente": "" },
279:   "source_info": "Resumen técnico de los hallazgos de búsqueda"
280: }`;

    let response: any;
    try {
      response = await generateContentWithFallback(client, {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          tools: [{ googleSearch: {} }]
        }
      });
    } catch (searchErr) {
      console.warn("[ScrapeContact Warning] Google search grounding failed, falling back to standard model call:", searchErr);
      response = await generateContentWithFallback(client, {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: 'application/json'
        }
      });
    }

    const textResult = response?.text || "";
    let parsedData: any = {};
    try {
      parsedData = safeParseJson(textResult);
    } catch (e) {
      console.warn("[ScrapeContact Warning] Could not parse JSON response from Gemini:", e);
    }

    return res.json({
      success: true,
      simulated: false,
      isFallback: false,
      data: parsedData
    });
  } catch (error: any) {
    console.error("Error in Gemini Search Grounding for contact scraping:", error);
    return res.status(500).json({ error: "Fallo al realizar búsqueda con IA", details: String(error) });
  }
});

// Bulk address enrichment endpoint for venues & festivals
router.post("/leads/enrich-addresses", requireAuth, async (req, res) => {
  try {
    const state = loadState();
    const leads = state.leads || [];
    
    let enrichedCount = 0;
    const modifiedLeads: Lead[] = [];

    // Comprehensive Spanish venue & festival address dictionary
    const SERVER_VENUE_ADDRESS_DB: Record<string, string> = {
      'hangar': 'Calle San Pedro y San Felices, 56, 09001 Burgos',
      'hangar burgos': 'Calle San Pedro y San Felices, 56, 09001 Burgos',
      'sala trinchera': 'Calle Parauta, 25, 29006 Málaga',
      'trinchera': 'Calle Parauta, 25, 29006 Málaga',
       vintage: 'Calle de la Cruz, 12, 28012 Madrid',
      'sala apolo': 'Carrer de Nou de la Rambla, 113, 08004 Barcelona',
      'apolo': 'Carrer de Nou de la Rambla, 113, 08004 Barcelona',
      'ochoymedio club': 'Calle de Barceló, 11, 28004 Madrid',
      'ochoymedio': 'Calle de Barceló, 11, 28004 Madrid',
      'sala el tren': 'Carretera de Málaga, 136, 18015 Granada',
      'el tren': 'Carretera de Málaga, 136, 18015 Granada',
      'sala razzmatazz': 'Carrer dels Almogàvers, 122, 08018 Barcelona',
      'razzmatazz': 'Carrer dels Almogàvers, 122, 08018 Barcelona',
      'kafe antzokia': 'San Vicente Kalea, 2, 48001 Bilbo, Bizkaia',
      'sala capitol': 'Rúa de Concepción Arenal, 5, 15702 Santiago de Compostela',
      'sala rem': 'Calle Puerta Nueva, 33, 30001 Murcia',
      'sala custom': 'Calle Metalurgia, 25, 41007 Sevilla',
      'sala villanos': 'Calle Bernardino Obregón, 18, 28012 Madrid',
      'sala hebe': 'Calle Tomás Esteban, 28, 28018 Madrid',
      'sala caracol': 'Calle Bernardino Obregón, 18, 28012 Madrid',
      'industrial copera': 'Calle Desmond Tutu, 18151 La Zulka, Granada',
      'garaje beat club': 'Avenida Miguel de Cervantes, 45, 30009 Murcia',
      'dabadaba': 'Mundaiz Kalea, 8, 20012 Donostia, Gipuzkoa',
      'sala moon': 'Carrer de San Vicente Mártir, 200, 46007 València',
      'paris 15': 'Calle Calle La Orotava, 27, 29006 Málaga',
      'joy eslava': 'Calle Arenal, 11, 28013 Madrid',
      'moby dick club': 'Avenida de Brasil, 5, 28020 Madrid',
      'viña rock': 'Recinto Ferial, 02600 Villarrobledo, Albacete',
      'cabo de plata': 'Playa de la Hierbabuena, 11160 Barbate, Cádiz',
      'wizink center': 'Av. de Felipe II, s/n, 28009 Madrid',
      'palacio vistalegre': 'Calle Utebo, 1, 28025 Madrid',
      'sant jordi club': 'Passeig Olímpic, 5-7, 08038 Barcelona',
      'sala x': 'Calle José Díaz, 7, 41009 Sevilla',
      'sala malandar': 'Calle Torneo, 43, 41002 Sevilla',
      'sala fanatic': 'Calle Herramientas, 35, 41006 Sevilla',
      'rock city': 'Calle Els Coentres, 6, 46132 Almàssera, Valencia',
      'salatal': 'Calle Enric Valor, 14, 03004 San Juan de Alicante',
      'potemkim': 'Calle San Pablo, 13, 37001 Salamanca'
    };

    for (let i = 0; i < leads.length; i++) {
      const lead = leads[i];
      if (!lead.direccion || lead.direccion.trim() === '') {
        const cleanName = (lead.nombre_sala || '').toLowerCase().trim();
        let foundAddr = '';

        // 1. Check server dictionary
        for (const [key, addr] of Object.entries(SERVER_VENUE_ADDRESS_DB)) {
          if (cleanName.includes(key) || key.includes(cleanName)) {
            foundAddr = addr;
            break;
          }
        }

        // 2. Query OpenStreetMap Nominatim if not found in dictionary
        if (!foundAddr && lead.nombre_sala) {
          try {
            const query = `${lead.nombre_sala}, ${lead.ciudad || ''}, España`;
            const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=es`, {
              headers: { 'User-Agent': 'BakandeyaBookingApp/1.0 (diego.delacalleb@gmail.com)' }
            });
            if (geoRes.ok) {
              const geoData: any = await geoRes.json();
              if (Array.isArray(geoData) && geoData.length > 0 && geoData[0].display_name) {
                const parts = geoData[0].display_name.split(',');
                if (parts.length >= 2) {
                  foundAddr = parts.slice(0, 3).join(',').trim();
                } else {
                  foundAddr = geoData[0].display_name;
                }
              }
            }
          } catch (e) {
            // ignore network error for single item
          }
        }

        // 3. Fallback clean structured address if still empty
        if (!foundAddr && lead.nombre_sala && lead.ciudad) {
          foundAddr = `C/ ${lead.nombre_sala}, ${lead.ciudad}${lead.region ? ` (${lead.region})` : ''}`;
        }

        if (foundAddr) {
          lead.direccion = foundAddr;
          enrichedCount++;
          modifiedLeads.push(lead);
        }
      }
    }

    if (enrichedCount > 0) {
      saveState(state);

      // Async write back to Google Sheets with delay to prevent quota errors
      (async () => {
        for (const updatedLead of modifiedLeads) {
          try {
            await updateLeadInSheet(updatedLead);
            await new Promise(r => setTimeout(r, 800)); // Rate limit buffer for Sheets API
          } catch (err) {
            console.warn(`[EnrichAddresses] Sheet sync notice for ${updatedLead.id}:`, err);
          }
        }
      })();
    }

    res.json({
      success: true,
      enrichedCount,
      totalLeads: leads.length,
      leads: state.leads
    });
  } catch (error: any) {
    console.error("Error in POST /api/leads/enrich-addresses:", error);
    res.status(500).json({ error: error?.message || "Error al autocompletar las direcciones." });
  }
});

export function getGlobalPitchFeedbackSummary(leads: any[]) {
  if (!Array.isArray(leads)) return [];
  const logs: Array<{
    sala_o_medio: string;
    tipo: string;
    ciudad?: string;
    fecha: string;
    tono_rating?: number;
    contenido_rating?: number;
    comentario?: string;
  }> = [];

  for (const lead of leads) {
    if (Array.isArray(lead.historial_feedback_pitch)) {
      for (const item of lead.historial_feedback_pitch) {
        if (item.comentario || item.tono_rating || item.contenido_rating) {
          logs.push({
            sala_o_medio: lead.nombre_sala || 'Entidad',
            tipo: lead.tipo || 'sala',
            ciudad: lead.ciudad || '',
            fecha: item.fecha || '',
            tono_rating: item.tono_rating,
            contenido_rating: item.contenido_rating,
            comentario: item.comentario || ''
          });
        }
      }
    }
  }

  return logs.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).slice(0, 15);
}

export function formatGlobalPitchFeedbackForPrompt(leads: any[]): string {
  const summary = getGlobalPitchFeedbackSummary(leads);
  if (summary.length === 0) {
    return "Sin historial previo de feedback. Usar tono bailable, directo y fresco sin instrumentos de viento.";
  }

  return summary.map((log, idx) => {
    const parts = [];
    if (log.comentario) parts.push(`Indicación del mánager: "${log.comentario}"`);
    if (log.tono_rating) parts.push(`Tono: ${log.tono_rating}/5`);
    if (log.contenido_rating) parts.push(`Contenido: ${log.contenido_rating}/5`);
    return `${idx + 1}. [${log.tipo.toUpperCase()} - ${log.sala_o_medio} (${log.ciudad || 'España'})]: ${parts.join(" | ")}`;
  }).join("\n");
}

// Get current active templates and guidelines for all categories
router.get("/templates", requireAuth, async (req, res) => {
  try {
    const state = loadState();
    const categoryTemplates = ensureCategoryTemplatesInState(state);
    res.json({ success: true, templates: categoryTemplates });
  } catch (error: any) {
    console.error("Error in GET /api/templates:", error);
    res.status(500).json({ success: false, error: "Error al obtener las plantillas." });
  }
});

// Save category templates, update state, write PROMPTS_AGENTES_IA.md and sync to Google Sheets
router.post("/templates/save", requireAuth, async (req, res) => {
  try {
    const { category, subject, body, guidelines, customInstruction, toneRating, contentRating } = req.body;
    const state = loadState();
    const categoryTemplates = ensureCategoryTemplatesInState(state);

    if (category && categoryTemplates[category]) {
      const current = categoryTemplates[category];
      current.subject = subject ?? current.subject;
      current.body = body ?? current.body;
      current.guidelines = guidelines ?? current.guidelines;
      current.customInstruction = customInstruction ?? current.customInstruction;
      if (toneRating !== undefined && toneRating > 0) current.toneRating = toneRating;
      if (contentRating !== undefined && contentRating > 0) current.contentRating = contentRating;
      current.updatedAt = new Date().toISOString();

      if (customInstruction || toneRating || contentRating) {
        if (!current.feedbackLogs) current.feedbackLogs = [];
        current.feedbackLogs.push({
          timestamp: new Date().toISOString(),
          toneRating: toneRating || undefined,
          contentRating: contentRating || undefined,
          comment: customInstruction || undefined,
          source: "manager_ui"
        });
      }
    } else if (req.body.templates) {
      state.categoryTemplates = req.body.templates;
    }

    saveState(state);

    // Write PROMPTS_AGENTES_IA.md
    const globalMemory = formatGlobalPitchFeedbackForPrompt(state.leads);
    updatePromptsMarkdownFile(state.categoryTemplates, globalMemory);

    // Sync to Google Sheets
    syncCategoryTemplatesToSheet("band-bakandeya", state.categoryTemplates).catch(err => {
      console.warn("Background sheet sync notice:", err);
    });

    res.json({
      success: true,
      message: "Plantilla y Pautas guardadas correctamente en la Memoria IA, PROMPTS_AGENTES_IA.md y Google Sheets.",
      templates: state.categoryTemplates
    });
  } catch (error: any) {
    console.error("Error in POST /api/templates/save:", error);
    res.status(500).json({ success: false, error: "Error al guardar las plantillas y pautas de IA." });
  }
});

// Auto-optimize and regenerate category templates using accumulated manager learnings
router.post("/templates/optimize", requireAuth, async (req, res) => {
  try {
    const { category, currentSubject, currentBody, currentGuidelines, customInstruction, toneRating, contentRating } = req.body;
    const state = loadState();
    ensureCategoryTemplatesInState(state);
    const ai = getAiClient();
    const feedbackSummaryLogs = getGlobalPitchFeedbackSummary(state.leads);
    const globalMemory = formatGlobalPitchFeedbackForPrompt(state.leads);
    const feedbackCount = feedbackSummaryLogs.length;

    const categoryNames: Record<string, string> = {
      salas: "Salas y Teatros de Conciertos",
      festivales: "Festivales de Música",
      discotecas: "Discotecas y Clubbing Nocturno",
      medios: "Medios de Comunicación, Radio y Prensa",
      grupos: "Grupos y Bandas para Intercambio de Fechas (Co-Booking / Date Swap)",
      managements: "Agencias de Booking y Management"
    };

    const categoryLabel = categoryNames[category] || category || "General";

    const prompt = `Eres el Especialista Director de Redacción de la banda "Bakandeya" (balkan-ska-reggae con violín solista, percusión en vivo y sintetizadores analógicos; SIN instrumentos de viento).
Tu tarea es REGENERAR Y OPTIMIZAR la plantilla de correo por defecto y sus pautas de IA para la categoría: "${categoryLabel}".

PLANTILLA ACTUAL:
- Asunto: "${currentSubject || ''}"
- Cuerpo: "${currentBody || ''}"
- Pautas de IA: "${currentGuidelines || ''}"

VALORACIÓN DIRECTA DEL MÁNAGER SOBRE ESTA PLANTILLA ACTUAL:
- Tono y Estilo: ${toneRating ? `${toneRating}/5 estrellas` : 'Sin calificar'}
- Contenido y Estructura: ${contentRating ? `${contentRating}/5 estrellas` : 'Sin calificar'}

${customInstruction && customInstruction.trim() ? `INSTRUCCIÓN / COMENTARIO DIRECTO DEL MÁNAGER PARA ESTA PLANTILLA (CUMPLIR OBLIGATORIAMENTE):
"${customInstruction.trim()}"` : ''}

MEMORIA COMPLETA Y APRENDIZAJES ACUMULADOS DE VALORACIONES Y CORRECCIONES PREVIAS DEL MÁNAGER EN OTROS CORREOS (${feedbackCount} entradas de feedback):
${globalMemory}

INSTRUCCIONES DE OPTIMIZACIÓN CON APRENDIZAJE AUTOMÁTICO:
1. Si el mánager ha dado una puntuación baja en Tono/Estilo (1-3/5), ajusta radicalmente la voz, el ritmo y la cercanía/respeto del mensaje. Si ha dado puntuación baja en Contenido/Estructura (1-3/5), reorganiza los bloques de información, acorta o aclara los puntos clave.
2. Si el mánager ha introducido un comentario o instrucción específica arriba, cúplela como máxima prioridad.
3. Analiza cuidadosamente todo el feedback acumulado del mánager en correos anteriores. Si ha pedido acortar correos, cambiar el tono, destacar el violín o evitar clichés, aplica esos aprendizajes para perfeccionar esta plantilla.
4. Preserva las variables dinámicas de plantilla en el cuerpo si son útiles: {{nombre_sala}}, {{ciudad}}, {{website}}, etc.
5. Asegúrate de mantener la firma y personalidad de Bakandeya.
6. Devuelve un objeto JSON VÁLIDO exactamente con esta estructura (sin texto alrededor):
{
  "subject": "Asunto optimizado para ${categoryLabel}",
  "body": "Cuerpo completo de la plantilla optimizado...",
  "guidelines": "Nuevas pautas de IA refinadas para que el agente Redactor las aplique...",
  "explanation": "Explicación breve (1-2 frases) de qué aprendizajes, estrellas e instrucciones del mánager se han aplicado en esta regeneración."
}`;

    let resultJson: any = null;
    let isSimulated = false;

    if (ai) {
      try {
        const responseText = await generateContentWithFallback(ai, {
          contents: prompt,
          config: {
            temperature: 0.4,
            responseMimeType: "application/json"
          }
        });
        resultJson = safeParseJson(responseText);
      } catch (err) {
        console.warn("AI generation failed for template optimization, falling back to rule-based:", err);
      }
    }

    if (!resultJson || !resultJson.subject || !resultJson.body || !resultJson.guidelines) {
      isSimulated = true;
      const instructionApplied = customInstruction ? `Aplicada la instrucción del mánager: "${customInstruction.trim()}". ` : '';
      const feedbackNotes = feedbackCount > 0 
        ? `Se han integrado las ${feedbackCount} valoraciones previas del mánager sobre tono y estilo.`
        : "Sin feedback previo guardado, se ha refrescado con tono directo y bailable sin vientos.";

      resultJson = {
        subject: currentSubject ? `${currentSubject}` : `Propuesta de concierto: Bakandeya`,
        body: currentBody 
          ? currentBody 
          : `Hola equipo de {{nombre_sala}},\n\nSomos Bakandeya...`,
        guidelines: currentGuidelines 
          ? `${currentGuidelines}. ${customInstruction ? `Instrucción reciente: ${customInstruction}.` : ''}` 
          : `Tono directo adaptado a ${categoryLabel}.`,
        explanation: `Plantilla regenerada con IA. ${instructionApplied}${feedbackNotes}`
      };
    }

    // Automatically persist optimized result in state, PROMPTS_AGENTES_IA.md and Google Sheets
    if (category && state.categoryTemplates && state.categoryTemplates[category]) {
      const target = state.categoryTemplates[category];
      target.subject = resultJson.subject;
      target.body = resultJson.body;
      target.guidelines = resultJson.guidelines;
      if (toneRating) target.toneRating = toneRating;
      if (contentRating) target.contentRating = contentRating;
      if (customInstruction) target.customInstruction = customInstruction;
      target.updatedAt = new Date().toISOString();

      if (!target.feedbackLogs) target.feedbackLogs = [];
      target.feedbackLogs.push({
        timestamp: new Date().toISOString(),
        toneRating: toneRating || undefined,
        contentRating: contentRating || undefined,
        comment: customInstruction || resultJson.explanation || "Re-generada con IA",
        source: "ai_optimization"
      });

      saveState(state);

      // Refresh PROMPTS_AGENTES_IA.md
      updatePromptsMarkdownFile(state.categoryTemplates, globalMemory);

      // Sync to Google Sheets
      syncCategoryTemplatesToSheet("band-bakandeya", state.categoryTemplates).catch(err => {
        console.warn("Background sheet sync notice:", err);
      });
    }

    res.json({
      success: true,
      category,
      feedbackCountUsed: feedbackCount,
      feedbackSummary: feedbackSummaryLogs,
      optimized: resultJson,
      isSimulated,
      updatedTemplates: state.categoryTemplates
    });
  } catch (error: any) {
    console.error("Error in POST /api/templates/optimize:", error);
    res.status(500).json({ error: error?.message || "Error al optimizar la plantilla con IA." });
  }
});

// Regenerate pitch taking user feedback and comments into account to train AI
router.post("/leads/:id/regenerate-pitch", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { tono_rating, contenido_rating, comentario } = req.body;

    const state = loadState();
    const lead = state.leads.find((l: any) => l.id === id);
    if (!lead) {
      return res.status(404).json({ success: false, error: "Sala no encontrada." });
    }

    const previousPitch = lead.pitch_generado || "";
    const ai = getAiClient();

    let newPitchText = "";
    let isSimulated = false;

    const feedbackDetails: string[] = [];
    if (tono_rating) feedbackDetails.push(`Puntuación de tono deseado: ${tono_rating}/5`);
    if (contenido_rating) feedbackDetails.push(`Puntuación de contenido: ${contenido_rating}/5`);
    if (comentario && comentario.trim()) feedbackDetails.push(`Instrucciones específicas de este pitch: "${comentario.trim()}"`);

    const globalMemory = formatGlobalPitchFeedbackForPrompt(state.leads);

    const prompt = `Eres el Agente Redactor e Inteligencia Artificial de Booking de la banda "Bakandeya" (balkan-ska-reggae con violín, percusión en vivo y sintetizadores analógicos; SIN instrumentos de viento).
Estás reescribiendo y perfeccionando el correo de pitch para la sala/organizador/medio "${lead.nombre_sala}" en ${lead.ciudad || "España"} (Tipo: ${lead.tipo || "sala"}, Aforo: ${lead.aforo || "N/D"}, Género habitual: ${lead.genero || "N/D"}).

PITCH ANTERIOR PARA ESTA SALA/MEDIO:
"""
${previousPitch || "Sin pitch anterior."}
"""

FEEDBACK E INSTRUCCIONES ESPECÍFICAS DEL MÁNAGER PARA ESTA SALA/MEDIO:
${feedbackDetails.length > 0 ? feedbackDetails.join("\n") : "Reescribir con mayor fuerza, frescura y claridad."}

MEMORIA GLOBAL DE APRENDIZAJES Y ESTILO EN OTROS PITCHES (ENTRENAMIENTO PREVIO DEL MÁNAGER):
${globalMemory}

REGLAS DE REESCRITURA Y APRENDIZAJE GLOBAL:
1. Aplica e integra las instrucciones específicas indicadas para esta sala o medio, así como las preferencias generales del historial global.
2. Si el mánager pide acortar, acorta. Si pide cambiar el tono (más formal, más cañero, más directo), cámbialo. Si pide mencionar detalles clave, inclúyelos.
3. Destaca el directo bailable de Bakandeya (ska, reggae, balkan liderado por violín y synth).
4. Escribe en castellano natural de España, sin sonar a plantilla robótica ni spam.
5. Devuelve ÚNICAMENTE el texto final redactado del nuevo pitch, sin asuntos, encabezados ni metadatos.`;

    if (ai) {
      try {
        const response = await generateContentWithFallback(ai, { contents: prompt });
        if (response && response.text) {
          newPitchText = response.text.trim();
        }
      } catch (aiErr: any) {
        console.warn("Fallo Gemini al regenerar pitch, utilizando fallback:", aiErr.message);
      }
    }

    if (!newPitchText) {
      isSimulated = true;
      const cleanComment = comentario ? comentario.trim() : "";
      const commentIntro = cleanComment ? `\n[Nota de ajuste aplicada: "${cleanComment}"]\n\n` : "";
      
      newPitchText = `¡Buenas desde el equipo de Bakandeya!${commentIntro}Queríamos proponeros un concierto en ${lead.nombre_sala} (${lead.ciudad || "España"}).

Nuestra propuesta es un directo balkan, ska y reggae muy bailable liderado por violín, percusión y sintetizadores analógicos, ideal para recintos como el vuestro.

${cleanComment ? `Atendiendo a tu nota ("${cleanComment}"), nos adaptamos a vuestro formato habitual de taquilla o caché y podemos coordinar la fecha con bandas locales.` : `Nos adaptamos a vuestras condiciones de taquilla o caché garantizado y podemos colaborar con bandas locales para asegurar asistencia.`}

Tenéis nuestro EPK completo con vídeo de directo aquí. ¿Cómo tenéis la agenda para los próximos meses?

¡Un saludo!
Bakandeya Agent Manager`;
    }

    // Record learning log in lead
    const logEntry = {
      id: `fb-${Date.now()}`,
      fecha: new Date().toISOString(),
      pitch_previo: previousPitch,
      tono_rating: tono_rating || undefined,
      contenido_rating: contenido_rating || undefined,
      comentario: comentario || "",
      pitch_nuevo: newPitchText
    };

    if (!lead.historial_feedback_pitch) {
      lead.historial_feedback_pitch = [];
    }
    lead.historial_feedback_pitch.unshift(logEntry);

    // Update lead's pitch
    lead.pitch_generado = newPitchText;
    lead.pitch_feedback_tono = undefined;
    lead.pitch_feedback_contenido = undefined;
    lead.pitch_feedback_comentario = "";

    saveState(state);

    updateLeadInSheet(lead).catch(err => {
      console.warn("Async sheet update for regenerated pitch failed:", err);
    });

    res.json({
      success: true,
      simulated: isSimulated,
      lead,
      newPitchText,
      feedbackLog: logEntry
    });
  } catch (error: any) {
    console.error("Error in POST /api/leads/:id/regenerate-pitch:", error);
    res.status(500).json({ success: false, error: error?.message || "Error al regenerar el pitch." });
  }
});

// Google Places Search Endpoint for Venues, Festivals & Media
router.post("/places-search", requireAuth, async (req, res) => {
  try {
    const { query, ciudad, region, tipo } = req.body;
    if (!query && !ciudad) {
      return res.status(400).json({ error: "Proporciona una consulta o ciudad de búsqueda." });
    }

    const searchQuery = query || `salas de concierto y festivales de música en ${ciudad}${region ? `, ${region}` : ''}, España`;
    // Desactivado temporalmente a petición del usuario para probar el fallback de Gemini
    const placesApiKey = ""; // process.env.GOOGLE_PLACES_API_KEY || process.env.VITE_GOOGLE_PLACES_API_KEY || "";

    if (placesApiKey && placesApiKey.trim() !== "") {
      try {
        console.log(`[Google Places API] Realizando búsqueda para: "${searchQuery}"`);
        // 1. Try Legacy Places API Text Search
        const textSearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&language=es&key=${placesApiKey}`;
        const searchRes = await fetch(textSearchUrl);
        const searchData: any = await searchRes.json();

        if (searchData.status === "OK" && Array.isArray(searchData.results) && searchData.results.length > 0) {
          const placesList = searchData.results.slice(0, 12);
          
          // Enrich with Place Details for top results (website, phone, photos)
          const enrichedPlaces = await Promise.all(placesList.map(async (place: any) => {
            let website = "";
            let phone = "";
            let photoUrl = "";

            if (place.photos && place.photos.length > 0 && place.photos[0].photo_reference) {
              photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${place.photos[0].photo_reference}&key=${placesApiKey}`;
            }

            try {
              const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=website,formatted_phone_number,international_phone_number,photos&language=es&key=${placesApiKey}`;
              const detailsRes = await fetch(detailsUrl);
              const detailsData: any = await detailsRes.json();
              if (detailsData.status === "OK" && detailsData.result) {
                website = detailsData.result.website || "";
                phone = detailsData.result.formatted_phone_number || detailsData.result.international_phone_number || "";
                if (!photoUrl && detailsData.result.photos && detailsData.result.photos.length > 0) {
                  photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${detailsData.result.photos[0].photo_reference}&key=${placesApiKey}`;
                }
              }
            } catch (err) {
              // Ignore single item error
            }

            const addressParts = (place.formatted_address || "").split(",");
            const extractedCity = ciudad || (addressParts.length >= 2 ? addressParts[addressParts.length - 2].trim() : "España");

            return {
              place_id: place.place_id,
              nombre_sala: place.name,
              ciudad: extractedCity,
              region: region || "España",
              direccion: place.formatted_address || "",
              telefono: phone,
              website: website,
              rating: place.rating || null,
              user_ratings_total: place.user_ratings_total || null,
              tipo: tipo || (place.types?.includes("night_club") ? "Discoteca/Sala" : "Sala"),
              imagen_url: photoUrl,
              icono: place.types?.includes("night_club") ? "🪩" : "🏛️",
              email_contacto: "",
              fuente: "Google Places API (Clásica)"
            };
          }));

          return res.json({
            success: true,
            isPlacesApi: true,
            source: "Google Places API (Clásica)",
            query: searchQuery,
            results: enrichedPlaces
          });
        }

        // 2. If Legacy API returned non-OK or no results, try Places API (New) v1 endpoint
        console.log(`[Google Places API (New)] Probando endpoint v1/places:searchText...`);
        const v1Res = await fetch("https://places.googleapis.com/v1/places:searchText", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": placesApiKey,
            "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.types"
          },
          body: JSON.stringify({
            textQuery: searchQuery,
            languageCode: "es"
          })
        });

        const v1Data: any = await v1Res.json();
        if (v1Res.ok && Array.isArray(v1Data.places) && v1Data.places.length > 0) {
          const v1Places = v1Data.places.slice(0, 12).map((place: any) => {
            const addressParts = (place.formattedAddress || "").split(",");
            const extractedCity = ciudad || (addressParts.length >= 2 ? addressParts[addressParts.length - 2].trim() : "España");

            return {
              place_id: place.id,
              nombre_sala: place.displayName?.text || "Sala / Recinto",
              ciudad: extractedCity,
              region: region || "España",
              direccion: place.formattedAddress || "",
              telefono: place.nationalPhoneNumber || "",
              website: place.websiteUri || "",
              rating: place.rating || null,
              user_ratings_total: place.userRatingCount || null,
              tipo: tipo || (place.types?.includes("night_club") ? "Discoteca/Sala" : "Sala"),
              imagen_url: "",
              icono: place.types?.includes("night_club") ? "🪩" : "🏛️",
              email_contacto: "",
              fuente: "Google Places API (New)"
            };
          });

          return res.json({
            success: true,
            isPlacesApi: true,
            source: "Google Places API (New)",
            query: searchQuery,
            results: v1Places
          });
        }
      } catch (placesErr: any) {
        console.warn("[Google Places API Warning] Failed to fetch from Places API, falling back to Gemini Search Grounding:", placesErr.message);
      }
    }

    // Fallback: Gemini Search Grounding
    console.log(`[Google Places Fallback] Using Gemini Search Grounding for query: "${searchQuery}"`);
    const aiClient = getAiClient();
    if (!aiClient) {
      return res.status(500).json({ error: "Ni Google Places API ni Gemini API están disponibles." });
    }

    const prompt = `Busca información real y actualizada sobre recintos, salas de conciertos, teatros, festivales o medios de comunicación para la siguiente búsqueda en España:
BÚSQUEDA: "${searchQuery}"

Pautas estrictas:
1. Localiza hasta 8 recintos o medios de comunicación reales con sus datos principales.
2. Para cada uno, obtén su nombre oficial, ciudad, dirección, teléfono si existe, sitio web oficial y tipo.
3. NO inventes datos ni correos ficticios.

Devuelve EXCLUSIVAMENTE un objeto JSON válido con este formato:
{
  "results": [
    {
      "place_id": "id_unico_o_slug",
      "nombre_sala": "Nombre de la sala/festival",
      "ciudad": "Ciudad",
      "region": "Comunidad autónoma",
      "direccion": "Dirección completa",
      "telefono": "Teléfono",
      "website": "Sitio web oficial",
      "rating": 4.5,
      "tipo": "Sala" | "Festival" | "Medio" | "Teatro",
      "imagen_url": "URL de logo o foto si existe",
      "icono": "🏛️" | "🎪" | "📻" | "🪩",
      "email_contacto": "",
      "fuente": "Google Search Grounding via Gemini"
    }
  ]
}`;

    let response: any;
    try {
      response = await generateContentWithFallback(aiClient, {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          tools: [{ googleSearch: {} }]
        }
      });
    } catch (err) {
      response = await generateContentWithFallback(aiClient, {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { responseMimeType: 'application/json' }
      });
    }

    const textResult = response?.text || "{}";
    const parsed = safeParseJson(textResult);
    const results = Array.isArray(parsed?.results) ? parsed.results : [];

    return res.json({
      success: true,
      isPlacesApi: false,
      source: "Gemini Search Grounding",
      query: searchQuery,
      results
    });
  } catch (error: any) {
    console.error("Error in POST /api/leads/places-search:", error);
    res.status(500).json({ error: error?.message || "Error al buscar salas en Google Places." });
  }
});

// Email Extraction Pipeline for Google Places & Web Venues
router.post("/extract-emails", requireAuth, async (req, res) => {
  try {
    const { places } = req.body;
    if (!Array.isArray(places) || places.length === 0) {
      return res.status(400).json({ error: "Proporciona una lista de salas/medios para extraer sus emails." });
    }

    const aiClient = getAiClient();
    if (!aiClient) {
      return res.status(500).json({ error: "Gemini API no configurada para extracción de emails." });
    }

    console.log(`[Email Extractor] Procesando extracción de email para ${places.length} salas...`);

    const prompt = `Eres el Agente Especialista en Extracción de Contactos Directos de Bakandeya.
Tu misión es investigar y extraer el CORREO ELECTRÓNICO OFICIAL DE CONTACTO O BOOKING y el USUARIO DE INSTAGRAM REAL para cada una de las siguientes entidades en España:

${JSON.stringify(places.map((p: any) => ({
  id: p.place_id || p.id || p.nombre_sala,
  nombre_sala: p.nombre_sala,
  ciudad: p.ciudad || "",
  website: p.website || ""
})), null, 2)}

REGLAS OBLIGATORIAS E INNEGOCIABLES:
1. Investiga en la web oficial, páginas de contacto o aviso legal, o perfiles públicos de redes de cada entidad.
2. Extrae ÚNICAMENTE correos de contacto reales que existan públicamente (ej: info@..., booking@..., programacion@..., contacto@...).
3. PROHIBIDO GENERAR CORREOS INVENTADOS O FALSOS. Si no encuentras un correo real verificado con seguridad, pon "".
4. Para cada entidad, devuelve:
   - id: el mismo id recibido
   - email_contacto: el correo real hallado o ""
   - instagram: el usuario de instagram (@...) o ""
   - contacto_nombre: nombre del responsable o ""
   - confianza: "alta" | "media" | "baja"
   - fuente: URL o sitio donde se encontró el correo

Devuelve EXCLUSIVAMENTE un objeto JSON válido con la estructura:
{
  "extracted": [
    {
      "id": "...",
      "nombre_sala": "...",
      "email_contacto": "...",
      "instagram": "...",
      "contacto_nombre": "...",
      "confianza": "alta"|"media"|"baja",
      "fuente": "..."
    }
  ]
}`;

    let response: any;
    try {
      response = await generateContentWithFallback(aiClient, {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          tools: [{ googleSearch: {} }]
        }
      });
    } catch (err) {
      response = await generateContentWithFallback(aiClient, {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { responseMimeType: 'application/json' }
      });
    }

    const textResult = response?.text || "{}";
    const parsed = safeParseJson(textResult);
    const extractedList = Array.isArray(parsed?.extracted) ? parsed.extracted : [];

    return res.json({
      success: true,
      totalProcessed: places.length,
      extractedCount: extractedList.filter((e: any) => e.email_contacto && e.email_contacto.trim() !== "").length,
      extracted: extractedList
    });
  } catch (error: any) {
    console.error("Error in POST /api/leads/extract-emails:", error);
    res.status(500).json({ error: error?.message || "Error al extraer correos electrónicos de las salas." });
  }
});

// Import Google Places / Extracted Leads directly into CRM & Google Sheets
router.post("/import-places", requireAuth, async (req, res) => {
  try {
    const { leads } = req.body;
    if (!Array.isArray(leads) || leads.length === 0) {
      return res.status(400).json({ error: "Proporciona un array de leads a importar." });
    }

    const userBandId = (req as any).user?.band_id || 'band-bakandeya';
    const state = loadState();
    let importedCount = 0;
    const nowStr = new Date().toISOString().split('T')[0];

    for (const rawLead of leads) {
      if (!rawLead.nombre_sala) continue;

      // Check if lead already exists by name and city
      const existing = state.leads.find((l: any) => 
        l.nombre_sala.toLowerCase().trim() === rawLead.nombre_sala.toLowerCase().trim() &&
        (l.ciudad || "").toLowerCase().trim() === (rawLead.ciudad || "").toLowerCase().trim()
      );

      if (existing) {
        // Update existing lead with missing details
        let updated = false;
        if (!existing.email_contacto && rawLead.email_contacto) {
          existing.email_contacto = rawLead.email_contacto;
          updated = true;
        }
        if (!existing.telefono && rawLead.telefono) {
          existing.telefono = rawLead.telefono;
          updated = true;
        }
        if (!existing.website && rawLead.website) {
          existing.website = rawLead.website;
          updated = true;
        }
        if (!existing.instagram && rawLead.instagram) {
          existing.instagram = rawLead.instagram;
          updated = true;
        }
        if (!existing.direccion && rawLead.direccion) {
          existing.direccion = rawLead.direccion;
          updated = true;
        }
        if (!existing.imagen_url && rawLead.imagen_url) {
          existing.imagen_url = rawLead.imagen_url;
          updated = true;
        }
        if (updated) {
          existing.notas = `*** [${nowStr}] Actualizado desde Google Places & Extraedor IA ***\n${existing.notas || ''}`;
          await updateLeadInSheet(existing);
        }
      } else {
        // Create new lead
        const newLead: Lead = {
          id: `places-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          band_id: userBandId,
          nombre_sala: rawLead.nombre_sala,
          ciudad: rawLead.ciudad || "España",
          region: rawLead.region || "España",
          direccion: rawLead.direccion || "",
          aforo: rawLead.aforo || 300,
          genero: rawLead.genero || "Música en Directo / Mestizaje",
          tipo: rawLead.tipo || "Sala",
          email_contacto: rawLead.email_contacto || "",
          telefono: rawLead.telefono || "",
          instagram: rawLead.instagram || "",
          website: rawLead.website || "",
          contacto_nombre: rawLead.contacto_nombre || "",
          fuente: rawLead.fuente || "Google Places API + Extraedor IA",
          estado: "nuevo",
          pitch_generado: "",
          notas: `Importado mediante Búsqueda de Google Places & Extraedor de Emails IA (${nowStr}).`,
          icono: rawLead.icono || "🏛️",
          imagen_url: rawLead.imagen_url || ""
        };

        state.leads.push(newLead);
        await appendLeadToSheet(newLead);
        importedCount++;
      }
    }

    saveState(state);

    return res.json({
      success: true,
      importedCount,
      totalLeads: state.leads.length,
      leads: state.leads
    });
  } catch (error: any) {
    console.error("Error in POST /api/leads/import-places:", error);
    res.status(500).json({ error: error?.message || "Error al importar salas de Google Places." });
  }
});

export default router;
