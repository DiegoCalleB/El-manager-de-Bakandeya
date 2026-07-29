export type LeadStatus = 'nuevo' | 'pendiente_aprobacion' | 'aprobado' | 'esperando_respuesta' | 'interesado' | 'no_interesado' | 'negociando';

export type LeadType = 'sala' | 'festival' | 'ayuntamiento' | 'grupo' | 'productora' | 'medio';

export interface EmailMessage {
  id: string;
  fecha: string;
  remitente: 'sala' | 'banda';
  remitente_nombre: string;
  asunto: string;
  mensaje: string;
}

export interface Lead {
  id: string;
  nombre_sala: string;
  ciudad: string;
  region: string;
  aforo: number;
  genero: string;
  tipo?: LeadType | string;
  email_contacto: string;
  telefono: string;
  website?: string;
  instagram: string;
  contacto_nombre?: string;
  fuente: string;
  estado: LeadStatus;
  pitch_generado: string;
  fecha_envio?: string;
  fecha_ultima_respuesta?: string;
  contexto_extra?: string;
  notas: string;
  hilo_emails?: EmailMessage[];
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

export interface SocialMetric {
  id: string;
  fecha: string;
  instagram: number;
  tiktok: number;
  youtube: number;
  notas: string;
}

export type UserRole = 'leader' | 'member';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  instrument?: string;
  avatarColor?: string;
  createdAt: string;
}

export interface UserWithHash extends User {
  passwordHash: string;
  salt: string;
}

export type ThemeName = 'stitch_light' | 'stitch_dark' | 'backstage_neon' | 'roots_ska' | 'indie_velvet' | 'brutalist_fuzz';

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
  fontDisplay: string;
  fontSans: string;
}
