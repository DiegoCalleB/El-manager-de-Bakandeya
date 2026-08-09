import React from 'react';
import { Lead } from '../../types';

export type LeadTemperature = 'caliente' | 'seguimiento' | 'frio' | 'neutral';

export interface LeadHealthInfo {
  type: LeadTemperature;
  label: string;
  badgeClass: string;
  icon: string;
  description: string;
}

export function getLeadHealth(lead: Lead): LeadHealthInfo {
  const now = new Date();
  
  // Detect latest activity date
  let lastActivityDate: Date | null = null;
  
  if (lead.fecha_ultima_respuesta) {
    const d = new Date(lead.fecha_ultima_respuesta);
    if (!isNaN(d.getTime())) lastActivityDate = d;
  }
  
  if (lead.historial_contacto && lead.historial_contacto.length > 0) {
    for (const log of lead.historial_contacto) {
      const logD = new Date(log.fecha);
      if (!isNaN(logD.getTime()) && (!lastActivityDate || logD > lastActivityDate)) {
        lastActivityDate = logD;
      }
    }
  }

  let daysSinceLastActivity: number | null = null;
  if (lastActivityDate) {
    daysSinceLastActivity = Math.max(0, Math.floor((now.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24)));
  }

  let daysSincePitch: number | null = null;
  if (lead.fecha_envio) {
    const pitchD = new Date(lead.fecha_envio);
    if (!isNaN(pitchD.getTime())) {
      daysSincePitch = Math.max(0, Math.floor((now.getTime() - pitchD.getTime()) / (1000 * 60 * 60 * 24)));
    }
  }

  // 1. 🔥 Lead Caliente: Sala que respondió o tuvo contacto en los últimos 3 días O en negociación / interesado activo
  if (
    (daysSinceLastActivity !== null && daysSinceLastActivity <= 3) ||
    lead.estado === 'interesado' ||
    lead.estado === 'negociando'
  ) {
    const desc = daysSinceLastActivity !== null 
      ? (daysSinceLastActivity === 0 ? 'Actividad hoy' : `Actividad hace ${daysSinceLastActivity}d`)
      : 'Negociación / Respuesta activa';
    return {
      type: 'caliente',
      label: '🔥 Lead Caliente',
      badgeClass: 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold',
      icon: '🔥',
      description: desc
    };
  }

  // 2. ⏳ Seguimiento Necesario: Más de 7 días sin respuesta tras enviar el pitch
  if (
    lead.estado === 'esperando_respuesta' ||
    (lead.fecha_envio && !lead.fecha_ultima_respuesta && lead.estado !== 'no_interesado')
  ) {
    const days = daysSincePitch ?? daysSinceLastActivity ?? 7;
    if (days >= 7) {
      return {
        type: 'seguimiento',
        label: '⏳ Seguimiento Necesario',
        badgeClass: 'bg-amber-500/20 text-amber-400 border border-amber-500/50 font-bold',
        icon: '⏳',
        description: `Enviado hace ${days}d sin respuesta`
      };
    }
  }

  // 3. 🧊 Lead Frío: Más de 14 días sin interacción registrada / sin respuesta
  if (
    (daysSinceLastActivity !== null && daysSinceLastActivity >= 14) ||
    (daysSincePitch !== null && daysSincePitch >= 14)
  ) {
    const days = daysSinceLastActivity ?? daysSincePitch ?? 14;
    return {
      type: 'frio',
      label: '🧊 Lead Frío',
      badgeClass: 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-medium',
      icon: '🧊',
      description: `Sin interacción desde hace ${days}d`
    };
  }

  // Default / Nuevo / Pendiente
  return {
    type: 'neutral',
    label: '✨ Activo',
    badgeClass: 'bg-zinc-800/80 text-zinc-300 border border-zinc-700/60 font-medium',
    icon: '✨',
    description: 'En seguimiento regular'
  };
}

interface LeadHealthBadgeProps {
  lead: Lead;
  showDescription?: boolean;
  size?: 'sm' | 'md';
}

export const LeadHealthBadge: React.FC<LeadHealthBadgeProps> = ({
  lead,
  showDescription = false,
  size = 'md'
}) => {
  const health = getLeadHealth(lead);

  return (
    <div className="inline-flex flex-col items-start gap-0.5">
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] sm:text-xs shadow-xs ${health.badgeClass}`}
        title={health.description}
      >
        <span>{health.label}</span>
      </span>
      {showDescription && (
        <span className="text-[10px] text-zinc-400 font-mono tracking-tight pl-1">
          {health.description}
        </span>
      )}
    </div>
  );
};
