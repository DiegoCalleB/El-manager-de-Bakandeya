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
  band_id?: string;
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
  icono?: string;
  imagen_url?: string;
}

export interface InteractionLog {
  id: string;
  fecha: string;
  tipo: 'Llamada' | 'WhatsApp' | 'Email' | 'Reunión' | 'Otro';
  autor?: string;
  notas: string;
  resultado?: 'Interesado' | 'Enviar propuesta' | 'Seguimiento pendiente' | 'Rechazado' | 'Info recibida' | 'Acuerdo cerrado';
}

export interface SavedFilter {
  id: string;
  nombre: string;
  sectionTab?: 'salas' | 'medios' | 'grupos';
  searchTerm?: string;
  selectedCityFilter?: string;
  statusFilter?: LeadStatus | 'todos';
  typeFilter?: LeadType | 'todos';
  minCapacityFilter?: number;
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
  historial_contacto?: InteractionLog[];
  icono?: string;
  imagen_url?: string;
  band_id?: string;
}

export interface Rehearsal {
  id: string;
  band_id?: string;
  fecha: string;
  hora: string;
  lugar: string;
  asistentes: string[];
  notas: string;
  estado: 'programado' | 'cancelado' | 'completado';
  setlistId?: string;
}

export interface ConcertExpenseBreakdown {
  gasolina?: number;
  dietas?: number;
  alquilerVehiculo?: number;
  alojamiento?: number;
  otros?: number;
  notasGastos?: string;
}

export interface Concert {
  id: string;
  band_id?: string;
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
  gastosDetalle?: ConcertExpenseBreakdown;
  gastosEstimadosTipicos?: number;
}

export interface EPKConfig {
  biografia: string;
  logoUrl: string;
  dossierPdfUrl?: string;
  dossierPdfName?: string;
  dossierDocumentUrl?: string;
  dossierDocumentName?: string;
  dossierTextoExtra?: string;
  bandPhotos: string[];
  riderTecnico: string;
  riderPdfUrl?: string;
  riderPdfName?: string;
  enlacesRedes: {
    spotify?: string;
    youtube?: string;
    instagram?: string;
    tiktok?: string;
    website?: string;
  };
  contactoBooking: {
    nombre: string;
    email: string;
    telefono: string;
  };
  temasDestacadosIds: string[];
  incentivoFans?: {
    mensajeAgradecimiento?: string;
    enlaceDescarga?: string;
    codigoDescuento?: string;
  };
  ciudadesConfig?: string[];
}

export interface Fan {
  id: string;
  band_id?: string;
  nombre: string;
  email: string;
  ciudad?: string;
  comoConocio?: string;
  conciertoOrigenId?: string;
  conciertoOrigenNombre?: string;
  fechaCaptura: string;
  consentimientoRGPD: boolean;
}

export interface SocialPost {
  id: string;
  band_id?: string;
  fecha: string;
  plataforma: 'Instagram' | 'TikTok' | 'YouTube' | 'Facebook';
  contenido: string;
  estado: 'borrador' | 'aprobado' | 'publicado';
  responsable: string;
}

export interface Payment {
  id: string;
  band_id?: string;
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
  band_id?: string;
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
  plan?: 'emergente' | 'profesional' | 'manager360';
  bandName?: string;
  email?: string;
  instrument?: string;
  avatarColor?: string;
  createdAt: string;
}

export interface UserWithHash extends User {
  passwordHash: string;
  salt: string;
}

export interface GoogleSheetsStatus {
  configured: boolean;
  spreadsheetId?: string;
  tabs?: string[];
  error?: string;
}

export type ThemeName = 'stitch_light' | 'stitch_dark' | 'backstage_neon' | 'roots_ska' | 'indie_velvet' | 'brutalist_fuzz';

export interface AudioComment {
  id: string;
  autor: string;
  instrumento?: string;
  timestampSegundos?: number; // e.g. 15 for 0:15 in audio
  texto: string;
  fecha: string;
}

export interface AudioTrack {
  id: string;
  nombre: string;
  audioUrl: string;
  autor?: string;
  instrumento?: string;
  fecha?: string;
  volumen?: number; // 0 to 1
  muted?: boolean;
  solo?: boolean;
  desfaseMs?: number; // Latency offset in milliseconds (-300 to +300) for multitrack alignment
}

export interface SongAudioIdea {
  id: string;
  titulo: string;
  seccion: 'general' | 'intro' | 'verso' | 'estribillo' | 'puente' | 'solo' | 'outro';
  audioUrl: string; // Primary or legacy single audio track
  pistas?: AudioTrack[]; // Multitrack basic recording support
  subidoPor: string;
  instrumento?: string;
  fecha: string;
  notas?: string;
  votos?: string[]; // Array of usernames who approved/liked this idea
  comentarios?: AudioComment[];
}

export interface SongSubstituteGuide {
  estructura?: string;
  progresionClave?: string;
  cortesYClaves?: string;
  capoTraste?: string;
  instrumentosClave?: string;
}

export interface Song {
  id: string;
  band_id?: string;
  titulo: string;
  duracion: string; // e.g. "3:45"
  duracionSegundos: number; // e.g. 225
  duracionMinutos?: number;
  tonalidad: string; // e.g. "Am", "G", "C#m"
  bpm: number; // e.g. 128
  afinacion?: string; // e.g. "E Standard", "Drop D"
  albumDisco?: string; // e.g. "Álbum Debut (2025)", "EP Cacharros", "Single", "Inédita / En Proceso"
  ordenAlbum?: number; // Position/track number within the album
  album?: string;
  genero?: string;
  tipo?: string;
  estado?: string;
  energia?: number;
  portadaUrl?: string;
  favoritoGeneral?: boolean;
  estadoTema?: 'listo' | 'ensayando' | 'componiendo' | 'descartado';
  esVersionCovers?: boolean;
  enlaceAcordes?: string; // Link to drive/chords/partitura
  notasInternas?: string;
  audioPrincipalUrl?: string; // Demo / Master audio file
  audioIdeas?: SongAudioIdea[]; // Ideas by sections (Intro, Chorus, Solo, etc.)
  cifradoTexto?: string; // Lyrics and chords in LaCuerda / Ultimate Guitar format
  guiaSustituto?: SongSubstituteGuide; // Quick summary cheat-sheet for new band members & substitutes
}

export interface SetlistItem {
  id: string;
  songId?: string; // null if speech/pause/break/block header
  tipoItem: 'cancion' | 'chapa' | 'descanso' | 'bis' | 'bloque_header' | 'interludio' | 'presentacion' | 'beatbox' | 'intro_tema' | 'solo_performance' | 'cambio_instrumento' | 'otro';
  tituloCustom?: string;
  duracionEstimadaMinutos?: number;
  duracionEstimadaSegundos?: number; // e.g. 90 seconds (1m 30s)
  notaTema?: string;
  notas?: string;
  audioUrl?: string; // Recorded or uploaded speech/presentation audio
  bloqueCategoria?: 'calentamiento' | 'nudo' | 'desenlace' | 'bis' | 'otro';
}

export interface Setlist {
  id: string;
  band_id?: string;
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
  ingresoCacheEstimated?: number;
  notasLogisticas?: string;
}

export interface Tour {
  id: string;
  band_id?: string;
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  vehiculo: string;
  consumoL100km?: number;
  precioCarburanteEUR?: number;
  tipoCombustible?: 'diesel' | 'gasolina95' | 'gasolina98' | 'electrico';
  presupuestoLogistica?: number;
  stops: TourRouteStop[];
  estado: 'planificacion' | 'confirmada' | 'completada' | 'cancelada';
}

export interface RegisteredBand {
  id: string;
  band_id: string;
  fecha_registro: string;
  nombre_banda: string;
  email: string;
  plan: 'emergente' | 'consolidada' | 'pro' | string;
  contacto_nombre?: string;
  estilo_musical?: string;
  localizacion?: string;
  telefono?: string;
  instagram?: string;
  spotify_youtube?: string;
  aforo_promedio?: number;
  estado_cuenta?: 'activo' | 'prueba' | 'cancelado' | string;
  notas?: string;
}

