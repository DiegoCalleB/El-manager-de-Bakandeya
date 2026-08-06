import { Lead, LeadStatus, LeadType } from '../types';

export interface BookingMetrics {
  totalLeads: number;
  leadsPorEstado: Record<string, number>;
  tasaRespuesta: number;
  tasaConversion: number;
  aforoTotalPotencial: number;
  aforoPromedio: number;
}

// Helper to normalize status strings from Excel or UI
export const normalizeStatus = (s: any): LeadStatus => {
  if (!s) return 'nuevo';
  const str = String(s).trim().toLowerCase();
  if (str === 'nuevo' || str.includes('contactar') || str === 'new' || str === 'por_contactar') return 'nuevo';
  if (str === 'pendiente_aprobacion' || str.includes('aprobar') || str === 'pendiente' || str === 'por_aprobar') return 'pendiente_aprobacion';
  if (str === 'aprobado' || str.includes('listo') || str === 'aprobados') return 'aprobado';
  if (str === 'esperando_respuesta' || str.includes('enviado') || str.includes('esperando') || str === 'enviados') return 'esperando_respuesta';
  if (str.includes('interesado') && !str.includes('no')) return 'interesado';
  if (str.includes('negociando')) return 'negociando';
  if (str.includes('no') || str === 'no_interesado' || str.includes('rechazado')) return 'no_interesado';
  return 'nuevo';
};

// Helper to normalize lead types
export const normalizeType = (t: any): LeadType => {
  if (!t) return 'sala';
  const s = String(t).trim().toLowerCase();
  if (s.includes('festiv') || s === 'festival') return 'festival';
  if (s.includes('ayunt') || s.includes('fiesta') || s.includes('municip') || s === 'ayuntamiento') return 'ayuntamiento';
  if (s.includes('disco') || s.includes('club') || s.includes('nightclub') || s === 'discoteca') return 'discoteca';
  if (s.includes('grup') || s.includes('artist') || s.includes('banda') || s === 'grupo') return 'grupo';
  if (s.includes('product') || s.includes('agencia') || s.includes('manag') || s === 'productora') return 'productora';
  if (s.includes('medio') || s.includes('radio') || s.includes('prensa') || s.includes('tv') || s.includes('podc') || s === 'medio') return 'medio';
  return 'sala';
};

// Known Spanish venues address database for intelligent address enrichment
export const VENUE_ADDRESS_DATABASE: Record<string, string> = {
  'sala trinchera': 'Calle Parauta, 25, 29006 Málaga',
  'trinchera': 'Calle Parauta, 25, 29006 Málaga',
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
  'cabo de plata': 'Playa de la Hierbabuena, 11160 Barbate, Cádiz'
};

export function autoDetectVenueAddress(nombreSala: string, ciudad: string): string {
  if (!nombreSala) return '';
  const cleanName = nombreSala.toLowerCase().trim();
  for (const [key, addr] of Object.entries(VENUE_ADDRESS_DATABASE)) {
    if (cleanName.includes(key) || key.includes(cleanName)) {
      return addr;
    }
  }
  return '';
}

/**
 * Calculates metrics and stats for the booking sales pipeline
 */
export function calculateBookingMetrics(leads: Lead[]): BookingMetrics {
  const totalLeads = leads.length;
  if (totalLeads === 0) {
    return {
      totalLeads: 0,
      leadsPorEstado: {},
      tasaRespuesta: 0,
      tasaConversion: 0,
      aforoTotalPotencial: 0,
      aforoPromedio: 0,
    };
  }

  const leadsPorEstado: Record<string, number> = {};
  let sumAforo = 0;
  let respondedCount = 0;
  let convertedCount = 0;

  for (const lead of leads) {
    const estado = lead.estado || 'nuevo';
    leadsPorEstado[estado] = (leadsPorEstado[estado] || 0) + 1;
    sumAforo += lead.aforo || 0;

    if (['interesado', 'negociando', 'aprobado', 'no_interesado'].includes(estado) || lead.fecha_ultima_respuesta) {
      respondedCount++;
    }

    if (estado === 'aprobado') {
      convertedCount++;
    }
  }

  const tasaRespuesta = Number(((respondedCount / totalLeads) * 100).toFixed(1));
  const tasaConversion = Number(((convertedCount / totalLeads) * 100).toFixed(1));
  const aforoPromedio = Math.round(sumAforo / totalLeads);

  return {
    totalLeads,
    leadsPorEstado,
    tasaRespuesta,
    tasaConversion,
    aforoTotalPotencial: sumAforo,
    aforoPromedio,
  };
}

/**
 * Filters leads by text search query, status, and category type
 */
export function filterLeads(
  leads: Lead[],
  searchQuery: string = '',
  statusFilter: string = 'todos',
  typeFilter: string = 'todos'
): Lead[] {
  const query = searchQuery.toLowerCase().trim();

  return leads.filter((lead) => {
    const matchesSearch =
      !query ||
      lead.nombre_sala.toLowerCase().includes(query) ||
      lead.ciudad.toLowerCase().includes(query) ||
      (lead.contacto_nombre && lead.contacto_nombre.toLowerCase().includes(query)) ||
      (lead.email_contacto && lead.email_contacto.toLowerCase().includes(query));

    const matchesStatus = statusFilter === 'todos' || lead.estado === statusFilter;
    const matchesType = typeFilter === 'todos' || lead.tipo === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });
}

/**
 * Computes a quality score (0-100) for a lead based on venue data richness
 */
export function calculateLeadScore(lead: Lead): number {
  let score = 30; // base score

  if (lead.email_contacto) score += 15;
  if (lead.telefono) score += 10;
  if (lead.contacto_nombre) score += 10;
  if (lead.instagram) score += 10;
  if (lead.website) score += 5;
  if (lead.aforo > 100) score += 10;
  if (lead.hilo_emails && lead.hilo_emails.length > 0) score += 10;

  return Math.min(100, score);
}
