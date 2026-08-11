import { Lead, Rehearsal, Concert, SocialPost, Payment, Message, SocialMetric, Tour } from './types';

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
Bakandeya Agent Manager IA`,
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

Os escribimos de parte de Bakandeya, banda de ska-reggae-electrónica. Sabemos que El Tren es el espacio de referencia para el mestizaje y los ritmos rotos en Granada. Nuestro directo tiene un componente electrónico muy potente apoyado por un violín virtuoso y percusión potente que hace que nadie pare de bailar.

Queremos bajar a Andalucía en Noviembre y Granada es parada obligatoria. Nos gustaría proponer un directo para el viernes 20 de Noviembre, o bien sumarnos a alguna noche temática que tengáis planeada.

Os dejamos nuestro último directo en el Festival de Cabo de Plata: https://youtube.com/bakandeya_live

¿Tenéis disponibilidad en esa quincena de noviembre?

Salud y música,
Bakandeya Agent Manager IA`,
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

Bakandeya es un terremoto en directo, combinando ska-rock combativo con violín virtuoso, percusión y electrónica de vanguardia. Somos la banda perfecta para abrir la tarde o mantener el fuego en la madrugada con ritmos de baile sin tregua.

Aquí tenéis nuestro videoclip oficial y resumen de gira: https://youtube.com/bakandeya_gira

Agradecemos vuestra atención y nos encantaría formar parte del cartel este año.

Atentamente,
Bakandeya Agent Manager IA`,
    fecha_envio: '2026-06-15',
    fecha_ultima_respuesta: '2026-07-08',
    notas: '¡Respondieron el correo! El programador del escenario de Mestizaje dice que le mola la propuesta de violín + sintetizadores. Pide presupuesto (caché) para el viernes por la tarde. Clasificado como INTERESADO por el Lector de Bandeja.',
    hilo_emails: [
      {
        id: 'em-vina-1',
        fecha: '2026-06-15 11:15',
        remitente: 'banda',
        remitente_nombre: 'Bakandeya Agent Manager IA',
        asunto: 'Candidatura Bakandeya - Viña Rock 2026',
        mensaje: 'Estimada organización de Viña Rock,\n\nEsperamos que estéis preparando una gran edición. Os escribimos para presentar la candidatura de Bakandeya para el escenario de Mestizaje/Reggae...\n\nAquí tenéis nuestro videoclip oficial: https://youtube.com/bakandeya_gira'
      },
      {
        id: 'em-vina-2',
        fecha: '2026-07-08 18:20',
        remitente: 'sala',
        remitente_nombre: 'Producción Artística (Viña Rock)',
        asunto: 'RE: Candidatura Bakandeya - Viña Rock 2026',
        mensaje: 'Hola equipo de Bakandeya, ¿cómo va eso? Hemos estado revisando el directo y nos mola mucho esa combinación de violín con sintes, suena cañón y muy fresco para el escenario de Mestizaje. Querríamos saber qué disponibilidad tenéis para el viernes 1 de Mayo por la tarde, y cuál sería vuestra propuesta de caché incluyendo transportes desde Madrid/Sevilla. ¡Un saludo!'
      }
    ]
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
Bakandeya Agent Manager IA`,
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

Dossier interactivo: https://bands-manager.up.railway.app/epk

¿Cómo tenéis las fechas libres para los fines de semana de Diciembre?

Un saludo,
Bakandeya Agent Manager IA`,
    fecha_envio: '2026-06-20',
    fecha_ultima_respuesta: '2026-07-05',
    notas: 'Negociando caché y condiciones. Nos ofrecen un alquiler de sala con mínimos de venta de barra o bien un acuerdo de taquilla al 70/30 a nuestro favor. Diego prefiere taquilla al 80/20 o un caché fijo mínimo de 1.800€.',
    hilo_emails: [
      {
        id: 'em-razz-1',
        fecha: '2026-06-20 10:00',
        remitente: 'banda',
        remitente_nombre: 'Bakandeya Agent Manager IA',
        asunto: 'Gira Bakandeya - Propuesta Sala 2 Razzmatazz',
        mensaje: 'Hola programadores de Razzmatazz,\n\nContacto de la oficina de Bakandeya. Queremos proponer una fecha para nuestra gira de presentación "Fusión Sintética" en Razzmatazz 2 para el mes de Diciembre...\n\n¿Cómo tenéis el calendario?'
      },
      {
        id: 'em-razz-2',
        fecha: '2026-07-05 13:10',
        remitente: 'sala',
        remitente_nombre: 'Xavi (Booking Razzmatazz)',
        asunto: 'RE: Gira Bakandeya - Propuesta Sala 2 Razzmatazz',
        mensaje: 'Buenas, disculpad la tardanza. Nos cuadra la propuesta de balkan/ska/electrónica para una de nuestras noches temáticas de mestizaje en diciembre. Nos queda libre el sábado 5 de Diciembre. En cuanto a condiciones, solemos proponer un alquiler básico de sala de 600€ + gastos técnicos y vosotros os quedáis con el 100% de la taquilla, o bien ir a comisión de taquilla 70/30 (a vuestro favor) sin coste fijo de alquiler, pero con un mínimo de 150 entradas vendidas para cubrir gastos. Decidnos qué opción preferís.'
      }
    ]
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
Bakandeya Agent Manager IA`,
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
Bakandeya Agent Manager IA`,
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

Llevamos un show cargado de energía que combina violín virtuoso, percusión potente, sintetizadores ácidos y guitarras ska rockeras.

Os dejamos nuestro Spotify: https://spotify.com/bakandeya

¿Disponéis de fechas para bolos de fin de semana en noviembre?

Un abrazo,
Bakandeya Agent Manager IA`,
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

EPK y dossier: https://bands-manager.up.railway.app/epk

Esperamos que nuestra propuesta sea de su agrado para complementar las noches de fusión.

Cordialmente,
Bakandeya Agent Manager IA`,
    fecha_envio: '2026-06-05',
    fecha_ultima_respuesta: '2026-07-02',
    notas: 'Muy receptivos. Nos piden presupuesto de caché y backline necesario. Dicen que el sonido de violín enérgico más sintetizadores analógicos les parece muy fresco para el escenario de nuevos talentos.'
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

Ofrecemos un directo muy bailable con violín, percusión y sintetizadores que pone a saltar a toda la sala de principio a fin.

Nuestros datos de directo: https://youtube.com/bakandeya_live

¿Cómo tenéis las fechas los fines de semana de Noviembre/Diciembre para un concierto propio en taquilla o alquiler?

Abrazos,
Bakandeya Agent Manager IA`,
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
Bakandeya Agent Manager IA`,
    notas: 'Interesante bolo de plaza pública.'
  },
  {
    id: 'lead-14',
    nombre_sala: 'Sala Hebe (Vallekas)',
    ciudad: 'Madrid',
    region: 'Comunidad de Madrid',
    aforo: 250,
    genero: 'Ska / Reggae / Punk Rock / Mestizaje',
    email_contacto: 'booking@salahebevallekas.com',
    telefono: '+34 914 771 234',
    instagram: '@salahebevallekas',
    fuente: 'Scout AI',
    estado: 'negociando',
    pitch_generado: `Estimados compañeros de la Hebe,

Somos Bakandeya, banda que fusiona balkan-ska, reggae, violín enérgico, percusión reciclada y electrónica. Conocemos de sobra la trayectoria histórica de la Hebe apoyando la música en directo de raíz y el rock más canalla en Vallekas. Creemos que nuestro show de ska/reggae con toques electrónicos es ideal para vuestro público.

Tenemos fechas abiertas para otoño y nos encantaría montar un buen jaleo en vuestro escenario.

Os dejamos nuestro dossier interactivo y vídeos en directo: https://youtube.com/bakandeya_live

Un saludo,
Bakandeya Agent Manager IA`,
    fecha_envio: '2026-07-01',
    fecha_ultima_respuesta: '2026-07-03',
    notas: 'Simulación de negociación activa con Kike (programador de la Hebe). Nos ofrecen taquilla al 60/40 y queremos proponerles montar fecha doble con una banda local para llenar aforo y rascar un 80/20.',
    hilo_emails: [
      {
        id: 'em-hebe-1',
        fecha: '2026-07-01 12:30',
        remitente: 'banda',
        remitente_nombre: 'Bakandeya Agent Manager IA',
        asunto: 'Propuesta de concierto: Bakandeya en Vallekas',
        mensaje: '¡Hola! Os escribimos para presentar a Bakandeya, banda de balkan-ska y reggae electrónico. Nos encantaría tocar en la mítica Sala Hebe en otoño. Nuestro directo es pura energía con violín, loops y percusión reciclada, asegurando baile y fiesta de principio a fin.'
      },
      {
        id: 'em-hebe-2',
        fecha: '2026-07-03 16:45',
        remitente: 'sala',
        remitente_nombre: 'Kike (Programación Sala Hebe)',
        asunto: 'RE: Propuesta de concierto: Bakandeya en Vallekas',
        mensaje: 'Hola, gracias por escribir. Nos gusta la propuesta y ese rollo de violín con electrónica puede sonar de lujo en Vallekas. Para otoño tenemos el viernes 13 de Noviembre libre. Nosotros solemos ir a taquilla con un reparto del 60% para la banda y 40% para la sala, con una entrada recomendada de 8€. ¿Cómo lo veis? ¿Tenéis alguna banda local de Vallekas con la que compartir fecha?'
      }
    ]
  },
  {
    id: 'lead-15',
    nombre_sala: 'Sala Villanos',
    ciudad: 'Madrid',
    region: 'Comunidad de Madrid',
    aforo: 450,
    genero: 'Jazz / Fusión / World Music / Balkan / Ska',
    email_contacto: 'programacion@salavillanos.es',
    telefono: '+34 910 882 340',
    instagram: '@salavillanos',
    fuente: 'Scout AI',
    estado: 'interesado',
    pitch_generado: `Hola equipo de programación de Sala Villanos,

Nos ponemos en contacto de parte de Bakandeya, proyecto de fusión balkan-ska, reggae, violín y electrónica. Sabemos que la Sala Villanos (antigua Sala Caracol) es el templo de la fusión internacional y los sonidos del mundo en Madrid.

Nuestro directo reúne violín virtuoso, percusión iraní/azerbaiyana, sintetizadores analógicos, guitarra y bajo, creando una atmósfera de fiesta de alta calidad técnica.

Dossier y música: https://spotify.com/bakandeya

¿Tenéis disponibilidad de fechas para la temporada de otoño en noviembre?

Saludos cordiales,
Bakandeya Agent Manager IA`,
    fecha_envio: '2026-06-28',
    fecha_ultima_respuesta: '2026-07-12',
    notas: 'Respuesta positiva de la Sala Villanos. Interesados en una fecha en noviembre para su ciclo de música de raíz y fusión contemporánea. Clasificado como INTERESADO.',
    hilo_emails: [
      {
        id: 'em-villanos-1',
        fecha: '2026-06-28 11:00',
        remitente: 'banda',
        remitente_nombre: 'Bakandeya Agent Manager IA',
        asunto: 'Propuesta de concierto Bakandeya - Sala Villanos Madrid',
        mensaje: 'Hola equipo de programación de Sala Villanos, os presentamos Bakandeya, proyecto de fusión balkan-ska, reggae, violín y electrónica...'
      },
      {
        id: 'em-villanos-2',
        fecha: '2026-07-12 14:10',
        remitente: 'sala',
        remitente_nombre: 'Programación Artística (Sala Villanos)',
        asunto: 'RE: Propuesta de concierto Bakandeya - Sala Villanos Madrid',
        mensaje: 'Buenas, conocemos la propuesta y nos parece un proyecto potentísimo con un directo impecable. Nos encajaría para la segunda mitad de noviembre dentro de nuestra programación de fusión y world music. ¿Tenéis estimación de caché o preferencia de acuerdo en taquilla?'
      }
    ]
  },
  {
    id: 'lead-16',
    nombre_sala: 'Sala Trinchera',
    ciudad: 'Málaga',
    region: 'Andalucía',
    aforo: 400,
    genero: 'Rock / Ska / Reggae / Mestizaje / Electrónica',
    email_contacto: 'programacion@salatrinchera.com',
    telefono: '+34 952 312 000',
    instagram: '@salatrinchera',
    fuente: 'Scout AI',
    estado: 'interesado',
    direccion: 'Calle Parauta, 25, 29006 Málaga',
    pitch_generado: `Hola equipo de Sala Trinchera,

Os escribimos desde la oficina de Bakandeya. Sabemos que la Trinchera es la sala de referencia del rock, mestizaje y ska en Málaga.

Tras el llenazo de nuestro anterior concierto en Málaga, queremos proponer una nueva fecha de presentación para la temporada de otoño/invierno.

Dossier y directo: https://spotify.com/bakandeya

¿Cómo tenéis la agenda para los viernes de Noviembre?

Un abrazo festivo,
Bakandeya Agent Manager IA`,
    fecha_envio: '2026-06-25',
    fecha_ultima_respuesta: '2026-07-04',
    notas: 'Sala emblemática de Málaga con excelente acústica. Dirección confirmada: Calle Parauta, 25, 29006 Málaga.'
  },
  {
    id: 'lead-17',
    nombre_sala: 'Vallekas Ska & Roots (Banda Co-Booking)',
    ciudad: 'Madrid',
    region: 'Comunidad de Madrid',
    aforo: 400,
    genero: 'Ska / Punk / Roots / Fusión',
    tipo: 'grupo',
    email_contacto: 'vallekasska@gmail.com',
    telefono: '+34 612 345 678',
    instagram: '@vallekas_ska_official',
    fuente: 'Red de Bandas Co-Booking',
    estado: 'interesado',
    pitch_generado: `¡Buenas chavales de Vallekas Ska & Roots!

Os escribimos desde Bakandeya, banda de balkan-ska, violín enérgico y electrónica de Madrid/Sevilla. Nos mola mucho vuestro proyecto y creemos que nuestros estilos conectan genial en directo.

Queremos proponer un INTERCAMBIO DE FECHAS / CO-BOOKING para esta temporada:
1. Os invitamos a tocar con nosotros en nuestra fecha en Madrid compartiendo cartel y taquilla al 50%.
2. Nos coordinamos para ir juntos a una sala mediana (aforo 300-500) para petarlo sumando ambas aficiones.

Podéis escuchar lo que hacemos aquí: https://youtube.com/bakandeya_live

¿Cómo lo veis? ¿Hablamos por WhatsApp esta semana?

¡Un abrazo!
Bakandeya Agent Manager IA`,
    fecha_ultima_respuesta: '2026-07-10',
    notas: 'Banda con potente arraigo en Madrid. Muy receptivos a montar un doble cartel en la Sala Hebe o Copérnico.',
    hilo_emails: [
      {
        id: 'em-vsk-1',
        fecha: '2026-07-10 17:00',
        remitente: 'sala',
        remitente_nombre: 'Vallekas Ska (Management)',
        asunto: 'RE: Propuesta de concierto compartido e intercambio de fechas: Bakandeya x Vallekas Ska',
        mensaje: '¡Aúpa Bakandeya! Nos parece una idea brutal. Nosotros llenamos unos 200 en Vallekas y con vuestro violín y sintes montamos una noche balkan-ska de locos. Contad con nosotros para noviembre.'
      }
    ]
  },
  {
    id: 'lead-18',
    nombre_sala: 'Balkan Boom (Banda Barcelona)',
    ciudad: 'Barcelona',
    region: 'Cataluña',
    aforo: 500,
    genero: 'Balkan Brass / Cumbia / Electro-Ska',
    tipo: 'grupo',
    email_contacto: 'contact@balkanboomband.cat',
    telefono: '+34 654 987 321',
    instagram: '@balkanboom_bcn',
    fuente: 'Red de Bandas Co-Booking',
    estado: 'nuevo',
    pitch_generado: `¡Hola equipo de Balkan Boom!

Os escribimos desde Bakandeya. Seguimos vuestra trayectoria en Barcelona y nos parece que tenéis un directo potentísimo de brass y ritmos del este.

Queremos proponer un INTERCAMBIO DE CIUDADES (Date Swap 2026):
- Barcelona: Tocamos con vosotros en Barcelona en vuestra sala habitual (Razzmatazz 3 / Salamandra).
- Madrid/Sevilla: Os abrimos fecha en Madrid o Sevilla en nuestro bolo de presentación.

Compartimos gastos de furgoneta y backline para abaratar costes de viaje.

Escuchad nuestro directo: https://youtube.com/bakandeya_live

¿Tenéis disponibilidad para otoño?

Salud y fiesta,
Bakandeya Agent Manager IA`,
    notas: 'Banda ideal para intercambio de ciudades en Cataluña.'
  },
  {
    id: 'lead-19',
    nombre_sala: 'Mondosonoro (Redacción Fusión & Mestizaje)',
    ciudad: 'Nacional',
    region: 'Nacional',
    aforo: 0,
    genero: 'Revista / Prensa Musical / Web',
    tipo: 'medio',
    email_contacto: 'redaccion@mondosonoro.com',
    telefono: '+34 932 189 010',
    website: 'https://mondosonoro.com',
    instagram: '@mondosonoro',
    fuente: 'Base de Medios y Prensa',
    estado: 'pendiente_aprobacion',
    pitch_generado: `Hola equipo de redacción de Mondosonoro,

Nos ponemos en contacto desde la oficina de Bakandeya para presentar la nota de prensa de nuestro próximo lanzamiento y gira nacional 2026.

Bakandeya es una propuesta que refresca el panorama de la música de raíz fusionando el ska bailable con violín solista virtuosístico, percusiones analógicas y sintetizadores ácidos.

Remitimos dossier de prensa, fotos promocionales en alta resolución y enlace al adelanto exclusivo del nuevo videoclip: https://youtube.com/bakandeya_live

Estaríamos encantados de coordinar una entrevista o reseña del single.

Muchas gracias por vuestra atención,
Bakandeya Agent Manager IA`,
    notas: 'Medio de prensa musical nacional de referencia.'
  },
  {
    id: 'lead-20',
    nombre_sala: 'Radio 3 (Programa El Rimadero / Discópolis)',
    ciudad: 'Madrid',
    region: 'Nacional',
    aforo: 0,
    genero: 'Radio / Emisora Pública / Podcast',
    tipo: 'medio',
    email_contacto: 'radio3@rtve.es',
    telefono: '+34 913 468 000',
    website: 'https://rtve.es/radio3',
    instagram: '@radio3_rtve',
    fuente: 'Base de Medios y Prensa',
    estado: 'interesado',
    pitch_generado: `Hola equipo de Radio 3,

Os saludamos desde Bakandeya. Les hacemos llegar nuestro dossier con motivo del lanzamiento de nuestro nuevo trabajo de ska/reggae con electrónica analógica.

Nos ponemos a vuestra disposición para tocar en acústico en los estudios de Prado del Rey o realizar una entrevista telefónica sobre el concepto sonoro del violín solista y las percusiones recicladas.

Audio en calidad broadcast y bio: https://bands-manager.up.railway.app/epk

Atentamente,
Bakandeya Agent Manager IA`,
    fecha_ultima_respuesta: '2026-07-09',
    notas: 'Interesados en ponernos en rotación nocturna y hacer una breve entrevista acústica.'
  },
  {
    id: 'lead-21',
    nombre_sala: 'Industrial Copera (Clubbing & Live Set)',
    ciudad: 'Granada',
    region: 'Andalucía',
    aforo: 1200,
    genero: 'Discoteca / Clubbing / Electro-Live',
    tipo: 'discoteca',
    email_contacto: 'booking@industrialcopera.net',
    telefono: '+34 958 131 211',
    instagram: '@industrialcopera',
    fuente: 'Scout AI',
    estado: 'nuevo',
    pitch_generado: `Hola equipo de programación de Industrial Copera,

Os contactamos desde Bakandeya para proponer una fecha de Live Performance & Clubbing en Granada: un show de electro-balkan live con violín distorsionado, synth bass analógico y batería de ritmos potentes.

Diseñado para horario nocturno/discoteca, manteniendo la pista llena con bpm progresivos y energía orgánica.

Vídeo promocional y sesión en directo: https://youtube.com/bakandeya_live

¿Tenéis disponibilidad para incorporar un live set en vuestra agenda nocturna?

Saludos cordiales,
Bakandeya Agent Manager IA`,
    notas: 'Icono del clubbing y música electrónica en Andalucía.'
  },
  {
    id: 'lead-22',
    nombre_sala: 'Propaganda Pel Fet (Booking Agency)',
    ciudad: 'Barcelona',
    region: 'Cataluña',
    aforo: 0,
    genero: 'Agencia / Booking / Management',
    tipo: 'productora',
    email_contacto: 'booking@ppf.cat',
    telefono: '+34 933 012 345',
    website: 'https://ppf.cat',
    instagram: '@propagandapelfet',
    fuente: 'Directorio Management',
    estado: 'nuevo',
    pitch_generado: `Estimado equipo de Propaganda Pel Fet,

Nos dirigimos a vuestra agencia para presentar la propuesta artística de Bakandeya con vista a posibles colaboraciones, coproducciones de fechas o integración en vuestro roster de gira 2026.

Bakandeya es un proyecto de alta potencia que combina ska-reggae, violín solista y sintetizadores analógicos, ofreciendo un directo bailable con logística muy ágil.

Dossier y vídeo resumen: https://youtube.com/bakandeya_live

Quedamos a vuestra disposición para agendar una breve llamada.

Atentamente,
Bakandeya Agent Manager IA`,
    notas: 'Agencia especializada en ska, mestizaje y ritmos festivos.'
  }
];

export const INITIAL_REHEARSALS: Rehearsal[] = [
  {
    id: 'reh-1',
    fecha: '2026-07-11',
    hora: '18:00 - 21:00',
    lugar: 'Locales Rock Palace, Madrid',
    asistentes: ['Jon', 'Filgue', 'R-violin', 'elyar'],
    notas: 'Ensayo general. Importante repasar el setlist de verano y cuadrar las nuevas intros con los loops de Jon y el violín de R-violin. Filgue traerá las nuevas percusiones recicladas.',
    estado: 'programado',
    band_id: 'band-bakandeya',
    bandName: 'Bakandeya'
  },
  {
    id: 'reh-2',
    fecha: '2026-07-15',
    hora: '19:00 - 21:30',
    lugar: 'Locales El Observatorio, Madrid',
    asistentes: ['Jon', 'Filgue', 'elyar'],
    notas: 'Ensayo seccional de bases rítmicas y percusión reciclada para pulir la transición con el hang pan de elyar en el tema "Ska Brutal".',
    estado: 'programado',
    band_id: 'band-bakandeya',
    bandName: 'Bakandeya'
  },
  {
    id: 'reh-3',
    fecha: '2026-07-05',
    hora: '17:00 - 20:00',
    lugar: 'Locales Rock Palace, Madrid',
    asistentes: ['Jon', 'Filgue', 'R-violin', 'elyar'],
    notas: 'Ensayo de post-gira de primavera. Se grabaron las maquetas de los tres nuevos temas con loops y violín acústico.',
    estado: 'completado',
    band_id: 'band-bakandeya',
    bandName: 'Bakandeya'
  },
  {
    id: 'reh-4',
    fecha: '2026-07-18',
    hora: '11:00 - 13:00',
    lugar: 'Locales La Drassana, Barcelona',
    asistentes: ['Marc', 'Pau', 'Laura'],
    notas: 'Ensayo previo al concierto de noche en Sala Zero. Ajustar metales.',
    estado: 'programado',
    band_id: 'band-2',
    bandName: 'Tarraco Ska Sound'
  },
  {
    id: 'reh-5',
    fecha: '2026-08-08',
    hora: '16:00 - 18:30',
    lugar: 'Bikini Rehearsal Studios, BCN',
    asistentes: ['Alba', 'Núria', 'Marta'],
    notas: 'Ensayo general repertorio de metales y brass balkan.',
    estado: 'programado',
    band_id: 'band-3',
    bandName: 'Balkan Paradise Orchestra'
  }
];

export const INITIAL_CONCERTS: Concert[] = [
  {
    id: 'con-1',
    fecha: '2026-07-18',
    ciudad: 'Barbate (Cádiz)',
    sala: 'Festival Cabo de Plata (Escenario Tierra)',
    direccion: 'Playa de la Hierbabuena, 11160 Barbate, Cádiz',
    cache: 4500,
    aforo_vendido: 12400,
    aforo_total: 35000,
    contrato_firmado: true,
    estado_pago: 'anticipo',
    notas: 'Recibido el 50% de anticipo (2.250€). El resto se cobra por transferencia a los 15 días del festival. Alojamiento y catering incluidos en zona VIP.',
    tipo: 'festival',
    band_id: 'band-bakandeya',
    bandName: 'Bakandeya'
  },
  {
    id: 'con-alt-1',
    fecha: '2026-07-18',
    ciudad: 'Tarragona',
    sala: 'Sala Zero (Noche Ska Roots)',
    direccion: 'Carrer de Sant Magí, 12, 43004 Tarragona',
    cache: 1200,
    aforo_vendido: 280,
    aforo_total: 300,
    contrato_firmado: true,
    estado_pago: 'pendiente',
    notas: 'Concierto co-headliner de Tarraco Ska Sound con entrada vendida casi al 100%.',
    tipo: 'sala',
    band_id: 'band-bakandeya',
    bandName: 'Bakandeya'
  },
  {
    id: 'con-2',
    fecha: '2026-08-08',
    ciudad: 'Villarrobledo',
    sala: 'Fiestas del Verano (Plaza Mayor)',
    direccion: 'Plaza Mayor, s/n, 02600 Villarrobledo, Albacete',
    cache: 3500,
    aforo_vendido: 3200,
    aforo_total: 5000,
    contrato_firmado: true,
    estado_pago: 'pendiente',
    notas: 'Bolo gestionado con el Ayuntamiento. Factura emitida, pendiente de cobro tras la actuación.',
    tipo: 'ayuntamiento',
    band_id: 'band-bakandeya',
    bandName: 'Bakandeya'
  },
  {
    id: 'con-alt-2',
    fecha: '2026-08-14',
    ciudad: 'Barcelona',
    sala: 'Sala Razzmatazz 2 (Ciclo World Music)',
    direccion: 'Carrer dels Almogàvers, 122, 08018 Barcelona',
    cache: 2800,
    aforo_vendido: 750,
    aforo_total: 800,
    contrato_firmado: true,
    estado_pago: 'anticipo',
    notas: 'Concierto especial de Repercusion.',
    tipo: 'sala',
    band_id: 'reg-repercusion',
    bandName: 'Repercusion'
  },
  {
    id: 'con-3',
    fecha: '2026-09-12',
    ciudad: 'Madrid',
    sala: 'Sala Caracol',
    direccion: 'Calle Bernardino Obregón, 18, 28012 Madrid',
    cache: 2200,
    aforo_vendido: 450,
    aforo_total: 500,
    contrato_firmado: false,
    estado_pago: 'pendiente',
    notas: 'Concierto propio de taquilla.',
    tipo: 'sala',
    band_id: 'band-bakandeya',
    bandName: 'Bakandeya'
  },
  {
    id: 'con-alt-3',
    fecha: '2026-09-12',
    ciudad: 'Barcelona',
    sala: 'Sala Apolo 1 (Fiesta Electro-Latin)',
    direccion: 'Carrer Nou de la Rambla, 113, 08004 Barcelona',
    cache: 3200,
    aforo_vendido: 1100,
    aforo_total: 1200,
    contrato_firmado: true,
    estado_pago: 'anticipo',
    notas: 'Concierto de Bakandeya en Apolo 1.',
    tipo: 'sala',
    band_id: 'band-bakandeya',
    bandName: 'Bakandeya'
  },
  {
    id: 'con-4',
    fecha: '2026-06-20',
    ciudad: 'Málaga',
    sala: 'Sala Trinchera',
    direccion: 'Calle Parauta, 25, 29006 Málaga',
    cache: 1800,
    aforo_vendido: 380,
    aforo_total: 400,
    contrato_firmado: true,
    estado_pago: 'pagado',
    notas: 'Llenazo absoluto en Málaga.',
    tipo: 'sala',
    band_id: 'band-bakandeya',
    bandName: 'Bakandeya'
  }
];

export const INITIAL_SOCIAL_POSTS: SocialPost[] = [
  {
    id: 'post-1',
    fecha: '2026-07-10',
    plataforma: 'Instagram',
    contenido: '🔥 ¡CALENTANDO MOTORES PARA EL CABO DE PLATA! 🔥\n\nSolo faltan 8 días para subirnos al Escenario Tierra. ¿Quién se viene a bailar ska-electrónico al atardecer? Os tenemos preparado un show que va a derretir la arena de Barbate. \n\n#Bakandeya #CaboDePlata #SkaReggae #FestejoMusical #Sintetizadores #ViolinBalkan',
    estado: 'borrador',
    responsable: 'Filgue'
  },
  {
    id: 'post-2',
    fecha: '2026-07-12',
    plataforma: 'TikTok',
    contenido: 'Vídeo corto: Grabación del ensayo general con la cámara lenta de la sección de percusión y violín saltando al unísono con el bajo de Filgue. Texto flotante: "Cuando el violín y la percusión deciden sincronizarse al 100% 🎻🥁🔋". Música de fondo: Demo de "Ska Brutal".',
    estado: 'borrador',
    responsable: 'Diego'
  },
  {
    id: 'post-3',
    fecha: '2026-07-06',
    plataforma: 'Instagram',
    contenido: '📸 Resumen fotográfico de lo que fue el conciertazo de Málaga en Sala Trinchera. El sur nunca falla. ¡Gracias infinitas por el sold out y por sudar la camiseta con nosotros! \n\nPróxima parada: Cabo de Plata, ¡vamos con todo! \n\n#SoldOut #Bakandeya #Trinchera #Malaga #ConciertoDirecto',
    estado: 'publicado',
    responsable: 'Diego'
  },
  {
    id: 'post-4',
    fecha: '2026-07-14',
    plataforma: 'YouTube',
    contenido: 'Subida del videoclip del directo en Málaga "Violín y Ritmo (En Vivo desde Trinchera)". Miniatura de alta resolución con el violín solista en primer plano y luces rojas de backstage.',
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
    remitente: 'Agente Redactor',
    mensaje: 'Hola gente! Acabo de actualizar la ficha de Sala Apolo con el hueco del 14 de noviembre que descubrió el Scout AI. El Redactor ya escribió el pitch de email, echadle un ojo en el panel de aprobación.',
    fecha: '2026-07-09T10:15:00',
    leido: true
  },
  {
    id: 'msg-2',
    remitente: 'Diego',
    mensaje: '¡Perfecto! Lo acabo de leer. Me parece brutal el pitch, pero creo que deberíamos añadirle que somos 6 músicos y que llevamos nuestro propio técnico de sonido de confianza.',
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
    remitente: 'Bakandeya Agent Manager IA',
    mensaje: 'Hecho, ya incluí los cambios en las notas. Recordad que este sábado 11 tenemos ensayo general a las 18:00 en Rock Palace. ¡Viene la banda al completo!',
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
    spotify: 85,
    notas: 'Inicio de la monitorización de campaña de primavera.'
  },
  {
    id: 'metric-2',
    fecha: '2026-05-15',
    instagram: 310,
    tiktok: 135,
    youtube: 18,
    spotify: 92,
    notas: 'Lanzamiento del EPK digital de la banda.'
  },
  {
    id: 'metric-3',
    fecha: '2026-06-01',
    instagram: 340,
    tiktok: 165,
    youtube: 22,
    spotify: 105,
    notas: 'Anuncio de la participación en el Cabo de Plata.'
  },
  {
    id: 'metric-4',
    fecha: '2026-06-15',
    instagram: 800,
    tiktok: 150,
    youtube: 30,
    spotify: 120,
    notas: 'Campaña publicitaria del directo en Trinchera Málaga.'
  },
  {
    id: 'metric-5',
    fecha: '2026-07-01',
    instagram: 1100,
    tiktok: 200,
    youtube: 32,
    spotify: 135,
    notas: 'Post del Sold Out en Málaga tuvo impacto orgánico en TikTok.'
  },
  {
    id: 'metric-6',
    fecha: '2026-07-12',
    instagram: 1348,
    tiktok: 252,
    youtube: 38,
    spotify: 142,
    notas: 'Registro previo a la actuación del Cabo de Plata.'
  },
  {
    id: 'metric-7',
    fecha: '2026-07-31',
    instagram: 1385,
    tiktok: 253,
    youtube: 42,
    spotify: 150,
    notas: 'Escaneo oficial verificado de redes sociales.'
  }
];

export const INITIAL_USERS = [
  {
    id: 'user-jose',
    username: 'jose',
    name: 'Jose',
    role: 'leader' as const,
    instrument: 'Percusión, Showman y Admin',
    avatarColor: '#10b981',
    initialPassword: 'bakandeya2026',
    createdAt: '2026-01-01T10:00:00.000Z'
  },
  {
    id: 'user-diego',
    username: 'diego',
    name: 'Diego',
    role: 'leader' as const,
    instrument: 'Mánager / Booking (Oficina)',
    avatarColor: '#06b6d4',
    initialPassword: 'bakandeya2026',
    createdAt: '2026-01-01T10:00:00.000Z'
  },
  {
    id: 'user-jon',
    username: 'jon',
    name: 'Jon',
    role: 'member' as const,
    instrument: 'Cantante, Loops y Percusión',
    avatarColor: '#ec4899',
    initialPassword: 'banda123',
    createdAt: '2026-01-01T10:00:00.000Z'
  },
  {
    id: 'user-elyar',
    username: 'elyar',
    name: 'Elyar',
    role: 'member' as const,
    instrument: 'Handpan y Percusión',
    avatarColor: '#8b5cf6',
    initialPassword: 'banda123',
    createdAt: '2026-01-01T10:00:00.000Z'
  },
  {
    id: 'user-raul',
    username: 'raul',
    name: 'Raúl',
    role: 'member' as const,
    instrument: 'Violín',
    avatarColor: '#f59e0b',
    initialPassword: 'banda123',
    createdAt: '2026-01-01T10:00:00.000Z'
  }
];

export const INITIAL_SONGS = [
  {
    id: 'song-cm-1',
    titulo: 'Intro (Live Casa México)',
    duracion: '1:30',
    duracionSegundos: 90,
    tonalidad: 'Am',
    bpm: 120,
    afinacion: 'E Standard',
    albumDisco: 'Directo Casa México',
    estadoTema: 'listo',
    esVersionCovers: false,
    notasInternas: 'Intro del directo en Casa México'
  },
  {
    id: 'song-cm-2',
    titulo: 'Tema1 (Live Casa México)',
    duracion: '3:45',
    duracionSegundos: 225,
    tonalidad: 'Em',
    bpm: 125,
    afinacion: 'E Standard',
    albumDisco: 'Directo Casa México',
    estadoTema: 'listo',
    esVersionCovers: false
  },
  {
    id: 'song-cm-3',
    titulo: 'Reggae Rock Style',
    duracion: '4:10',
    duracionSegundos: 250,
    tonalidad: 'Dm',
    bpm: 110,
    afinacion: 'E Standard',
    albumDisco: 'Directo Casa México',
    estadoTema: 'listo',
    esVersionCovers: false
  },
  {
    id: 'song-cm-4',
    titulo: 'Ska',
    duracion: '3:20',
    duracionSegundos: 200,
    tonalidad: 'Am',
    bpm: 145,
    afinacion: 'E Standard',
    albumDisco: 'Directo Casa México',
    estadoTema: 'listo',
    esVersionCovers: false
  },
  {
    id: 'song-cm-5',
    titulo: 'Llorona',
    duracion: '4:30',
    duracionSegundos: 270,
    tonalidad: 'Am',
    bpm: 100,
    afinacion: 'E Standard',
    albumDisco: 'Directo Casa México',
    estadoTema: 'listo',
    esVersionCovers: false
  },
  {
    id: 'song-1',
    titulo: 'Brisa y Cacharros',
    duracion: '3:30',
    duracionSegundos: 210,
    tonalidad: 'Am',
    bpm: 124,
    afinacion: 'E Standard',
    albumDisco: 'Álbum Debut (2025)',
    estadoTema: 'listo',
    esVersionCovers: false,
    enlaceAcordes: 'https://drive.google.com',
    notasInternas: 'Intro con sección de vientos y solo de trompeta. Gran fuerza en estribillos.'
  },
  {
    id: 'song-2',
    titulo: 'Fuego en la Sala',
    duracion: '4:12',
    duracionSegundos: 252,
    tonalidad: 'Em',
    bpm: 138,
    afinacion: 'E Standard',
    albumDisco: 'Álbum Debut (2025)',
    estadoTema: 'listo',
    esVersionCovers: false,
    notasInternas: 'Subida progresiva al final. Tema estelar de cierre en festival.'
  },
  {
    id: 'song-3',
    titulo: 'Noches de Garaje',
    duracion: '3:45',
    duracionSegundos: 225,
    tonalidad: 'Dm',
    bpm: 115,
    afinacion: 'Drop D',
    albumDisco: 'EP Cacharros & Ritmo',
    estadoTema: 'listo',
    esVersionCovers: false,
    notasInternas: 'Afinación especial en guitarra antes de empezar.'
  },
  {
    id: 'song-4',
    titulo: 'Ska del Norte',
    duracion: '3:15',
    duracionSegundos: 195,
    tonalidad: 'A Major',
    bpm: 152,
    afinacion: 'E Standard',
    albumDisco: 'Single 2026',
    estadoTema: 'listo',
    esVersionCovers: false,
    notasInternas: 'Ritmo acelerado ska. Ideal para subir la energía a mitad del concierto.'
  },
  {
    id: 'song-5',
    titulo: 'Canto a la Sombra',
    duracion: '5:10',
    duracionSegundos: 310,
    tonalidad: 'Bm',
    bpm: 96,
    afinacion: 'E Standard',
    albumDisco: 'Álbum Debut (2025)',
    estadoTema: 'listo',
    esVersionCovers: false,
    notasInternas: 'Balada rock progresiva con solo de violín de Raúl en la sección central.'
  },
  {
    id: 'song-6',
    titulo: 'Gira Sin Fin',
    duracion: '4:05',
    duracionSegundos: 245,
    tonalidad: 'G Major',
    bpm: 128,
    afinacion: 'E Standard',
    albumDisco: 'Álbum Debut (2025)',
    estadoTema: 'listo',
    esVersionCovers: false
  },
  {
    id: 'song-7',
    titulo: 'Mánager Fantasma',
    duracion: '3:50',
    duracionSegundos: 230,
    tonalidad: 'Cm',
    bpm: 120,
    afinacion: 'E Standard',
    albumDisco: 'Inéditas / En Proceso',
    estadoTema: 'ensayando',
    esVersionCovers: false,
    notasInternas: 'Sátira sobre los bots y mánagers virtuales. Ensayando para el próximo EP.'
  },
  {
    id: 'song-8',
    titulo: 'Maldita Dulzura (Cover)',
    duracion: '3:40',
    duracionSegundos: 220,
    tonalidad: 'C Major',
    bpm: 110,
    afinacion: 'E Standard',
    albumDisco: 'Covers & Versiones',
    estadoTema: 'listo',
    esVersionCovers: true,
    notasInternas: 'Versión acelerada adaptada a vientos y ritmo ska-rock.'
  }
];

export const INITIAL_SETLISTS = [
  {
    id: 'setlist-1',
    nombre: 'Festival Directo Caña 45 min',
    descripcion: 'Repertorio de máxima energía para festivales y horarios reducidos',
    tipoFormato: 'festival',
    duracionTotalEstimadaMinutos: 45,
    fechaCreacion: '2026-03-01',
    fechaUltimaEdicion: '2026-08-01',
    items: [
      { id: 'i-1', songId: 'song-1', tipoItem: 'cancion', notaTema: 'Arrancar directo sin intro' },
      { id: 'i-2', songId: 'song-2', tipoItem: 'cancion', notaTema: 'Empalmar batería con final de Brisa' },
      { id: 'i-3', songId: 'song-4', tipoItem: 'cancion', notaTema: 'Subidón ska' },
      { id: 'i-4', tipoItem: 'chapa', tituloCustom: 'Chapa / Presentación Banda & Agradecimientos', duracionEstimadaMinutos: 2, notaTema: 'Jon / Jose habla al público' },
      { id: 'i-5', songId: 'song-3', tipoItem: 'cancion', notaTema: 'Cambio de guitarra a Drop D' },
      { id: 'i-6', songId: 'song-6', tipoItem: 'cancion', notaTema: 'Estribillo con coros del público' },
      { id: 'i-7', tipoItem: 'bis', tituloCustom: 'BIS / CIERRE DE FESTIVAL', duracionEstimadaMinutos: 1 },
      { id: 'i-8', songId: 'song-5', tipoItem: 'cancion', notaTema: 'Solo final de violín extendido' }
    ]
  },
  {
    id: 'setlist-2',
    nombre: 'Concierto Sala Larga 75 min',
    descripcion: 'Setlist completo con temas del disco, covers y bloque acústico',
    tipoFormato: 'sala_larga',
    duracionTotalEstimadaMinutos: 75,
    fechaCreacion: '2026-04-10',
    fechaUltimaEdicion: '2026-07-20',
    items: [
      { id: 'i-10', songId: 'song-1', tipoItem: 'cancion' },
      { id: 'i-11', songId: 'song-2', tipoItem: 'cancion' },
      { id: 'i-12', songId: 'song-3', tipoItem: 'cancion' },
      { id: 'i-13', tipoItem: 'paron', tituloCustom: 'Descanso / Parón 5 min', duracionEstimadaMinutos: 5 },
      { id: 'i-14', songId: 'song-8', tipoItem: 'cancion', notaTema: 'Cover bailable' },
      { id: 'i-15', songId: 'song-4', tipoItem: 'cancion' },
      { id: 'i-16', songId: 'song-5', tipoItem: 'cancion' },
      { id: 'i-17', songId: 'song-6', tipoItem: 'cancion' }
    ]
  }
];



export const INITIAL_BANDS: any[] = [
  {
    id: 'band-1',
    nombre_banda: 'La Señora Tomasa',
    estilo_musical: 'Electro-Ska / Latin / Balkan',
    localizacion: 'Barcelona',
    estado_relacion: 'colegas_aliados',
    ultimo_contacto: '2026-07-28',
    contacto_nombre: 'Pau (Mánager / Guitarras)',
    email: 'booking@lasenoratomasa.com',
    telefono: '+34 654 321 098',
    instagram: '@lasenoratomasa',
    spotify_youtube: 'https://open.spotify.com/artist/lasenoratomasa',
    aforo_promedio: 800,
    notas_colaboracion: 'Colegas de festis. Dispuestos a compartir fecha en Sala Apolo (BCN) e invitar a Bakandeya, intercambio con Sala Caracol (Madrid).',
    ciudad_origen_swap: 'Barcelona'
  },
  {
    id: 'band-2',
    nombre_banda: 'Tarraco Ska Sound',
    estilo_musical: 'Traditional Ska / Roots Reggae',
    localizacion: 'Tarragona / Reus',
    estado_relacion: 'intercambio_propuesto',
    ultimo_contacto: '2026-07-22',
    contacto_nombre: 'Marc (Batería & Booking)',
    email: 'contact@tarracoska.cat',
    telefono: '+34 611 223 344',
    instagram: '@tarracoska',
    spotify_youtube: 'https://youtube.com/tarracoska_official',
    aforo_promedio: 300,
    notas_colaboracion: 'Propuesto concierto conjunto de doble cartel en Sala Zero (Tarragona) para Noviembre. Pendiente cerrar fecha exacta.',
    ciudad_origen_swap: 'Tarragona'
  },
  {
    id: 'band-3',
    nombre_banda: 'Balkan Paradise Orchestra',
    estilo_musical: 'Brass Balkan / World Music',
    localizacion: 'Barcelona',
    estado_relacion: 'concierto_agendado',
    ultimo_contacto: '2026-08-01',
    contacto_nombre: 'Alba (Trumpet / Co-direction)',
    email: 'info@balkanparadiseorchestra.com',
    telefono: '+34 677 889 900',
    instagram: '@balkanparadiseorchestra',
    spotify_youtube: 'https://open.spotify.com/artist/balkanparadise',
    aforo_promedio: 1200,
    notas_colaboracion: '¡Concierto agendado! Bakandeya abre su fecha especial en Sala Razzmatazz 2 el 14 de Noviembre de 2026.',
    ciudad_origen_swap: 'Barcelona'
  }
];

export const INITIAL_TOURS: Tour[] = [
  {
    id: 'tour-1',
    nombre: 'Gira Primavera Peninsular 2026',
    fechaInicio: '2026-05-15',
    fechaFin: '2026-05-24',
    vehiculo: 'Furgoneta 9 Plazas + Remolque',
    consumoL100km: 9.5,
    precioCarburanteEUR: 1.55,
    tipoCombustible: 'diesel',
    presupuestoLogistica: 850,
    estado: 'confirmada',
    stops: [
      {
        id: 'stop-1',
        ciudad: 'Madrid',
        sala: 'Sala Caracol',
        fecha: '2026-05-15',
        distanciaAnteriorKm: 0,
        tiempoConduccionHoras: 0,
        gastosAlojamiento: 120,
        gastosGasolina: 40,
        gastosDietas: 90,
        ingresoCacheEstimated: 1200,
        notasLogisticas: 'Carga de bártulos a las 15:00 en local.'
      },
      {
        id: 'stop-2',
        ciudad: 'Valencia',
        sala: '16 Toneladas',
        fecha: '2026-05-18',
        distanciaAnteriorKm: 350,
        tiempoConduccionHoras: 3.8,
        gastosAlojamiento: 180,
        gastosGasolina: 75,
        gastosDietas: 110,
        ingresoCacheEstimated: 1500,
        notasLogisticas: 'Prueba de sonido 18:00.'
      },
      {
        id: 'stop-3',
        ciudad: 'Barcelona',
        sala: 'Sala Apolo',
        fecha: '2026-05-22',
        distanciaAnteriorKm: 360,
        tiempoConduccionHoras: 3.9,
        gastosAlojamiento: 200,
        gastosGasolina: 80,
        gastosDietas: 120,
        ingresoCacheEstimated: 2000,
        notasLogisticas: 'Camerino disponible desde las 16:00.'
      }
    ]
  }
];
