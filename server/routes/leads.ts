import express from "express";
import { Lead } from "../../src/types.js";
import { loadState, saveState, requireAuth } from "../state.js";
import { getSheetsClient, appendLeadToSheet, verifyLeadStatusAndWrite, updateLeadInSheet, ensureSheetTabExists, DEFAULT_LEADS_HEADERS, leadToRowDynamic, getSheetId } from "../sheets.js";
import { getAiClient, generateContentWithFallback } from "../ai.js";
import { safeParseJson } from "../utils.js";

const router = express.Router();

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
3. Para cada campo (email_contacto, telefono, website, instagram, contacto_nombre, aforo, region, genero), debes indicar:
   - valor: el dato real o "" (o null para aforo)
   - confianza: "alta" (sitio oficial / canal verificado), "media" (directorio secundario), "baja" (desconocido)
   - fuente: URL o referencia del resultado hallado

Devuelve estrictamente un objeto JSON con esta estructura exacta:
{
  "email_contacto": { "valor": "", "confianza": "alta"|"media"|"baja", "fuente": "" },
  "telefono": { "valor": "", "confianza": "alta"|"media"|"baja", "fuente": "" },
  "website": { "valor": "", "confianza": "alta"|"media"|"baja", "fuente": "" },
  "instagram": { "valor": "", "confianza": "alta"|"media"|"baja", "fuente": "" },
  "contacto_nombre": { "valor": "", "confianza": "alta"|"media"|"baja", "fuente": "" },
  "aforo": { "valor": null, "confianza": "alta"|"media"|"baja", "fuente": "" },
  "region": { "valor": "", "confianza": "alta"|"media"|"baja", "fuente": "" },
  "genero": { "valor": "", "confianza": "alta"|"media"|"baja", "fuente": "" },
  "source_info": "Resumen técnico de los hallazgos de búsqueda"
}`;

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

export default router;
