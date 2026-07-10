export type LeadStatus = 'nuevo' | 'pendiente_aprobacion' | 'aprobado' | 'esperando_respuesta' | 'interesado' | 'no_interesado' | 'negociando';

export interface Lead {
  id: string;
  nombre_sala: string;
  ciudad: string;
  region: string;
  aforo: number;
  genero: string;
  email_contacto: string;
  telefono: string;
  instagram: string;
  fuente: string;
  estado: LeadStatus;
  pitch_generado: string;
  fecha_envio?: string;
  fecha_ultima_respuesta?: string;
  notas: string;
}

export interface Rehearsal {
  id: string;
  fecha: string;
  hora: string;
  lugar: string;
  asistentes: string[];
  notas: string;
  estado: 'programado' | 'cancelado' | 'completado';
}

export interface Concert {
  id: string;
  fecha: string;
  ciudad: string;
  sala: string;
  cache: number;
  aforo_vendido: number;
  aforo_total: number;
  contrato_firmado: boolean;
  estado_pago: 'pendiente' | 'pagado' | 'anticipo';
  notas: string;
  tipo: 'sala' | 'festival' | 'ayuntamiento';
}

export interface SocialPost {
  id: string;
  fecha: string;
  plataforma: 'Instagram' | 'TikTok' | 'YouTube' | 'Facebook';
  contenido: string;
  estado: 'borrador' | 'aprobado' | 'publicado';
  responsable: string;
}

export interface Payment {
  id: string;
  tipo: 'ingreso' | 'gasto';
  categoria: 'concierto' | 'merchandising' | 'subvencion' | 'transporte' | 'alojamiento' | 'comida' | 'promo' | 'otros';
  concepto: string;
  importe: number;
  fecha: string;
  estado: 'pendiente' | 'pagado';
}

export interface Message {
  id: string;
  remitente: string;
  mensaje: string;
  fecha: string;
  leido: boolean;
}

export type ThemeName = 'backstage_neon' | 'roots_ska' | 'indie_velvet' | 'brutalist_fuzz';

export interface ThemeColors {
  name: string;
  bg: string;
  card: string;
  border: string;
  primary: string;
  primaryHover: string;
  text: string;
  textMuted: string;
  accent: string;
  accentBg: string;
  badgeGreen: string;
  badgeYellow: string;
  badgeRed: string;
  badgeBlue: string;
  neonShadow: string;
}
