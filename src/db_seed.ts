import { Lead, Rehearsal, Concert, SocialPost, Payment, Message, SocialMetric } from './types';

export const INITIAL_LEADS: Lead[] = [
  {
    id: 'lead-1',
    nombre_sala: 'Sala Apolo',
    ciudad: 'Barcelona',
    region: 'Cataluña',
    aforo: 1200,
    genero: 'Fusión / Ska / Reggae / Indie',
    email_contacto: 'booking@apolo.es',
    telefono: '+34 934 414 000',
    instagram: '@sala_apolo',
    fuente: 'Scout AI',
    estado: 'pendiente_aprobacion',
    pitch_generado: `Hola equipo de booking de Sala Apolo,

Somos Bakandeya, un proyecto de fusión con un directo demoledor donde combinamos ska, reggae, ritmos balcánicos y rock con sintetizadores electrónicos. Hemos estado siguiendo la programación de los miércoles de "Apolo Club" y los conciertos de fusión de fin de semana, y creemos que nuestra propuesta encaja al 100% con vuestro público habitual.

Tenemos base en Madrid/Sevilla y disponibilidad de fechas para la gira de otoño (octubre-noviembre). Os dejamos nuestro dossier con los directos grabados en festivales este verano: https://youtube.com/bakandeya_live

¿Cómo veis una fecha compartida o un directo en viernes/sábado?

Un abrazo,
Larra (Mánager de Bakandeya)`,
    notas: 'Sala emblemática de Barcelona. Ideal para la presentación oficial del disco. El Scout AI detectó que tienen un hueco libre el 14 de Noviembre.'
  },
  {
    id: 'lead-2',
    nombre_sala: 'Ochoymedio Club',
    ciudad: 'Madrid',
    region: 'Comunidad de Madrid',
    aforo: 1000,
    genero: 'Indie / Pop / Rock / Fusión',
    email_contacto: 'info@ochoymedioclub.com',
    telefono: '+34 915 220 541',
    instagram: '@ochoymedioclub',
    fuente: 'Scout AI',
    estado: 'nuevo',
    pitch_generado: `Estimado programador de Ochoymedio,

Nos ponemos en contacto desde la oficina de Bakandeya. Sabemos que Ochoymedio es el templo del indie y la fusión más fresca de la capital. Nuestro sonido mezcla rock enérgico, ska festivo y electrónica analógica, creando una fiesta que asegura la venta de barra y un ambiente espectacular.

Acabamos de llenar la sala Copérnico en Madrid y queremos dar el salto a Ochoymedio para nuestro próximo concierto de presentación de single en Noviembre.

Podéis escuchar nuestro directo aquí: https://spotify.com/bakandeya

¿Cuándo podríamos hablar para valorar una fecha para otoño?

Saludos cordiales,
Equipo Bakandeya`,
    notas: 'Contacto prioritario en Madrid.'
  },
  {
    id: 'lead-3',
    nombre_sala: 'Sala El Tren',
    ciudad: 'Granada',
    region: 'Andalucía',
    aforo: 800,
    genero: 'Reggae / Ska / Drum&Bass / Mestizaje',
    email_contacto: 'info@salaeltren.com',
    telefono: '+34 958 152 730',
    instagram: '@salaeltren',
    fuente: 'Scout AI',
    estado: 'pendiente_aprobacion',
    pitch_generado: `Hola gente de Sala El Tren,

Os escribimos de parte de Bakandeya, banda de ska-reggae-electrónica. Sabemos que El Tren es el espacio de referencia para el mestizaje y los ritmos rotos en Granada. Nuestro directo tiene un componente electrónico muy potente apoyado por una sección de vientos brutal que hace que nadie pare de bailar.

Queremos bajar a Andalucía en Noviembre y Granada es parada obligatoria. Nos gustaría proponer un directo para el viernes 20 de Noviembre, o bien sumarnos a alguna noche temática que tengáis planeada.

Os dejamos nuestro último directo en el Festival de Cabo de Plata: https://youtube.com/bakandeya_live

¿Tenéis disponibilidad en esa quincena de noviembre?

Salud y música,
Larra`,
    notas: 'Granada siempre responde genial a la fusión y el reggae. Pitch adaptado destacando el Cabo de Plata.'
  },
  {
    id: 'lead-4',
    nombre_sala: 'Viña Rock',
    ciudad: 'Villarrobledo',
    region: 'Castilla-La Mancha',
    aforo: 60000,
    genero: 'Mestizaje / Rock / Rap / Reggae / Ska',
    email_contacto: 'artistas@vina-rock.com',
    telefono: '',
    instagram: '@vinarockoficial',
    fuente: 'Scout AI',
    estado: 'interesado',
    pitch_generado: `Estimada organización de Viña Rock,

Esperamos que estéis preparando una gran edición. Os escribimos para presentar la candidatura de Bakandeya para el escenario de Mestizaje/Reggae.

Bakandeya es un terremoto en directo, combinando ska-rock combativo con vientos metal y electrónica de vanguardia. Somos la banda perfecta para abrir la tarde o mantener el fuego en la madrugada con ritmos de baile sin tregua.

Aquí tenéis nuestro videoclip oficial y resumen de gira: https://youtube.com/bakandeya_gira

Agradecemos vuestra atención y nos encantaría formar parte del cartel este año.

Atentamente,
Larra (Mánager de Bakandeya)`,
    fecha_envio: '2026-06-15',
    fecha_ultima_respuesta: '2026-07-08',
    notas: '¡Respondieron el correo! El programador del escenario de Mestizaje dice que le mola la propuesta de vientos + sintetizadores. Pide presupuesto (caché) para el viernes por la tarde. Clasificado como INTERESADO por el Lector de Bandeja.'
  },
  {
    id: 'lead-5',
    nombre_sala: 'Festival Cabo de Plata',
    ciudad: 'Barbate',
    region: 'Andalucía',
    aforo: 35000,
    genero: 'Reggae / Mestizaje / Hip Hop',
    email_contacto: 'programacion@cabodeplata.com',
    telefono: '',
    instagram: '@cabodeplata',
    fuente: 'Scout AI',
    estado: 'esperando_respuesta',
    pitch_generado: `Hola equipo de Cabo de Plata,

Volvemos a la carga tras nuestro exitoso paso por el escenario secundario en la pasada edición. Bakandeya ha madurado el directo, incorporando nuevos sintetizadores analógicos y ritmos afro-beat mezclados con el ska-rock habitual.

Queremos postularnos para un slot nocturno en el escenario secundario o apertura de tarde en el principal. Garantizamos público entregado y un show que es pura adrenalina.

Dossier y música: https://spotify.com/bakandeya

Quedamos a vuestra disposición para enviaros una propuesta económica detallada.

Saludos festivos,
Larra`,
    fecha_envio: '2026-07-01',
    notas: 'Mail enviado el 1 de julio. Sin respuesta de momento. El Lector de Bandeja monitoriza la bandeja de entrada.'
  },
  {
    id: 'lead-6',
    nombre_sala: 'Sala Razzmatazz (Sala 2)',
    ciudad: 'Barcelona',
    region: 'Cataluña',
    aforo: 800,
    genero: 'Indie / Electrónica / Rock / Fusión',
    email_contacto: 'booking@salarazzmatazz.com',
    telefono: '+34 933 208 200',
    instagram: '@razzmatazzclubs',
    fuente: 'Scout AI',
    estado: 'negociando',
    pitch_generado: `Hola programadores de Razzmatazz,

Contacto de la oficina de Bakandeya. Queremos proponer una fecha para nuestra gira de presentación "Fusión Sintética" en Razzmatazz 2 para el mes de Diciembre.

Nuestra fusión de ska instrumental clásico con bases electrónicas potentes encaja como anillo al dedo con el perfil de vuestra sala 2. Ofrecemos una noche de baile total, con el respaldo de nuestra fanbase en Cataluña (tenemos unos 15.000 oyentes mensuales en el área de Barcelona).

Dossier interactivo: https://bakandeya.es/epk

¿Cómo tenéis las fechas libres para los fines de semana de Diciembre?

Un saludo,
Larra`,
    fecha_envio: '2026-06-20',
    fecha_ultima_respuesta: '2026-07-05',
    notas: 'Negociando caché y condiciones. Nos ofrecen un alquiler de sala con mínimos de venta de barra o bien un acuerdo de taquilla al 70/30 a nuestro favor. Diego prefiere taquilla al 80/20 o un caché fijo mínimo de 1.800€.'
  },
  {
    id: 'lead-7',
    nombre_sala: 'Ayuntamiento de Burgos (Juventud)',
    ciudad: 'Burgos',
    region: 'Castilla y León',
    aforo: 3000,
    genero: 'Mestizaje / Fiestas Patronales / Rock / Reggae',
    email_contacto: 'juventud@aytoburgos.es',
    telefono: '+34 947 288 800',
    instagram: '@aytoburgos',
    fuente: 'Scout AI',
    estado: 'pendiente_aprobacion',
    pitch_generado: `Estimados técnicos del Área de Juventud y Festejos del Excmo. Ayuntamiento de Burgos,

Les escribimos para presentar la propuesta musical de Bakandeya de cara a las fiestas patronales de San Pedro y San Pablo, o para los ciclos de música de otoño al aire libre.

Bakandeya es una banda de fusión fresca y bailable con sede en España, compuesta por 6 músicos profesionales. Nuestro espectáculo combina la potencia del ska instrumental y el reggae con toques electrónicos contemporáneos, siendo un concierto de carácter sumamente festivo, familiar y participativo, ideal para plazas públicas y eventos municipales.

Hemos actuado en festivales nacionales de prestigio y garantizamos un directo dinámico de 90 minutos con un equipamiento técnico óptimo.

Vídeo presentación en directo: https://youtube.com/bakandeya_live

Quedamos a su disposición para remitirles nuestro dossier técnico (Rider) y propuesta presupuestaria formal.

Cordialmente,
Larra (Booking & Management Bakandeya)`,
    notas: 'Interesante para conseguir bolos municipales bien remunerados. Hay que vigilar el plazo de solicitud del ayuntamiento.'
  },
  {
    id: 'lead-8',
    nombre_sala: 'Sala REM',
    ciudad: 'Murcia',
    region: 'Región de Murcia',
    aforo: 600,
    genero: 'Indie / Pop / Rock / Mestizaje',
    email_contacto: 'conciertos@salarem.es',
    telefono: '',
    instagram: '@salarem',
    fuente: 'Scout AI',
    estado: 'nuevo',
    pitch_generado: `Hola programadores de Sala REM,

Somos Bakandeya, banda que cruza ska-reggae-rock con bases de música electrónica analógica. Llevamos un directo enérgico que está moviendo mucho en redes.

Queremos visitar Murcia este otoño, y sabemos que Sala REM es el espacio ideal por acústica, ubicación y público fiel. Nuestra propuesta encaja muy bien con vuestras noches de mestizaje y electrónica alternativa.

Directo y temas: https://spotify.com/bakandeya

¿Tenéis algún hueco libre para viernes/sábado en noviembre?

Un saludo,
Equipo Bakandeya`,
    notas: 'Murcia es una plaza excelente para el indie-fusión de salas.'
  },
  {
    id: 'lead-9',
    nombre_sala: 'Kafe Antzokia',
    ciudad: 'Bilbao',
    region: 'País Vasco',
    aforo: 750,
    genero: 'Ska / Reggae / Mestizaje / Rock',
    email_contacto: 'musika@kafeantzokia.eus',
    telefono: '+34 944 244 625',
    instagram: '@kafe_antzokia',
    fuente: 'Scout AI',
    estado: 'negociando',
    pitch_generado: `Kaixo! Hola equipo de Kafe Antzokia,

Os escribimos de parte de Bakandeya, banda de ska, reggae y electrónica con directos muy potentes en festivales. 

Sabemos que el Antzoki es el corazón del ska y mestizaje en Bilbao y nos encantaría presentar nuestro nuevo repertorio allí en otoño. Nos gustaría proponer una fecha compartida con alguna banda local de ska de Euskadi para asegurar un llenazo total y una noche de fiesta memorable.

Vídeo en directo: https://youtube.com/bakandeya_live

¿Cómo tenéis el calendario para los meses de Octubre o Noviembre?

Eskerrik asko, un saludo!
Larra`,
    fecha_envio: '2026-06-18',
    fecha_ultima_respuesta: '2026-07-06',
    notas: 'El programador vasco respondió con interés en montar un bolo doble con una banda de ska local el 7 de Noviembre. Están coordinando con la otra banda.'
  },
  {
    id: 'lead-10',
    nombre_sala: 'Sala Capitol',
    ciudad: 'Santiago de Compostela',
    region: 'Galicia',
    aforo: 800,
    genero: 'Rock / Reggae / Ska / Pop',
    email_contacto: 'info@salacapitol.com',
    telefono: '+34 981 582 581',
    instagram: '@salacapitol',
    fuente: 'Scout AI',
    estado: 'no_interesado',
    pitch_generado: `Hola amigos de Sala Capitol,

Presentamos a Bakandeya, banda de fusión ska-reggae-electrónica que está girando a nivel nacional. Nos gustaría proponer una fecha para nuestra gira en Santiago de Compostela durante noviembre.

Llevamos un show cargado de energía que combina una sección de vientos potente con sintetizadores ácidos y guitarras ska rockeras.

Os dejamos nuestro Spotify: https://spotify.com/bakandeya

¿Disponéis de fechas para bolos de fin de semana en noviembre?

Un abrazo,
Larra`,
    fecha_envio: '2026-06-10',
    fecha_ultima_respuesta: '2026-06-15',
    notas: 'Contestaron diciendo que tienen la programación de otoño 100% cerrada y que para este estilo no tienen huecos disponibles hasta verano del año que viene. Guardar contacto para más adelante. Clasificado como NO_INTERESADO.'
  },
  {
    id: 'lead-11',
    nombre_sala: 'Festival Pirineos Sur',
    ciudad: 'Lanuza (Huesca)',
    region: 'Aragón',
    aforo: 5000,
    genero: 'Música del Mundo / Fusión / Reggae / Folk',
    email_contacto: 'artistas@pirineos-sur.es',
    telefono: '',
    instagram: '@pirineossur',
    fuente: 'Scout AI',
    estado: 'interesado',
    pitch_generado: `Estimada dirección artística del Festival Pirineos Sur,

Nos complace presentarles la propuesta musical de Bakandeya de cara a su escenario flotante del Auditorio natural de Lanuza.

Bakandeya ofrece una fusión sin precedentes de ska instrumental, reggae africano y electrónica analógica europea, logrando un sonido multicultural que encaja a la perfección con la filosofía del festival. Nuestro show invita a la danza y el encuentro a través del ritmo.

EPK y dossier: https://bakandeya.es/epk

Esperamos que nuestra propuesta sea de su agrado para complementar las noches de fusión.

Cordialmente,
Larra (Mánager de Bakandeya)`,
    fecha_envio: '2026-06-05',
    fecha_ultima_respuesta: '2026-07-02',
    notas: 'Muy receptivos. Nos piden presupuesto de caché y backline necesario. Dicen que el sonido de vientos más sintetizadores analógicos les parece muy fresco para el escenario de nuevos talentos.'
  },
  {
    id: 'lead-12',
    nombre_sala: 'Sala Custom',
    ciudad: 'Sevilla',
    region: 'Andalucía',
    aforo: 900,
    genero: 'Rock / Metal / Fusión / Ska',
    email_contacto: 'booking@salacustom.com',
    telefono: '',
    instagram: '@salacustomsevilla',
    fuente: 'Scout AI',
    estado: 'aprobado',
    pitch_generado: `Hola equipo de Sala Custom,

Os escribimos de parte de Bakandeya, proyecto andaluz de ska-reggae con base electrónica. Tras haber llenado salas medianas en Sevilla, queremos dar el salto a un aforo mayor como el vuestro para la presentación de nuestro disco.

Ofrecemos un directo muy bailable con vientos metal y sintetizadores que pone a saltar a toda la sala de principio a fin.

Nuestros datos de directo: https://youtube.com/bakandeya_live

¿Cómo tenéis las fechas los fines de semana de Noviembre/Diciembre para un concierto propio en taquilla o alquiler?

Abrazos,
Larra`,
    notas: 'Pitch aprobado por Diego. Pasado al estado APROBADO. El agente Enviador lo enviará en su próximo ciclo cron de esta tarde.'
  },
  {
    id: 'lead-13',
    nombre_sala: 'Ayuntamiento de Logroño (Festejos)',
    ciudad: 'Logroño',
    region: 'La Rioja',
    aforo: 4000,
    genero: 'Mestizaje / Rock / Festivo',
    email_contacto: 'festejos@logrono.es',
    telefono: '',
    instagram: '@ayto_logrono',
    fuente: 'Scout AI',
    estado: 'nuevo',
    pitch_generado: `Estimados técnicos de festejos del Ayuntamiento de Logroño,

Presentamos la propuesta de Bakandeya para los escenarios musicales y plazas durante las fiestas de San Mateo en Septiembre u eventos culturales de otoño.

Bakandeya combina ritmos festivos como el ska y reggae con toques electrónicos muy dinámicos, ofreciendo un espectáculo bailable de alta calidad y apto para todos los públicos.

Vídeo promocional: https://youtube.com/bakandeya_promo

Agradecemos su tiempo para evaluar nuestra propuesta.

Saludos cordiales,
Mánager de Bakandeya`,
    notas: 'Interesante bolo de plaza pública.'
  }
];

export const INITIAL_REHEARSALS: Rehearsal[] = [
  {
    id: 'reh-1',
    fecha: '2026-07-11',
    hora: '18:00 - 21:00',
    lugar: 'Locales Rock Palace, Madrid',
    asistentes: ['Diego', 'Filgue', 'Larra', 'Carlos (Batería)', 'Sonia (Trombón)', 'Dani (Trompeta)'],
    notas: 'Ensayo general. Importante repasar el setlist de verano y cuadrar las nuevas intros con sintetizador analógico de Diego. Larra llevará las copias del rider técnico actualizado.',
    estado: 'programado'
  },
  {
    id: 'reh-2',
    fecha: '2026-07-15',
    hora: '19:00 - 21:30',
    lugar: 'Locales El Observatorio, Madrid',
    asistentes: ['Diego', 'Filgue', 'Carlos (Batería)', 'Sonia (Trombón)'],
    notas: 'Ensayo seccional de bases y vientos para pulir la transición del tema "Ska Brutal".',
    estado: 'programado'
  },
  {
    id: 'reh-3',
    fecha: '2026-07-05',
    hora: '17:00 - 20:00',
    lugar: 'Locales Rock Palace, Madrid',
    asistentes: ['Diego', 'Filgue', 'Larra', 'Carlos (Batería)', 'Sonia (Trombón)', 'Dani (Trompeta)'],
    notas: 'Ensayo de post-gira de primavera. Se grabaron las maquetas de los tres nuevos temas.',
    estado: 'completado'
  }
];

export const INITIAL_CONCERTS: Concert[] = [
  {
    id: 'con-1',
    fecha: '2026-07-18',
    ciudad: 'Barbate (Cádiz)',
    sala: 'Festival Cabo de Plata (Escenario Tierra)',
    cache: 4500,
    aforo_vendido: 12400,
    aforo_total: 35000,
    contrato_firmado: true,
    estado_pago: 'anticipo',
    notas: 'Recibido el 50% de anticipo (2.250€). El resto se cobra por transferencia a los 15 días del festival. Alojamiento y catering incluidos en zona VIP. Diego viaja el viernes, el resto sale en furgoneta el sábado por la mañana.',
    tipo: 'festival'
  },
  {
    id: 'con-2',
    fecha: '2026-08-08',
    ciudad: 'Villarrobledo',
    sala: 'Fiestas del Verano (Plaza Mayor)',
    cache: 3500,
    aforo_vendido: 3200,
    aforo_total: 5000,
    contrato_firmado: true,
    estado_pago: 'pendiente',
    notas: 'Bolo gestionado con el Ayuntamiento. Factura emitida, pendiente de cobro tras la actuación. Escenario y PA a cargo del ayuntamiento. Camerino con cena para 8 personas contratado.',
    tipo: 'ayuntamiento'
  },
  {
    id: 'con-3',
    fecha: '2026-09-12',
    ciudad: 'Madrid',
    sala: 'Sala Caracol',
    cache: 2200,
    aforo_vendido: 450,
    aforo_total: 500,
    contrato_firmado: false,
    estado_pago: 'pendiente',
    notas: 'Concierto propio de taquilla. Estimamos caché de 2.200€ basado en vender el 90% del aforo a 10€. Alquiler de sala ya descontado (600€). Contrato en revisión por parte de Larra.',
    tipo: 'sala'
  },
  {
    id: 'con-4',
    fecha: '2026-06-20',
    ciudad: 'Málaga',
    sala: 'Sala Trinchera',
    cache: 1800,
    aforo_vendido: 380,
    aforo_total: 400,
    contrato_firmado: true,
    estado_pago: 'pagado',
    notas: '¡Llenazo absoluto! Recibidos los 1.800€ netos en cuenta de la banda. El público estuvo increible. Vendimos además 350€ de merchandising (camisetas y vinilos).',
    tipo: 'sala'
  }
];

export const INITIAL_SOCIAL_POSTS: SocialPost[] = [
  {
    id: 'post-1',
    fecha: '2026-07-10',
    plataforma: 'Instagram',
    contenido: '🔥 ¡CALENTANDO MOTORES PARA EL CABO DE PLATA! 🔥\n\nSolo faltan 8 días para subirnos al Escenario Tierra. ¿Quién se viene a bailar ska-electrónico al atardecer? Os tenemos preparado un show que va a derretir la arena de Barbate. \n\n#Bakandeya #CaboDePlata #SkaReggae #FestejoMusical #Sintetizadores #VientosMetal',
    estado: 'borrador',
    responsable: 'Filgue'
  },
  {
    id: 'post-2',
    fecha: '2026-07-12',
    plataforma: 'TikTok',
    contenido: 'Vídeo corto: Grabación del ensayo general con la cámara lenta de la sección de vientos saltando al unísono con el bajo de Filgue. Texto flotante: "Cuando la sección de vientos decide sincronizarse al 100% 🎷🎺🔋". Música de fondo: Demo de "Ska Brutal".',
    estado: 'borrador',
    responsable: 'Diego'
  },
  {
    id: 'post-3',
    fecha: '2026-07-06',
    plataforma: 'Instagram',
    contenido: '📸 Resumen fotográfico de lo que fue el conciertazo de Málaga en Sala Trinchera. El sur nunca falla. ¡Gracias infinitas por el sold out y por sudar la camiseta con nosotros! \n\nPróxima parada: Cabo de Plata, ¡vamos con todo! \n\n#SoldOut #Bakandeya #Trinchera #Malaga #ConciertoDirecto',
    estado: 'publicado',
    responsable: 'Larra'
  },
  {
    id: 'post-4',
    fecha: '2026-07-14',
    plataforma: 'YouTube',
    contenido: 'Subida del videoclip del directo en Málaga "Vientos de Fusión (En Vivo desde Trinchera)". Miniatura de alta resolución con Sonia sonriendo con el trombón en primer plano y luces rojas de backstage.',
    estado: 'aprobado',
    responsable: 'Diego'
  }
];

export const INITIAL_PAYMENTS: Payment[] = [
  {
    id: 'pay-1',
    tipo: 'ingreso',
    categoria: 'concierto',
    concepto: 'Anticipo 50% Festival Cabo de Plata',
    importe: 2250,
    fecha: '2026-06-25',
    estado: 'pagado'
  },
  {
    id: 'pay-2',
    tipo: 'ingreso',
    categoria: 'concierto',
    concepto: 'Taquilla Concierto Sala Trinchera Málaga',
    importe: 1800,
    fecha: '2026-06-22',
    estado: 'pagado'
  },
  {
    id: 'pay-3',
    tipo: 'ingreso',
    categoria: 'merchandising',
    concepto: 'Venta camisetas y vinilos Málaga',
    importe: 350,
    fecha: '2026-06-20',
    estado: 'pagado'
  },
  {
    id: 'pay-4',
    tipo: 'gasto',
    categoria: 'transporte',
    concepto: 'Furgoneta alquiler e ingredientes gira Málaga',
    importe: 420,
    fecha: '2026-06-19',
    estado: 'pagado'
  },
  {
    id: 'pay-5',
    tipo: 'gasto',
    categoria: 'alojamiento',
    concepto: 'Hostal músicos Málaga (2 noches)',
    importe: 280,
    fecha: '2026-06-19',
    estado: 'pagado'
  },
  {
    id: 'pay-6',
    tipo: 'ingreso',
    categoria: 'concierto',
    concepto: 'Restante 50% Festival Cabo de Plata (Post-Bolo)',
    importe: 2250,
    fecha: '2026-07-28',
    estado: 'pendiente'
  },
  {
    id: 'pay-7',
    tipo: 'ingreso',
    categoria: 'concierto',
    concepto: 'Caché completo Ayuntamiento de Villarrobledo',
    importe: 3500,
    fecha: '2026-08-15',
    estado: 'pendiente'
  },
  {
    id: 'pay-8',
    tipo: 'gasto',
    categoria: 'promo',
    concepto: 'Campaña anuncios Meta (Instagram/FB) Gira de Otoño',
    importe: 150,
    fecha: '2026-07-02',
    estado: 'pagado'
  }
];

export const INITIAL_MESSAGES: Message[] = [
  {
    id: 'msg-1',
    remitente: 'Larra',
    mensaje: 'Hola gente! Acabo de actualizar la ficha de Sala Apolo con el hueco del 14 de noviembre que descubrió el Scout AI. El Redactor ya escribió el pitch de email, echadle un ojo en el panel de aprobación.',
    fecha: '2026-07-09T10:15:00',
    leido: true
  },
  {
    id: 'msg-2',
    remitente: 'Diego',
    mensaje: '¡Perfecto Larra! Lo acabo de leer. Me parece brutal el pitch, pero creo que deberíamos añadirle que somos 6 músicos y que llevamos nuestro propio técnico de sonido de confianza.',
    fecha: '2026-07-09T10:30:00',
    leido: true
  },
  {
    id: 'msg-3',
    remitente: 'Filgue',
    mensaje: 'Ojo, yo prefiero que toquemos en Sala Apolo en sábado si es posible. ¿El 14 es sábado? Dejadme mirar el calendario... Sí! Es sábado, genial. Aprobemos el pitch editado esta tarde.',
    fecha: '2026-07-09T11:05:00',
    leido: true
  },
  {
    id: 'msg-4',
    remitente: 'Larra',
    mensaje: 'Hecho, ya incluí los cambios en las notas. Recordad que este sábado 11 tenemos ensayo general a las 18:00 en Rock Palace. ¡Vienen todos los vientos completos!',
    fecha: '2026-07-09T11:40:00',
    leido: false
  },
  {
    id: 'msg-5',
    remitente: 'Filgue',
    mensaje: 'Yo llevaré el bajo de repuesto y las pegatinas nuevas de Bakandeya para meter en los pedidos del merchan.',
    fecha: '2026-07-09T12:00:00',
    leido: false
  }
];

export const INITIAL_SOCIAL_METRICS: SocialMetric[] = [
  {
    id: 'metric-1',
    fecha: '2026-05-01',
    instagram: 290,
    tiktok: 110,
    youtube: 15,
    notas: 'Inicio de la monitorización de campaña de primavera.'
  },
  {
    id: 'metric-2',
    fecha: '2026-05-15',
    instagram: 310,
    tiktok: 135,
    youtube: 18,
    notas: 'Lanzamiento del EPK digital de la banda.'
  },
  {
    id: 'metric-3',
    fecha: '2026-06-01',
    instagram: 340,
    tiktok: 165,
    youtube: 22,
    notas: 'Anuncio de la participación en el Cabo de Plata.'
  },
  {
    id: 'metric-4',
    fecha: '2026-06-15',
    instagram: 370,
    tiktok: 190,
    youtube: 26,
    notas: 'Campaña publicitaria del directo en Trinchera Málaga.'
  },
  {
    id: 'metric-5',
    fecha: '2026-07-01',
    instagram: 395,
    tiktok: 220,
    youtube: 30,
    notas: 'Post del Sold Out en Málaga tuvo impacto orgánico en TikTok.'
  },
  {
    id: 'metric-6',
    fecha: '2026-07-12',
    instagram: 420,
    tiktok: 252,
    youtube: 35,
    notas: 'Registro actual real coincidiendo con el estado actual en redes sociales.'
  }
];
