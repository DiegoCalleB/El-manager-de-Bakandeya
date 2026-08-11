import fs from "fs";
import path from "path";

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

export interface TemplateFeedbackLog {
  timestamp: string;
  toneRating?: number;
  contentRating?: number;
  comment?: string;
  source?: string; // 'manager_ui' | 'python_agent' | 'web_sandbox'
  leadName?: string;
}

export interface CategoryTemplateConfig {
  category: string; // 'salas' | 'festivales' | 'discotecas' | 'medios' | 'grupos' | 'managements'
  title: string;
  subject: string;
  body: string;
  guidelines: string;
  toneRating: number;
  contentRating: number;
  customInstruction: string;
  feedbackLogs: TemplateFeedbackLog[];
  updatedAt: string;
}

export const DEFAULT_CATEGORY_TEMPLATES: Record<string, CategoryTemplateConfig> = {
  salas: {
    category: "salas",
    title: "Salas y Teatros de Conciertos",
    subject: "Propuesta de concierto 2026: Bakandeya en {{nombre_sala}}",
    body: `Hola equipo de booking de {{nombre_sala}},

Nos dirigimos a vosotros desde Bakandeya, proyecto independiente de música en directo (balkan-ska, reggae y electrónica con violín enérgico en directo).

Seguimos la programación de {{nombre_sala}} y creemos que nuestro directo encaja perfectamente con vuestra línea artística. Ofrecemos un espectáculo bailable de 90 minutos probado en múltiples salas y festivales de la península.

Detalles técnicos y de producción:
- Formato compacto (cuarteto: violín, sintetizadores/loops, percusión/batería y bajo/voz).
- Sin sección de vientos (logística ágil y prueba de sonido rápida).
- Material promocional, vídeos en directo y dossier: https://youtube.com/bakandeya_live

Nos gustaría consultar vuestra disponibilidad de fechas para el segundo semestre de 2026 y valorar propuesta de condiciones (alquiler, taquilla compartida o caché).

Quedamos a vuestra disposición. Un saludo cordial,
Bakandeya Agent Manager IA`,
    guidelines: "Tono profesional, cercano y apasionado por el directo. Enfócate en la facilidad logística del cuarteto, la rápida prueba de sonido y la energía del violín en vivo. Adapta el mensaje al aforo y estilo de la sala.",
    toneRating: 5,
    contentRating: 5,
    customInstruction: "",
    feedbackLogs: [
      {
        timestamp: new Date().toISOString(),
        toneRating: 5,
        contentRating: 5,
        comment: "Mencionamos explícitamente el cuarteto y la agilidad logística sin vientos.",
        source: "system"
      }
    ],
    updatedAt: new Date().toISOString()
  },
  festivales: {
    category: "festivales",
    title: "Festivales de Música",
    subject: "Propuesta de contratación para cartel 2026: Bakandeya (Balkan-Ska Live Set)",
    body: `Estimada organización de {{nombre_sala}},

Escribimos en representación de Bakandeya para presentar nuestra propuesta artística de cara a la próxima edición de vuestro festival.

Bakandeya es un proyecto de alto impacto para escenarios de festivales, combinando la fuerza del balkan-ska, roots reggae, violín solista e impulsos electrónicos pensados para horarios de máxima afluencia y ambiente festivo.

Puntos clave de la propuesta:
- Espectáculo participativo de 90 minutos que mantiene al público bailando de principio a fin.
- Montaje técnico limpio y adaptable a cambios rápidos de escenario entre bandas.
- Vídeos de directo y dossier completo: https://youtube.com/bakandeya_live

Estaríamos encantados de enviaros nuestro rider técnico y propuesta económica para vuestra consideración.

Atentamente,
Bakandeya Agent Manager IA`,
    guidelines: "Tono enérgico, enfocado al impacto en festival y grandes aforos. Destaca el ritmo bailable, la conexión con el público y la rapidez en cambios de escenario.",
    toneRating: 5,
    contentRating: 5,
    customInstruction: "",
    feedbackLogs: [],
    updatedAt: new Date().toISOString()
  },
  discotecas: {
    category: "discotecas",
    title: "Discotecas y Clubbing Nocturno",
    subject: "Propuesta Electro-Balkan Live Set: Bakandeya en {{nombre_sala}}",
    body: `Hola equipo de programación de {{nombre_sala}},

Os escribimos desde Bakandeya para presentar nuestro formato especial "Electro-Balkan Live Set", diseñado para la sesión nocturna de clubes y discotecas.

A diferencia de un grupo acústico tradicional, nuestro formato integra secuencias electrónicas, sintetizadores analógicos, percusión en vivo y violín solista, creando un puente perfecto entre la música en directo y la pista de baile en horario de madrugada.

- Formato ideal para sesiones entre DJs o como show principal de la noche.
- Escucha y vídeos en directo: https://youtube.com/bakandeya_live

¿Tenéis fechas disponibles para este trimestre para coordinar una sesión?

Saludos cordiales,
Bakandeya Agent Manager IA`,
    guidelines: "Tono moderno, enfocado a clubes y discotecas de noche. Resalta que no somos un grupo tradicional sino un Live Set electrónico bailable perfecto para la madrugada.",
    toneRating: 5,
    contentRating: 5,
    customInstruction: "",
    feedbackLogs: [],
    updatedAt: new Date().toISOString()
  },
  medios: {
    category: "medios",
    title: "Medios de Comunicación, Radio y Prensa",
    subject: "[Nota de Prensa / Dossier] Bakandeya presenta su nuevo videoclip y gira 2026",
    body: `Hola equipo de redacción de {{nombre_sala}},

Nos ponemos en contacto desde Bakandeya, proyecto independiente de fusión balkan-ska, roots reggae, violín enérgico y electrónica analógica.

Les remitimos nuestro último comunicado de prensa y dossier promocional con motivo del lanzamiento de nuestro nuevo videoclip y la gira de conciertos 2026. Nos encantaría enviarles el tema en calidad broadcast para sonar en su programa/radio, o ponernos a su disposición para entrevistas, acústicos en directo o reseñas.

Dossier y videoclip oficial: https://youtube.com/bakandeya_live
Material en alta resolución (fotos, bio y audio): {{website}}

Muchas gracias por su apoyo a la difusión de la música independiente,
Bakandeya Agent Manager IA`,
    guidelines: "Tono periodístico, profesional y directo para medios de comunicación (Radio 3, podcasts, prensa escrita, blogs). Dirígete al redactor, locutor o equipo de prensa. Destaca el violín y la electrónica. IMPORTANTE: No pidas fechas de conciertos ni taquillas.",
    toneRating: 5,
    contentRating: 5,
    customInstruction: "",
    feedbackLogs: [],
    updatedAt: new Date().toISOString()
  },
  grupos: {
    category: "grupos",
    title: "Grupos y Bandas para Intercambio de Fechas",
    subject: "Propuesta de concierto compartido e intercambio de fechas: Bakandeya x {{nombre_sala}}",
    body: `¡Buenas chavales de {{nombre_sala}}!

Os escribimos desde Bakandeya, banda de balkan-ska, violín enérgico y electrónica de Madrid/Sevilla. Nos mola mucho vuestro proyecto y creemos que nuestros estilos conectan genial en directo.

Queremos proponer un INTERCAMBIO DE FECHAS / CO-BOOKING para esta temporada:
1. Os invitamos a tocar con nosotros en nuestra ciudad (Madrid/Sevilla) compartiendo escenario y taquilla.
2. Vosotros nos invitáis a tocar en {{ciudad}} en vuestro espacio habitual.

Así aseguramos llenar las dos salas sumando ambos públicos y compartimos gastos de viaje y backline.

Podéis escuchar lo que hacemos aquí: https://youtube.com/bakandeya_live

¿Cómo lo veis? ¿Hablamos por WhatsApp o hacemos llamada esta semana?

¡Un abrazo!
Bakandeya Agent Manager IA`,
    guidelines: "Tono de músico a músico: cercano, colega, directo y colaborativo. Propón claramente la estrategia de ganar-ganar (date swap), compartir público local, compartir backline y abaratar gastos de furgoneta.",
    toneRating: 5,
    contentRating: 5,
    customInstruction: "",
    feedbackLogs: [],
    updatedAt: new Date().toISOString()
  },
  managements: {
    category: "managements",
    title: "Agencias de Management y Booking",
    subject: "Propuesta de colaboración / Roster: Bakandeya (Balkan-Ska Electro-Live)",
    body: `Estimado equipo de {{nombre_sala}},

Nos dirigimos a vuestra agencia para presentar la propuesta artística de Bakandeya con vista a posibles colaboraciones, coproducciones o inclusión en vuestro catálogo de booking para giras y festivales 2026.

Bakandeya es un proyecto consolidado que fusiona balkan-ska, reggae, violín solista y sintetizadores analógicos. Destacamos por una logística ágil (cuarteto compacto sin sección de vientos), alta rentabilidad en venta de entradas y un directo arrollador probado en salas y festivales.

Dossier corporativo y resumen en vídeo: https://youtube.com/bakandeya_live

Estaríamos encantados de agendar una breve reunión telefónica para valorar posibles sinergias.

Atentamente,
Bakandeya Agent Manager IA`,
    guidelines: "Tono ejecutivo-musical profesional para mánagers, agencias y agentes de booking. Destaca la profesionalidad técnica, el atractivo comercial, la sencillez logística del cuarteto y los datos positivos de aforo.",
    toneRating: 5,
    contentRating: 5,
    customInstruction: "",
    feedbackLogs: [],
    updatedAt: new Date().toISOString()
  }
};

/**
 * Ensures state has categoryTemplates initialized and updated
 */
export function ensureCategoryTemplatesInState(state: any): Record<string, CategoryTemplateConfig> {
  if (!state.categoryTemplates) {
    state.categoryTemplates = JSON.parse(JSON.stringify(DEFAULT_CATEGORY_TEMPLATES));
  } else {
    // Ensure all 6 categories exist
    for (const [catKey, defaultVal] of Object.entries(DEFAULT_CATEGORY_TEMPLATES)) {
      if (!state.categoryTemplates[catKey]) {
        state.categoryTemplates[catKey] = JSON.parse(JSON.stringify(defaultVal));
      }
    }
  }
  return state.categoryTemplates;
}

/**
 * Generates and writes PROMPTS_AGENTES_IA.md at workspace root
 */
export function updatePromptsMarkdownFile(categoryTemplatesMap: Record<string, CategoryTemplateConfig>, globalLeadsFeedbackSummary: string = ""): void {
  try {
    const markdownPath = path.join(process.cwd(), "PROMPTS_AGENTES_IA.md");
    
    let content = `# 🤖 MEMORIA Y DIRECCIÓN DE PROMPTS PARA AGENTES IA (BAKANDEYA)

> **Documento Central de Memoria y Aprendizaje Multiautónomo**
> Este archivo se actualiza en tiempo real cada vez que el mánager realiza ajustes, guarda plantillas o califica la redacción en la web.
> **Todos los Agentes Redactores (Python y Node.js)** deben consultar este archivo para redactar correos perfeccionados según el feedback acumulado.

---

## 🎵 Identidad Artística de Bakandeya
- **Estilo Musical**: Balkan-Ska-Reggae con Violín Solista, Percusión en Vivo y Electrónica Analógica.
- **Formato**: Cuarteto compacto (violín, sintetizadores/loops, batería/percusión, bajo/voz).
- **Regla de Oro**: **NUNCA mencionar instrumentos de viento** (trompetas, saxos, trombones) ni atribuirlos a la banda.
- **Fortalezas**: Alta energía bailable, logística ligera, montaje rápido y potente conexión en directo.

---

## 📊 Historial General de Aprendizajes y Feedback del Mánager
${globalLeadsFeedbackSummary ? globalLeadsFeedbackSummary : "Sin correcciones adicionales registradas en los contactos."}

---

## 📁 Pautas, Plantillas y Calificaciones por Categoría
`;

    for (const [key, cfg] of Object.entries(categoryTemplatesMap)) {
      const logsText = cfg.feedbackLogs && cfg.feedbackLogs.length > 0
        ? cfg.feedbackLogs.map((log, i) => {
            const toneStr = log.toneRating ? `Tono: ${log.toneRating}/5 ⭐` : "";
            const contentStr = log.contentRating ? `Contenido: ${log.contentRating}/5 ⭐` : "";
            const ratingPart = [toneStr, contentStr].filter(Boolean).join(" | ");
            return `  ${i + 1}. [${new Date(log.timestamp).toLocaleDateString()}] ${ratingPart ? `(${ratingPart})` : ""} ${log.comment || "Sin comentario"}`;
          }).join("\n")
        : "  - Sin valoraciones específicas acumuladas aún.";

      content += `
### ${cfg.title || key.toUpperCase()} (\`${key}\`)
- **Última Actualización**: ${cfg.updatedAt ? new Date(cfg.updatedAt).toLocaleString("es-ES") : "Reciente"}
- **Valoración de Tono y Estilo**: ${cfg.toneRating || 5} / 5 ⭐
- **Valoración de Contenido y Estructura**: ${cfg.contentRating || 5} / 5 ⭐
${cfg.customInstruction ? `- **Instrucción Especial Reciente del Mánager**: "${cfg.customInstruction}"\n` : ""}
#### 💡 Pautas de Redacción IA para Agentes:
\`\`\`text
${cfg.guidelines}
\`\`\`

#### ✉️ Asunto por Defecto:
\`${cfg.subject}\`

#### 📜 Cuerpo de la Plantilla Base:
\`\`\`text
${cfg.body}
\`\`\`

#### 📝 Historial de Aprendizajes de la Categoría:
${logsText}

---
`;
    }

    content += `\n*Generado automáticamente por Bakandeya Intelligence System - ${new Date().toISOString()}*\n`;

    fs.writeFileSync(markdownPath, content, "utf-8");
    console.log("Updated PROMPTS_AGENTES_IA.md successfully!");
  } catch (err) {
    console.error("Error writing PROMPTS_AGENTES_IA.md:", err);
  }
}
