// Google Sheets & Lead workflow domain rules

import { Lead, LeadStatus } from '../types';

export const VALID_LEAD_STATUSES: LeadStatus[] = [
  'nuevo',
  'pendiente_aprobacion',
  'aprobado',
  'esperando_respuesta',
  'interesado',
  'no_interesado',
  'negociando'
];

/**
 * Validates if a state transition is allowed in the approval / CRM pipeline.
 * Rule: 
 * From 'pendiente_aprobacion': can go to 'aprobado' or 'nuevo' (rejected with note)
 * Other manual CRM status corrections allowed: interested, negotiating, closed, etc.
 */
export function isValidStatusTransition(currentStatus: LeadStatus, targetStatus: LeadStatus): boolean {
  if (currentStatus === targetStatus) return true;

  if (currentStatus === 'pendiente_aprobacion') {
    // Only 'aprobado' or 'nuevo' are valid directly from pending approval panel
    return targetStatus === 'aprobado' || targetStatus === 'nuevo';
  }

  // General CRM transitions between active states
  return VALID_LEAD_STATUSES.includes(targetStatus);
}

/**
 * Concurrency check: returns error message if lead status in Sheets has changed parallelly
 */
export function validateLeadConcurrency(
  leadInDatabase: Lead,
  expectedStatus?: string
): { isConflict: boolean; message?: string } {
  if (expectedStatus && leadInDatabase.estado !== expectedStatus) {
    return {
      isConflict: true,
      message: `El lead "${leadInDatabase.nombre_sala}" cambió de estado en Google Sheets (de '${expectedStatus}' a '${leadInDatabase.estado}') antes de tu guardado.`
    };
  }
  return { isConflict: false };
}

/**
 * Filters leads by search query, status, city, or source
 */
export function filterLeads(
  leads: Lead[],
  filter: {
    status?: string;
    city?: string;
    searchQuery?: string;
    fuente?: string;
  }
): Lead[] {
  return leads.filter(lead => {
    if (filter.status && filter.status !== 'todos' && lead.estado !== filter.status) {
      return false;
    }

    if (filter.city && filter.city !== 'todas' && lead.ciudad?.toLowerCase() !== filter.city.toLowerCase()) {
      return false;
    }

    if (filter.fuente && filter.fuente !== 'todas' && lead.fuente !== filter.fuente) {
      return false;
    }

    if (filter.searchQuery && filter.searchQuery.trim() !== '') {
      const q = filter.searchQuery.toLowerCase();
      const matchName = lead.nombre_sala?.toLowerCase().includes(q);
      const matchCity = lead.ciudad?.toLowerCase().includes(q);
      const matchEmail = lead.email_contacto?.toLowerCase().includes(q);
      const matchGenre = lead.genero?.toLowerCase().includes(q);
      if (!matchName && !matchCity && !matchEmail && !matchGenre) {
        return false;
      }
    }

    return true;
  });
}
