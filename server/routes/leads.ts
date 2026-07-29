import express from "express";
import { Lead } from "../../src/types.js";
import { loadState, saveState, requireAuth } from "../state.js";
import { getSheetsClient, appendLeadToSheet, verifyLeadStatusAndWrite, ensureSheetTabExists, DEFAULT_LEADS_HEADERS, leadToRowDynamic, getSheetId } from "../sheets.js";
import { getAiClient } from "../ai.js";
import { safeParseJson } from "../utils.js";

const router = express.Router();

// Update a single lead
router.put("/leads/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { expectedStatus, ...updatedFields } = req.body;
  
  const result = await verifyLeadStatusAndWrite(id, expectedStatus, updatedFields, loadState, saveState);
  if (result.success) {
    res.json({ success: true, lead: result.lead });
  } else {
    res.status(409).json({ error: result.error, lead: result.lead });
  }
});

// Create a lead
router.post("/leads", requireAuth, async (req, res) => {
  const newLead: Lead = req.body;
  const state = loadState();
  state.leads.push(newLead);
  saveState(state);
  
  await appendLeadToSheet(newLead);
  res.json({ success: true, lead: newLead });
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
Genera una respuesta realista por correo electrónico a la propuesta que la banda "Bakandeya" (una banda de balkan-ska-reggae con vientos, violín y sintetizadores analógicos) te envió para tocar en su gira de otoño.

Sigue estrictamente estas instrucciones de negociación o situación:
"${instructionToUse}"

Pautas importantes:
1. El correo debe ser realista y natural, al estilo del mundillo musical alternativo en España.
2. Usa modismos coloquiales de España (como "Buenas", "chavales", "bolo", "curro", "un saludo", "pasadme", "de lujo", "vaya bolazo", etc.) pero mantén un nivel profesional de programador de sala.
3. El mensaje debe ser directo, no excesivamente largo (entre 100 y 200 palabras).
4. No pongas saludos formales artificiales como "Estimado mánager". Usa nombres como Larra, Jon, o simplemente "Hola, equipo de Bakandeya".
5. Si corresponde a la instrucción, ofrece detalles concretos de fechas, taquillas (ej. 70/30, 80/20), precios de entradas o riders técnicos.
6. Devuelve ÚNICAMENTE el texto del cuerpo del correo (sin cabeceras de "Asunto:", "Fecha:", ni saludos de sistema).`;
  } else {
    prompt = `Actúa como miembro o mánager de la banda "Bakandeya" (balkan-ska-reggae con violín, viento y sintetizadores de Madrid/Sevilla). El remitente del correo es "${senderName || "Larra (Mánager de Bakandeya)"}".
Estás escribiendo una respuesta a la sala o festival "${lead.nombre_sala}" en la ciudad de "${lead.ciudad}".

Sigue strictly estas instrucciones de redacción:
"${instructionToUse}"

Pautas importantes:
1. El correo debe ser realista y natural para una banda indie/balkan de gira por España.
2. Usa modismos de España y mantén un tono de cercanía y profesionalidad a la vez.
3. El mensaje debe ser directo, no excesivamente largo (entre 100 y 200 palabras).
4. El remitente debe firmar como "${senderName || "Larra (Mánager de Bakandeya)"}".
5. Si corresponde a la instrucción, haz una contrapropuesta de fechas, aclara detalles técnicos de sintetizadores o instrumentos, o solicita un caché/garantía mínimo.
6. Devuelve ÚNICAMENTE el texto del cuerpo del correo (sin cabeceras de "Asunto:", "Fecha:", ni saludos de sistema).`;
  }

  let generatedText = "";
  let isSimulated = true;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
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
        generatedText = `Hola Larra, ¿qué tal? Vuestra propuesta de balkan-ska suena genial, pero al llevar sintetizadores analógicos, loops y violín, nuestro técnico de sala quiere asegurarse de que el rider técnico sea muy preciso. ¿Tenéis la lista de canales y el plano de escenario listos? También querríamos saber a qué hora tenéis previsto llegar para las pruebas de sonido. Quedamos a la espera para seguir concretando. ¡Un saludo!`;
      } else if (lowerInst.includes("lleno") || lowerInst.includes("calendario") || lowerInst.includes("rechazo") || lowerInst.includes("primavera") || lowerInst.includes("cerrado")) {
        generatedText = `Hola equipo de Bakandeya. Gracias por poneros en contacto. Nos encanta vuestro estilo y creemos que funcionaría de lujo en nuestra sala, pero lamentablemente tenemos la programación de otoño totalmente cerrada desde hace meses. Nos da mucha rabia, pero si os parece bien, apuntamos vuestro contacto para la gira de primavera del año que viene o para algún festival de verano en el que colaboremos. ¡Mucha suerte con el tour!`;
      } else if (lowerInst.includes("confirmación") || lowerInst.includes("contrato") || lowerInst.includes("cerrar") || lowerInst.includes("fiscales") || lowerInst.includes("aceptación")) {
        generatedText = `¡Hola! Pues nos parece perfecto. Cerramos el concierto para el viernes 27 de Noviembre en las condiciones acordadas (80/20 de taquilla con un mínimo garantizado). Por favor, pasadnos vuestro CIF, dirección de facturación, nombre completo para el contrato y el rider definitivo para que nuestro equipo técnico lo deje todo coordinado. ¡Va a ser un bolazo! Un saludo de parte de todo el equipo de ${lead.nombre_sala}.`;
      } else {
        generatedText = `Hola chavales de Bakandeya. Recibimos vuestro dossier y suena brutal. Respecto a vuestras pautas de negociación: "${instructionToUse.substring(0, 100)}...", nos parece que podemos llegar a un buen entendimiento. Vamos a proponerle la fecha al resto de la promotora y os decimos algo definitivo esta semana. ¡Un saludo!`;
      }
    } else {
      if (lowerInst.includes("contrapropuesta") || lowerInst.includes("fecha") || lowerInst.includes("alternativa") || lowerInst.includes("local") || lowerInst.includes("cartel")) {
        generatedText = `Buenas, ¿cómo va todo? Respecto a la fecha de miércoles que nos ofrecíais, nos resulta un poco difícil al venir desde Madrid/Sevilla a mitad de semana por temas de logística de los chavales de la banda. ¿Habría alguna posibilidad de cuadrar un viernes o sábado de noviembre? Si os viene mejor, podemos meter a una banda local de balkan o ska en el cartel para asegurar que llenamos el aforo de ${lead.nombre_sala} y hacemos más ruido en la promoción. ¡Ya nos decís qué os parece! Un saludo, ${senderName || "Larra (Mánager de Bakandeya)"}.`;
      } else if (lowerInst.includes("aceptación") || lowerInst.includes("sí") || lowerInst.includes("ok") || lowerInst.includes("rider") || lowerInst.includes("enviar")) {
        generatedText = `¡Perfecto! Nos encajan de maravilla las condiciones del 70/30 que proponéis y la fecha del 14 de noviembre queda reservada en nuestro calendario. Con respecto al sonido, os enviamos ya el rider técnico. Jon irá con los sintetizadores analógicos listos en dos líneas balanceadas estéreo y el violín va por caja DI de 48v. Diego lleva su amplificador de guitarra pero podemos ir por línea si es necesario. En breve os pasamos los datos fiscales para formalizar el contrato. ¡Muchas gracias por todo!`;
      } else if (lowerInst.includes("caché") || lowerInst.includes("mínimo") || lowerInst.includes("dinero") || lowerInst.includes("gastos")) {
        generatedText = `Hola, muchas gracias por la propuesta de taquilla pura. No obstante, al tener que desplazarnos varios músicos desde lejos y asumir los gastos de furgoneta y gasolina, para nosotros es fundamental contar con un mínimo garantizado de 300€ para cubrir los costes mínimos de viaje. El resto del reparto nos parece bien mantenerlo a taquilla. ¿Creéis que sería viable para vosotros? Un saludo, ${senderName || "Larra (Mánager de Bakandeya)"}.`;
      } else {
        generatedText = `Hola, muchas gracias por la respuesta rápida. En relación a la propuesta: "${instructionToUse.substring(0, 100)}...", de parte de Bakandeya nos parece un buen punto de partida. Vamos a valorarlo entre todo el grupo esta tarde y os confirmamos los detalles de inmediato. ¡Un abrazo!`;
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

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json'
      }
    });

    const textResult = response.text || "";
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

export default router;
