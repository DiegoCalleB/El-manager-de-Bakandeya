import { Lead, BandContact } from '../types';

/**
 * Calculates a 0-100% reliability score based on the lead/contact info quality.
 */
export function calculateLeadReliability(item: Lead | BandContact): { score: number; details: string[] } {
  let score = 0;
  const details: string[] = [];

  const name = 'nombre_sala' in item ? item.nombre_sala : item.nombre_banda;
  const email = 'email_contacto' in item ? item.email_contacto : item.email;
  const phone = item.telefono;
  const website = item.website;
  const instagram = item.instagram;
  const contactName = 'contacto_nombre' in item ? item.contacto_nombre : item.contacto_nombre;
  const city = 'ciudad' in item ? item.ciudad : item.localizacion;

  // Basic Identity (+20%)
  if (name && name.trim().length > 2) {
    score += 20;
    details.push('Nombre validado');
  }

  // Location (+10%)
  if (city && city.trim().length > 2) {
    score += 10;
    details.push('Ubicación confirmada');
  }

  // Valid Direct Contact Email (+25%)
  if (email && email.includes('@') && email.includes('.')) {
    const isGeneric = /info@|contacto@|admin@|general@|soporte@/i.test(email);
    if (isGeneric) {
      score += 15;
      details.push('Email de contacto (Genérico)');
    } else {
      score += 25;
      details.push('Email de contacto directo nominativo');
    }
  }

  // Phone (+20%)
  if (phone) {
    const digits = phone.replace(/\D/g, '');
    if (digits.length >= 9) {
      score += 20;
      details.push('Teléfono de contacto directo');
    }
  }

  // Digital Presence (Website / IG) (+15%)
  if (website && (website.startsWith('http') || website.includes('.'))) {
    score += 10;
    details.push('Web oficial activa');
  }
  if (instagram && (instagram.includes('instagram.com') || instagram.startsWith('@') || instagram.length > 2)) {
    score += 5;
    details.push('Perfil de Instagram');
  }

  // Personal Contact Person (+10%)
  if (contactName && contactName.trim().length > 2) {
    score += 10;
    details.push('Persona de contacto asignada');
  }

  // Verification status boost (+15% if active lead conversation is detected)
  if ('estado' in item) {
    if (item.estado === 'interesado' || item.estado === 'negociando' || (item.hilo_emails && item.hilo_emails.length > 0)) {
      score = Math.min(100, score + 15);
      details.push('Conversación/Interacción directa verificada');
    }
  }

  return {
    score: Math.min(100, Math.max(10, score)),
    details
  };
}

/**
 * Checks if a lead or band contact should be classified as a "Lead Verificado"
 * (verified when active conversation/negotiation with a venue is happening thanks to IA contact discovery).
 */
export function isLeadVerificado(item: Lead | BandContact): boolean {
  if (item.es_verificado) return true;
  
  // For Lead
  if ('estado' in item) {
    if (item.estado === 'interesado' || item.estado === 'negociando') return true;
    if (item.hilo_emails && item.hilo_emails.length > 0) return true;
    if (item.fecha_ultima_respuesta && item.fecha_ultima_respuesta.length > 0) return true;
  }

  // For BandContact
  if ('estado_relacion' in item) {
    if (item.estado_relacion === 'concierto_agendado' || item.estado_relacion === 'intercambio_propuesto' || item.estado_relacion === 'colegas_aliados') {
      return true;
    }
  }

  return false;
}
