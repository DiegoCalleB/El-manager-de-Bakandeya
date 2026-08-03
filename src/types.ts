export type LeadStatus = 'nuevo' | 'pendiente_aprobacion' | 'aprobado' | 'esperando_respuesta' | 'interesado' | 'no_interesado' | 'negociando';

export type LeadType = 'sala' | 'festival' | 'ayuntamiento' | 'grupo' | 'productora' | 'medio' | 'discoteca';

export type BandRelationshipStatus = 
  | 'sin_contactar' 
  | 'intercambio_propuesto' 
  | 'concierto_agendado' 
  | 'colegas_aliados' 
  | 'pendiente_respuesta' 
  | 'no_disponible';

export interface BandContact {
  id: string;
  nombre_banda: string;
  estilo_musical: string;
  localizacion: string;
  estado_relacion: BandRelationshipStatus;
  ultimo_contacto: string; // YYYY-MM-DD or relative string
  contacto_nombre?: string;
  email?: string;
  telefono?: string;
  instagram?: string;
  spotify_youtube?: string;
  aforo_promedio?: number;
  notas_colaboracion?: string;
  ciudad_origen_swap?: string;
}

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
  direccion?: string;
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
  setlistId?: string;
}

export interface Concert {
  id: string;
  fecha: string;
  ciudad: string;
  sala: string;
  direccion?: string;
  cache: number;
  aforo_vendido: number;
  aforo_total: number;
  contrato_firmado: boolean;
  estado_pago: 'pendiente' | 'pagado' | 'anticipo';
  notas: string;
  tipo: 'sala' | 'festival' | 'ayuntamiento';
  setlistId?: string;
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

export interface Song {
  id: string;
  titulo: string;
  duracion: string; // e.g. "3:45"
  duracionSegundos: number; // e.g. 225
  tonalidad: string; // e.g. "Am", "G", "C#m"
  bpm: number; // e.g. 128
  afinacion?: string; // e.g. "E Standard", "Drop D"
  albumDisco?: string; // e.g. "Álbum Debut (2025)", "EP Cacharros", "Single", "Inédita / En Proceso"
  estadoTema?: 'listo' | 'ensayando' | 'componiendo' | 'descartado';
  esVersionCovers?: boolean;
  enlaceAcordes?: string; // Link to drive/chords/partitura
  notasInternas?: string;
}

export interface SetlistItem {
  id: string;
  songId?: string; // null if speech/pause/break
  tipoItem: 'cancion' | 'chapa' | 'descanso' | 'bis';
  tituloCustom?: string;
  duracionEstimadaMinutos?: number;
  notaTema?: string;
}

export interface Setlist {
  id: string;
  nombre: string;
  descripcion?: string;
  tipoFormato: 'festival' | 'sala_larga' | 'acustico' | 'ensayo' | 'otro';
  duracionTotalEstimadaMinutos?: number;
  items: SetlistItem[];
  fechaCreacion: string;
  fechaUltimaEdicion: string;
}

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

export interface TourRouteStop {
  id: string;
  concertId?: string;
  ciudad: string;
  sala: string;
  fecha: string;
  distanciaAnteriorKm?: number;
  tiempoConduccionHoras?: number;
  gastosAlojamiento?: number;
  gastosGasolina?: number;
  gastosDietas?: number;
  notasLogisticas?: string;
}

export interface Tour {
  id: string;
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  vehiculo: string;
  presupuestoLogistica?: number;
  stops: TourRouteStop[];
  estado: 'planificacion' | 'confirmada' | 'completada' | 'cancelada';
}
