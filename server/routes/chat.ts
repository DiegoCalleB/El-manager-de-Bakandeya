import express from "express";
import { KNOWN_LOCATIONS, CANONICAL_LOCATION_MAP, getRegionForCity } from "../../src/constants/regions.js";
import { Lead, Rehearsal, Concert } from "../../src/types.js";
import { loadState, getUserFromRequestLocal } from "../state.js";
import { getAiClient, generateContentWithFallback } from "../ai.js";
import { safeParseJson } from "../utils.js";

const router = express.Router();

router.post("/chat", async (req, res) => {
  const { message, chatHistory, agentsEnabled: agentsEnabledBody } = req.body;
  const agentsEnabled = agentsEnabledBody !== false;
  const userReq = getUserFromRequestLocal(req);
  const userRole = userReq ? userReq.role : (req.body.userRole || "member");
  const isLeader = userRole === "leader";

  const state = loadState();
  const lower = (message || "").toLowerCase().trim();

  // Intercept finance questions for non-leaders immediately
  const isFinanceQuery = /(finanza|dinero|pago|gasto|ingreso|contabilid|cuanto|cuánto|caché|cache|presupuest|balance|caja)/i.test(lower);
  if (!isLeader && isFinanceQuery) {
    return res.json({
      text: "🔒 **Acceso Restringido:** El apartado y los datos de finanzas están restringidos únicamente a los administradores de la banda (José y Diego).",
      proposedActions: []
    });
  }
  
  // Intercept agent trigger intents to bypass Gemini API completely
  // Only trigger if agents are enabled AND user explicitly requests to execute/launch an agent AND NOT expressing negative intent
  const isNegativeAgentIntent = /(no quiero|no ejecutes|sin agentes|no lances|sin lanzar|sin disparar|no dispares|no usar|sin usar agentes|no hace falta agente)/i.test(lower);

  const isExplicitAgentTrigger = agentsEnabled && !isNegativeAgentIntent && (
    (lower.includes("ejecutar") || lower.includes("lanzar") || lower.includes("correr") || lower.includes("disparar") || lower.includes("iniciar") || lower.includes("arrancar")) &&
    (lower.includes("agente") || lower.includes("scout") || lower.includes("redactor") || lower.includes("enviador") || lower.includes("lector") || lower.includes("descubridor"))
  );

  const isAgentQuery = agentsEnabled && !isNegativeAgentIntent && (isExplicitAgentTrigger || (lower.startsWith("agente ") && (lower.includes("scout") || lower.includes("redactor") || lower.includes("enviador") || lower.includes("lector") || lower.includes("descubridor"))));

  if (isAgentQuery) {
    let agentName = "Enviador";
    let desc = "Disparar el agente de Python Enviador para procesar y enviar los correos de presentación aprobados.";
    
    if (lower.includes("descubridor") || lower.includes("scout_descubridor") || lower.includes("scout-descubridor")) {
      agentName = "Scout Descubridor";
      desc = "Disparar el agente de Python Scout Descubridor para encontrar nuevas salas y festivales.";
    } else if (lower.includes("scout")) {
      agentName = "Scout";
      desc = "Disparar el agente de Python Scout para enriquecer la información de las salas de conciertos.";
    } else if (lower.includes("redactor")) {
      agentName = "Redactor";
      desc = "Disparar el agente de Python Redactor para generar de manera automatizada los borradores de pitch.";
    } else if (lower.includes("lector") || lower.includes("bandeja")) {
      agentName = "Lector";
      desc = "Disparar el agente de Python Lector para revisar tu bandeja de correo en busca de respuestas de salas.";
    }

    let triggerParams: Record<string, any> = {};

    if (agentName === "Scout Descubridor" || agentName === "Scout") {
      let detectedRegion = "";
      const knownLocations = KNOWN_LOCATIONS;
      const canonicalMapping = CANONICAL_LOCATION_MAP;

      let matchedLocation = "";
      for (const loc of knownLocations) {
        const regex = new RegExp(`\\b${loc}\\b`, 'i');
        if (regex.test(lower)) {
          matchedLocation = loc;
          break;
        }
      }

      if (matchedLocation) {
        const canonical = canonicalMapping[matchedLocation.toLowerCase()] || matchedLocation;
        const regionForCity = getRegionForCity(matchedLocation);
        detectedRegion = canonical;
        triggerParams.ciudad = canonical;
        triggerParams.region = regionForCity || canonical;
      } else {
        const regionMatch = req.body.message?.match(/(?:en|para|región|region|provincia|de)\s+([A-ZÁÉÍÓÚÑa-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑa-záéíóúñ]+)?)/i);
        if (regionMatch && regionMatch[1]) {
          const candidate = regionMatch[1].trim();
          const lowerCand = candidate.toLowerCase();
          if (!["buscar", "hacer", "ejecutar", "salas", "un", "una", "el", "la", "los", "las", "mi", "mis", "este", "esta", "ese", "esa", "agente", "scout", "descubridor", "tipo", "festival", "ayuntamiento", "concierto", "conciertos"].includes(lowerCand)) {
            detectedRegion = candidate.split(/\s+/).map(word => {
              if (["de", "la", "y", "o"].includes(word.toLowerCase())) return word.toLowerCase();
              return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
            }).join(" ");
            triggerParams.region = detectedRegion;
            triggerParams.ciudad = detectedRegion;
          }
        }
      }

      if (!triggerParams.region) {
        triggerParams.region = "Huelva";
        triggerParams.ciudad = "Huelva";
      }

      if (agentName === "Scout Descubridor") {
        let detectedTipo = "sala";
        if (lower.includes("festival") || lower.includes("festivales") || lower.includes("festis")) {
          detectedTipo = "festival";
        } else if (lower.includes("ayuntamiento") || lower.includes("ayuntamientos") || lower.includes("pueblo") || lower.includes("municipio") || lower.includes("ayto")) {
          detectedTipo = "ayuntamiento";
        } else if (lower.includes("sala") || lower.includes("salas")) {
          detectedTipo = "sala";
        }
        triggerParams.tipo = detectedTipo;
      }
    }

    let paramText = "";
    if (agentName === "Scout Descubridor") {
      paramText = `\n\n**Parámetros detectados:**\n- Región: \`${triggerParams.region}\`\n- Tipo de espacio: \`${triggerParams.tipo}\` *(obligatorio, extraído de tu mensaje)*`;
    } else if (agentName === "Scout") {
      paramText = `\n\n**Parámetros detectados:**\n- Región: \`${triggerParams.region}\` *(extraído de tu mensaje)*`;
    }

    return res.json({
      text: `🤖 **Disparador del Agente '${agentName}' Preparado**\n\nHe detectado que quieres ejecutar el agente **${agentName}** para gestionar tus tareas de booking de Bakandeya.${paramText}\n\n*Nota: La ejecución de agentes no requiere el uso de Inteligencia Artificial (Google Gemini) y se conecta directamente con tu repositorio de GitHub a través del workflow configurado.*`,
      proposedActions: [{
        type: "propose_agent_trigger",
        agentName: agentName,
        description: desc,
        params: triggerParams
      }]
    });
  }

  // Allow all general chat messages, email drafting, searches, and questions to go directly to Gemini AI.
  // Gemini receives the full stateSummary in system prompt and can process any request intelligently.

  const client = getAiClient();
  
  if (!client) {
    setTimeout(() => {
      const lowerMsg = message.toLowerCase();
      let reply = "¡Hola! Estoy funcionando en modo simulación (sin clave GEMINI_API_KEY). Puedo responderte de manera estática.\n\n";
      let proposedActions: any[] = [];
      
      if (lowerMsg.includes("madrid") || lowerMsg.includes("pendiente")) {
        const pendingMadrid = state.leads.filter((l: Lead) => l.ciudad.toLowerCase().includes("madrid") || l.estado === "pendiente_aprobacion");
        reply += `He analizado la base de datos y tienes **${pendingMadrid.length} salas** que coinciden. Por ejemplo, **Sala Apolo** en Barcelona (pendiente de aprobación) y **Sala El Tren** en Granada (pendiente de aprobación). En Madrid tienes a **Ochoymedio Club** como "nuevo".`;
        if (state.leads.some((l: Lead) => l.id === "lead-1" && l.estado === "pendiente_aprobacion")) {
          proposedActions.push({
            type: "propose_lead_approval",
            leadId: "lead-1",
            leadName: "Sala Apolo",
            description: "Aprobar el correo de presentación generado para la mítica Sala Apolo de Barcelona."
          });
        }
      } else if (lowerMsg.includes("resumen") || lowerMsg.includes("estado") || lowerMsg.includes("hoy") || lowerMsg.includes("tareas")) {
        const pendingApp = state.leads.filter((l: Lead) => l.estado === "pendiente_aprobacion").length;
        const newLeads = state.leads.filter((l: Lead) => l.estado === "nuevo").length;
        const interesting = state.leads.filter((l: Lead) => l.estado === "interesado").length;
        reply += `Aquí tienes el resumen de tu bandeja para hoy:\n- Tienes **${pendingApp} correos de presentación pendientes** de revisión en el panel de aprobación.\n- Hay **${newLeads} salas nuevas** recién descubiertas por el agente Scout.\n- Tienes **${interesting} respuestas con interés** pendientes de clasificar o responder.\n\nTe sugiero revisar el correo de **Sala Apolo** o **Sala El Tren** para que el agente Enviador lo mande esta tarde.`;
        if (state.leads.some((l: Lead) => l.id === "lead-3" && l.estado === "pendiente_aprobacion")) {
          proposedActions.push({
            type: "propose_lead_approval",
            leadId: "lead-3",
            leadName: "Sala El Tren",
            description: "Aprobar el correo preparado para Sala El Tren en Granada."
          });
        }
      } else if (lowerMsg.includes("reggae") || lowerMsg.includes("ska")) {
        const count = state.leads.filter((l: Lead) => l.genero.toLowerCase().includes("reggae") || l.genero.toLowerCase().includes("ska")).length;
        reply += `Tienes actualmente **${count} salas** especializadas en Ska/Reggae en la base de datos (por ejemplo, *Kafe Antzokia* en Bilbao, *Sala El Tren* en Granada y *Viña Rock*).`;
      } else {
        reply += `Entendido. Como tu Manager Virtual de Bakandeya, monitorizo la hoja de cálculo y puedo disparar tus agentes. Tienes:\n- **${state.leads.length} salas** en total\n- **${state.rehearsals.filter((r: Rehearsal) => r.estado === 'programado').length} ensayos programados**\n- **${state.concerts.filter((c: Concert) => c.fecha >= '2026-07-09').length} próximos conciertos**\n\n¿Quieres que revisemos los correos de presentación, agendemos un ensayo o lancemos un agente como el **Scout**?`;
      }
      
      res.json({ text: reply, proposedActions });
    }, 1000);
    return;
  }

  try {
    const stateSummary: any = {
      leads: state.leads.map((l: Lead) => ({
        id: l.id,
        nombre_sala: l.nombre_sala,
        ciudad: l.ciudad,
        region: l.region,
        aforo: l.aforo,
        genero: l.genero,
        tipo: l.tipo,
        email_contacto: l.email_contacto,
        telefono: l.telefono,
        instagram: l.instagram,
        fuente: l.fuente,
        estado: l.estado,
        icono: l.icono,
        imagen_url: l.imagen_url,
        notas: l.notas,
        fecha_envio: l.fecha_envio,
        fecha_ultima_respuesta: l.fecha_ultima_respuesta,
        hasPitch: !!l.pitch_generado
      })),
      bands: (state.bands || []).map((b: any) => ({
        id: b.id,
        nombre_banda: b.nombre_banda,
        estilo_musical: b.estilo_musical,
        localizacion: b.localizacion,
        icono: b.icono,
        imagen_url: b.imagen_url
      })),
      tours: (state.tours || []).map((t: any) => ({
        id: t.id,
        nombre: t.nombre,
        vehiculo: t.vehiculo,
        estado: t.estado,
        fechaInicio: t.fechaInicio,
        fechaFin: t.fechaFin,
        presupuestoLogistica: t.presupuestoLogistica,
        stops: t.stops
      })),
      songs: (state.songs || []).map((s: any) => ({ id: s.id, titulo: s.titulo, estado: s.estado, duracion: s.duracion })),
      setlists: (state.setlists || []).map((st: any) => ({ id: st.id, titulo: st.titulo, fecha: st.fecha, duracionTotal: st.duracionTotal })),
      fansCount: (state.fans || []).length,
      rehearsals: state.rehearsals,
      concerts: state.concerts.map((c: Concert) => ({
        id: c.id,
        fecha: c.fecha,
        ciudad: c.ciudad,
        sala: c.sala,
        cache: isLeader ? c.cache : "Restringido",
        contrato_firmado: c.contrato_firmado,
        estado_pago: c.estado_pago
      })),
      recentMessages: state.messages.slice(-5)
    };

    if (isLeader) {
      stateSummary.payments = state.payments;
    }

    const systemPrompt = `Eres el "Manager Virtual de Bakandeya", un asistente de Inteligencia Artificial para la banda de música española "Bakandeya".
Tu labor es ayudar a los miembros de la banda a organizarse, consultar sus datos de Google Sheets de salas de conciertos, ver el calendario de ensayos, conciertos y resolver dudas en lenguaje natural.

DOSSIER COMPLETO E INFORMACIÓN INTERNA DE LA BANDA BAKANDEYA:
1. ESTILO Y PROPUESTA MUSICAL:
- Estilo: Electrónica-fusión / Electrobasureo (percusión reciclada). Mezcla electrónica analógica, reggae, balkan, klezmer, jazz, música oriental, clásico, DnB, techno.
- Contacto oficial: Bakandeya@gmail.com | Tel: +34 652938521 | Instagram: @Bakandeya

2. MIEMBROS DE LA BANDA:
- Jon Quel: Voz, guitarra, beatbox, percusión. Ex-JarelBabel, acróbata, profesor de rap en centros penitenciarios, percusionista en la compañía Toompak.
- José Filgueira: Percusión. Músico y actor, ex-Swingdigentes (25 países), Cirque du Soleil, actualmente en STOMP.
- Elyar Pashang: Multi-percusionista turco-iraní (handpan, nagara, darbuka, daf) formado en Tabriz (Irán), especialista en folclor azerbaiyano y oriental.
- Raúl Pérez: Violinista mexicano, arreglista e intérprete, ex-Teatro de la Memoria, historiador, novelista ("La taberna de las ánimas").

3. DEPARTAMENTOS INTERNOS DE GESTIÓN BAKANDEYA:
- Community Manager (Redes): Edición/subida de vídeos y fotos (IG, TikTok, YT), algoritmos, análisis de viralización, respuesta de comentarios y DMs/filtrado de propuestas laborales.
- Distribuidora: Mailing promocional y de búsqueda de fechas a Salas, Festivales, Teatros y profesionales. Listados organizados (trabajadas, objetivo, sin contestar).
- Promoción de Medios: Contacto con periódicos, TV, radio, podcasts artísticos, YouTubers e influencers culturales.
- Distribuidora Social: Contacto directo con personas de interés y propuestas de colaboración con otros grupos/artistas.
- Biblioteca de Salas, Festivales y Teatros: Base de datos viva sincronizada con Google Sheets.
- Análisis de Resultados: Conversión y métricas de seguimiento de campañas.

${!isLeader ? `RESTRICCIÓN CRÍTICA DE FINANZAS:
El usuario actual NO es un administrador de la banda (rol: miembro). Tiene ESTRICTAMENTE PROHIBIDO ver, consultar o solicitar información sobre finanzas, contabilidad, pagos, gastos, ingresos, balances, caja o cachés de conciertos. Si el usuario realiza cualquier pregunta sobre dinero, finanzas o partidas contables, DEBES RESPONDER ÚNICA Y EXCLUSIVAMENTE CON ESTE TEXTO EXACTO: "🔒 *El apartado y los datos de finanzas están restringidos únicamente a los administradores de la banda (José y Diego).*" SIN APORTAR NINGÚN DATO FINANCIERO.
` : ''}
Estilo de comunicación:
- Habla en español de España.
- Usa un tono amigable, cercano, entusiasta y muy profesional del mundo de la música y backstage (un colega con criterio, nada de corporativo aburrido).
- Sé directo y conciso. Evita parrafadas innecesarias.

Aquí tienes el estado actual de los datos reales de la banda recopilados en tiempo real:
${JSON.stringify(stateSummary, null, 2)}

Tu respuesta debe estar estructurada de tal manera que puedas proponer acciones si el usuario lo solicita o si detectas una acción lógica (como aprobar un correo de contacto de una sala, agendar ensayo, cambiar la clasificación de interés o ejecutar un agente de GitHub).
Debes devolver la respuesta en formato JSON strictly para que la app pueda renderizar el texto en Markdown y ofrecer botones interactivos.

El JSON de respuesta debe tener la siguiente forma exacta:
{
  "text": "Tu respuesta redactada en Markdown con formato elegante, negritas, listas si es necesario, etc.",
  "proposedActions": [
    {
      "type": "propose_lead_approval",
      "leadId": "id-de-la-sala",
      "leadName": "Nombre de la Sala",
      "description": "Breve texto explicativo de la acción, Ej: Aprobar correo de presentación para Sala Apolo."
    }
  ]
}

Puedes proponer acciones como:
1. 'propose_lead_approval' para salas en 'pendiente_aprobacion' (con 'leadId' y 'leadName').
2. 'propose_status_change' con 'leadId', 'leadName' y 'newStatus' (por ejemplo 'interesado', 'negociando', 'no_interesado') para cambiar la clasificación de interés de una sala.
3. 'propose_concert' para agendar/añadir un concierto o bolo en la agenda de la banda y Google Sheets (incluye 'description', opcional 'leadId', y un objeto 'concert' con { fecha: 'YYYY-MM-DD', ciudad: '...', sala: '...', cache: 0, aforo_total: 200, contrato_firmado: true, estado_pago: 'pendiente', notas: '...', tipo: 'sala' }).
4. 'propose_rehearsal' para proponer/agendar un ensayo (incluye 'description' y un objeto 'rehearsal' con { fecha: 'YYYY-MM-DD', hora: '19:00', lugar: '...', asistentes: ['Banda'], notas: '...', estado: 'programado' }).
5. 'propose_band' para añadir una nueva banda al CRM (incluye 'description' y un objeto 'band' con { nombre_banda: '...', estilo_musical: '...', localizacion: '...', estado_relacion: 'nuevo', contacto_nombre: '', email: '', telefono: '', instagram: '', notas_colaboracion: '' }).
6. 'propose_tour' para planificar o guardar una gira en el gestor de giras y Google Sheets (incluye 'description' y un objeto 'tour' con { id: 'tour-...', nombre: 'Gira ...', vehiculo: 'Furgoneta 9 Plazas', estado: 'planificacion', fechaInicio: 'YYYY-MM-DD', fechaFin: 'YYYY-MM-DD', presupuestoLogistica: 500, stops: [] }).
7. 'propose_update_logo' para buscar, asignar o actualizar el logo de una sala, medio, festival o banda. Incluye 'targetType' ('lead' o 'band'), 'leadId' o 'bandId', 'targetName', 'imagen_url', 'icono' y 'description'.
${agentsEnabled ? `8. 'propose_agent_trigger' con 'agentName' (debe ser obligatoriamente 'Scout', 'Scout Descubridor', 'Redactor', 'Enviador' o 'Lector') y un objeto 'params' opcional. Usar SOLO cuando el usuario solicite explícitamente ejecutar/lanzar un agente de GitHub Actions.` : `8. [MODO AGENTES GITHUB ACTIONS DESACTIVADO]: El modo de ejecuciones externas de Python está DESACTIVADO por el usuario. NUNCA propongas 'propose_agent_trigger' bajo ningún concepto.`}

REGLA DE LOGOS E IMÁGENES: Si el usuario te pide buscar, asignar o completar los logos o imágenes de salas, medios o bandas, o si detectas que falta un logo, puedes proponer acciones 'propose_update_logo' para asignar la URL del logo (imagen_url) o un icono emoji (icono). Se guardará automáticamente en Google Sheets.

REGLA DE AGENTES Y GEMINI: ${agentsEnabled ? `Si el usuario indica que NO quiere usar o lanzar agentes de Python ("no quiero agentes", "sin agentes", "hazlo tú"), NUNCA propongas 'propose_agent_trigger'.` : `El modo Agentes Python está desactivado en la interfaz. NUNCA menciones lanzar agentes de Python ni propongas 'propose_agent_trigger'. Tú como Gemini gestionas directamente la redacción de pitches, búsquedas, filtrados y consultas.`}

REGLA IMPORTANTE: Si el usuario te pide agendar, añadir o programar un concierto o bolo (por ejemplo "añade concierto en Sala Villanos" o "hemos cerrado bolo"), SIEMPRE debes incluir una acción 'propose_concert' con el objeto 'concert' relleno. No te limites solo a cambiar el estado del lead, crea la acción 'propose_concert' para que el concierto se guarde en la pestaña 'conciertos' de Google Sheets.

Si no hay ninguna acción lógica que proponer, devuelve 'proposedActions' como una lista vacía [].
Nunca inventories datos. Si el usuario pregunta por algo que no está en el JSON de estado, indícale amablemente que no tienes registro de ello.`;

    const contents: any[] = [];
    
    if (chatHistory && chatHistory.length > 0) {
      chatHistory.forEach((h: any) => {
        const role = h.sender === 'user' ? 'user' : 'model';
        if (contents.length === 0 && role === 'model') return;

        if (contents.length === 0) {
          contents.push({
            role: 'user',
            parts: [{ text: typeof h.text === 'string' ? h.text : JSON.stringify(h.text) }]
          });
        } else {
          const lastIndex = contents.length - 1;
          const lastRole = contents[lastIndex].role;
          if (lastRole === role) {
            contents[lastIndex].parts.push({
              text: typeof h.text === 'string' ? h.text : JSON.stringify(h.text)
            });
          } else {
            contents.push({
              role: role,
              parts: [{ text: typeof h.text === 'string' ? h.text : JSON.stringify(h.text) }]
            });
          }
        }
      });
    }

    if (contents.length === 0) {
      contents.push({
        role: 'user',
        parts: [{ text: message }]
      });
    } else {
      const lastIndex = contents.length - 1;
      const lastRole = contents[lastIndex].role;
      if (lastRole === 'user') {
        contents[lastIndex].parts.push({ text: message });
      } else {
        contents.push({
          role: 'user',
          parts: [{ text: message }]
        });
      }
    }

    let response: any = null;
    let lastError: any = null;

    try {
      response = await generateContentWithFallback(client, {
        contents: contents,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json'
        }
      });
    } catch (err: any) {
      lastError = err;
    }

    if (!response) {
      console.warn("Gemini chat models failed, returning helpful quota/error message. Error details:", lastError);
      
      const errMessage = String(lastError?.message || lastError || "");
      let reply = "⚠️ **Servicio de Inteligencia Artificial No Disponible Temporalmente**\n\n";
      
      if (errMessage.includes("quota") || errMessage.includes("exhausted") || errMessage.includes("429") || errMessage.includes("limit")) {
        reply += `El límite de peticiones de Google Gemini para la clave actual se ha alcanzado (Error: Quota Exceeded / Rate Limit).\n\n` +
                 `**Explicación y Solución:**\n` +
                 `1. **Clave compartida por defecto**: El entorno de vista previa utiliza una clave gratuita con un límite estricto de **20 peticiones al día por proyecto** (\`GenerateRequestsPerDay-FreeTier\`).\n` +
                 `2. **Usa tu clave personal de Google AI Studio**: Ve a [aistudio.google.com](https://aistudio.google.com/), crea una API Key (empieza por \`AIzaSy...\`) e introdúcela en la sección de **Settings / Variables de entorno** como \`GEMINI_API_KEY\`. Tu clave personal tiene una cuota diaria mucho más amplia (1,500 solicitudes/día gratis).\n` +
                 `3. **Reinicio de cuota**: Si estás usando la clave por defecto, la cuota se restablecerá automáticamente.\n\n` +
                 `*Nota: Todas las demás funciones del panel (Google Sheets, gestión de salas, agenda de ensayos y envío de correos) siguen funcionando con normalidad.*`;
      } else {
        reply += `Ha ocurrido un error inesperado al conectar con Google Gemini:\n\n` +
                 `\`\`\`\n${errMessage}\n\`\`\`\n\n` +
                 `Por favor, inténtalo de nuevo en unos instantes o comprueba tu conexión y configuración de claves.`;
      }

      const proposedActions: any[] = [];
      const lowerMsg = (message || "").toLowerCase();

      const pendingLeads = state.leads.filter((l: Lead) => l.estado === "pendiente_aprobacion");
      let matchedLead = null;
      for (const lead of pendingLeads) {
        if (lowerMsg.includes(lead.nombre_sala.toLowerCase())) {
          matchedLead = lead;
          break;
        }
      }

      if (matchedLead) {
        reply += `\n\n💡 **Acción recomendada detectada:** He detectado que te refieres a **${matchedLead.nombre_sala}**. Puedes aprobar su correo de presentación directamente con el botón de abajo:`;
        proposedActions.push({
          type: "propose_lead_approval",
          leadId: matchedLead.id,
          leadName: matchedLead.nombre_sala,
          description: `Aprobar el correo de presentación preparado para ${matchedLead.nombre_sala}.`
        });
      } else if (pendingLeads.length > 0 && (lowerMsg.includes("aprobar") || lowerMsg.includes("pendiente") || lowerMsg.includes("correo"))) {
        const firstPending = pendingLeads[0];
        reply += `\n\n💡 **Acción recomendada detectada:** Tienes **${pendingLeads.length}** salas pendientes de aprobación. Te propongo aprobar la primera (**${firstPending.nombre_sala}**):`;
        proposedActions.push({
          type: "propose_lead_approval",
          leadId: firstPending.id,
          leadName: firstPending.nombre_sala,
          description: `Aprobar el correo de presentación preparado para ${firstPending.nombre_sala}.`
        });
      }

      return res.json({
        text: reply,
        proposedActions
      });
    }

    let textResult = "";
    try {
      textResult = response.text || "";
    } catch (_) {
      try {
        textResult = response.candidates?.[0]?.content?.parts?.[0]?.text || "";
      } catch (__) {
        textResult = "";
      }
    }

    if (!textResult) {
      textResult = "No se pudo obtener un texto claro del modelo en este momento.";
    }

    let parsed;
    try {
      parsed = safeParseJson(textResult);
      if (!parsed || typeof parsed !== "object" || typeof parsed.text !== "string") {
        parsed = {
          text: typeof parsed?.text === "string" ? parsed.text : textResult,
          proposedActions: Array.isArray(parsed?.proposedActions) ? parsed.proposedActions : []
        };
      }
    } catch (parseErr) {
      console.warn("[Gemini API] No se pudo parsear el JSON de respuesta. Usando texto plano en su lugar:", parseErr);
      parsed = { text: textResult, proposedActions: [] };
    }
    res.json(parsed);

  } catch (error: any) {
    console.error("Error in Gemini API chat proxy:", error);
    res.json({
      text: `⚠️ **Aviso del Mánager Virtual AI:** Ocurrió un inconveniente al procesar tu consulta (${error?.message || error}). Por favor, vuelve a intentarlo.`,
      proposedActions: []
    });
  }
});

// AI Reels Copy Writer Endpoint
router.post("/write-reels-copy", async (req, res) => {
  const { idea, style } = req.body;
  const client = getAiClient();
  
  const baseIdea = idea || "un ensayo improvisando ritmos ska";
  const prompt = style === "hype" 
    ? `Eres el redactor de redes de la banda "Bakandeya". Genera una publicación para Instagram Reels o TikTok con un estilo de "Balkan Hype" salvaje, enérgico, callejero, de fiesta descontrolada y directo sudoroso. Usa emojis de fuego, violín, sintetizadores, percusión, saltos, y hashtags de balkan ska, mestizaje, violin en directo, sintetizadores y rock. REGLA OBLIGATORIA: Bakandeya NO TIENE instrumentos de viento (trompetas, saxos, trombones); NUNCA uses la palabra vientos, trompetas, ni saxos. Sé muy cañero, breve y directo. La idea es: "${baseIdea}"`
    : `Eres el redactor de redes de la banda "Bakandeya". Genera una publicación para Instagram Reels o TikTok con un estilo de "Reggae Chill", relajado, místico, de buenas vibras veraniegas, paz, amor y conexión con el ritmo de la tierra. Usa emojis de paz, sol, violín, plantas, olas y hashtags de roots reggae, reggae español, mestizaje y ska tranquilo. REGLA OBLIGATORIA: Bakandeya NO TIENE instrumentos de viento; NUNCA uses vientos, trompetas ni saxos. Sé breve y deja que la vibra fluya. La idea es: "${baseIdea}"`;

  if (!client) {
    const copy = style === "hype"
      ? `🔥 ¡ESTO VA A EXPLODAR! 🎻💥 Nos hemos encerrado en el local y ha salido esta LOCURA DE RITMO BALKÁNICO. Si te gusta sudar y saltar con violín virtuoso y sintetizadores hasta romper la zapatilla, guárdate este vídeo. ¡Nos vemos en los escenarios de la gira Bakandeya 2026! 🥁🚀\n\n#Bakandeya #BalkanSka #Fiesta #Mestizaje #ViolinEnDirecto #Directo`
      : `✨ Buenas vibras y buenas energías. 🌴 Sol, ritmo y espacio para respirar con Bakandeya. La música sana y une. ¿Sientes el groove? Dejad un comentario con vuestra energía. 🌿✌️\n\n#Bakandeya #ReggaeChill #RootsReggae #BuenasVibras #MusicaReal #Groove`;
    return res.json({ copy });
  }

  try {
    const response = await generateContentWithFallback(client, {
      contents: prompt
    });
    res.json({ copy: response.text });
  } catch (err) {
    console.error("Error generating reels copy with Gemini:", err);
    res.status(500).json({ error: "Fallo al generar copy con IA" });
  }
});

export default router;
