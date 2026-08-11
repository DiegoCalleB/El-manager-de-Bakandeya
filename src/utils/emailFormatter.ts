import { EPKConfig, Lead } from '../types';

export interface EmailAttachment {
  filename: string;
  contentType: string;
  dataBase64: string;
}

export interface FormattedEmailResult {
  html: string;
  text: string;
  attachments: EmailAttachment[];
}

/**
 * Builds a valid binary PDF 1.4 base64 encoded document for Bakandeya's Dossier & EPK
 */
export function buildBakandeyaDossierPdfBase64(params?: {
  bandName?: string;
  contactEmail?: string;
  phone?: string;
}): string {
  const band = params?.bandName || 'Bakandeya';
  const email = params?.contactEmail || 'bakandeya@gmail.com';
  const phone = params?.phone || '+34 652 938 521';

  const header = '%PDF-1.4\n';
  const obj1 = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
  const obj2 = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';
  const obj3 =
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n';

  const streamLines = [
    'BT',
    '/F1 16 Tf',
    '50 730 Td',
    `(${band.toUpperCase()} - DOSSIER OFICIAL & KIT DE PRENSA) Tj`,
    '/F1 11 Tf',
    '0 -28 Td',
    '(Proyecto de Electronica-Fusion, Electro-Basureo & Directo de Escenario) Tj',
    '0 -20 Td',
    `(Contacto Directo Booking: ${email} | Tel: ${phone}) Tj`,
    '0 -30 Td',
    '------------------------------------------------------------------------- Tj',
    '0 -25 Td',
    '(RESUMEN DEL DOSSIER & FICHA TECNICA 2025) Tj',
    '0 -22 Td',
    '(- Musicos de trayectoria internacional: ex-Cirque du Soleil, STOMP, Toompak) Tj',
    '0 -18 Td',
    '(- Estilo: Percusion reciclada, Balkan, Reggae, Klezmer y DJ Live) Tj',
    '0 -18 Td',
    '(- Directo energico, festivo y muy participativo para todo tipo de publicos) Tj',
    '0 -18 Td',
    '(- Formato versatil: Escenario Principal / Formato Sala / Formato Acustico) Tj',
    '0 -30 Td',
    '(MATERIALES COMPLEMENTARIOS Y ENLACES OFICIALES:) Tj',
    '0 -18 Td',
    '(- Rider Tecnico Completo y Stage Plan) Tj',
    '0 -18 Td',
    '(- Repertorio, audios de estudio y videos de directo en alta calidad) Tj',
    '0 -30 Td',
    '(Kit de Prensa Completo (EPK): https://bandmanagement-ai.up.railway.app/epk) Tj',
    'ET',
  ];

  const streamContent = streamLines.join('\n');
  const streamLength = new TextEncoder().encode(streamContent).length;
  const obj4 = `4 0 obj\n<< /Length ${streamLength} >>\nstream\n${streamContent}\nendstream\nendobj\n`;
  const obj5 = '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n';

  const pos1 = header.length;
  const pos2 = pos1 + obj1.length;
  const pos3 = pos2 + obj2.length;
  const pos4 = pos3 + obj3.length;
  const pos5 = pos4 + obj4.length;
  const startxref = pos5 + obj5.length;

  const xref = `xref
0 6
0000000000 65535 f 
${String(pos1).padStart(10, '0')} 00000 n 
${String(pos2).padStart(10, '0')} 00000 n 
${String(pos3).padStart(10, '0')} 00000 n 
${String(pos4).padStart(10, '0')} 00000 n 
${String(pos5).padStart(10, '0')} 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
${startxref}
%%EOF`;

  const fullPdf = header + obj1 + obj2 + obj3 + obj4 + obj5 + xref;
  const bytes = new TextEncoder().encode(fullPdf);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function formatEmailWithSignatureAndDossier(params: {
  pitchText?: string;
  lead?: Partial<Lead> | null;
  epkConfig?: EPKConfig | null;
  senderName?: string;
  bandName?: string;
}): FormattedEmailResult {
  const { pitchText, lead, epkConfig, senderName, bandName } = params;

  const resolvedBandName = bandName || epkConfig?.contactoBooking?.nombre ? 'Bakandeya' : 'Bakandeya';
  const salaName = lead?.nombre_sala || 'vuestra sala';
  const salaCiudad = lead?.ciudad ? ` (${lead.ciudad})` : '';

  // 1. Fallback pitch text if empty
  let bodyContent = pitchText?.trim();
  if (!bodyContent) {
    bodyContent = `Hola equipo de ${salaName},\n\nOs escribimos de parte de ${resolvedBandName}, proyecto de electrónica-fusión y electró-basureo (percusión reciclada, reggae, balkan, klezmer y directo enérgico) radicado entre Madrid y Huelva.\n\nNos encantaría presentar nuestro directo en ${salaName}${salaCiudad} durante nuestra próxima gira.\n\nAdjuntamos a este correo nuestro Dossier Oficial en PDF con rider técnico, trayectoria y propuesta artística para que podáis consultarlo directamente.\n\nQuedamos a vuestra entera disposición para concretar fechas y condiciones.\n\n¡Un saludo!`;
  }

  // Check if bodyContent already has HTML
  const isAlreadyHtml = bodyContent.startsWith('<') || bodyContent.startsWith('<!DOCTYPE');
  
  // Format body text paragraphs cleanly
  const htmlBodyParagraphs = isAlreadyHtml
    ? bodyContent
    : bodyContent
        .split('\n\n')
        .map((paragraph) => `<p style="margin: 0 0 14px 0; line-height: 1.6; color: #1e293b; font-size: 15px;">${paragraph.replace(/\n/g, '<br>')}</p>`)
        .join('');

  // 2. Extract Signature details from epkConfig or defaults
  const firma = epkConfig?.firmaEmail;
  const booking = epkConfig?.contactoBooking;

  const remitenteNombre =
    (senderName && senderName.toLowerCase() !== 'equipo' ? senderName : null) ||
    firma?.nombreRemitente ||
    booking?.nombre ||
    'Diego de la Calle & Filgue';
  const cargo = firma?.cargo || 'Booking & Management Team';
  const telefono = firma?.telefono || booking?.telefono || '+34 652 938 521';
  const email = firma?.email || booking?.email || 'bakandeya@gmail.com';

  const dossierPdfUrl = epkConfig?.dossierPdfUrl || epkConfig?.dossierDocumentUrl || 'https://bandmanagement-ai.up.railway.app/epk';
  const dossierPdfName = epkConfig?.dossierPdfName || 'Dossier_Oficial_Bakandeya_2025.pdf';

  const spotify = epkConfig?.enlacesRedes?.spotify || 'https://open.spotify.com/artist/bakandeya';
  const instagram = epkConfig?.enlacesRedes?.instagram || 'https://instagram.com/Bakandeya';
  const youtube = epkConfig?.enlacesRedes?.youtube || 'https://youtube.com/@Bakandeya';

  // Check if user's pitch body already ends with a personal signature block
  const lowerBody = bodyContent.toLowerCase();
  const hasEmbeddedName = lowerBody.includes(remitenteNombre.toLowerCase()) || lowerBody.includes('diego de la calle');

  // 3. Construct natural, human HTML email body
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; color: #1e293b; line-height: 1.6; background-color: #ffffff; margin: 0; padding: 12px;">
  <div style="max-width: 650px; margin: 0 auto; background: #ffffff;">
    
    <!-- PITCH TEXT -->
    <div style="font-size: 15px; color: #1e293b; line-height: 1.6;">
      ${htmlBodyParagraphs}
    </div>

    <!-- NATURAL HUMAN SIGNATURE BLOCK -->
    <div style="margin-top: 24px; padding-top: 14px; border-top: 1px solid #e2e8f0; font-size: 14px; color: #334155;">
      ${
        !hasEmbeddedName
          ? `<div style="font-weight: 700; font-size: 15px; color: #0f172a;">${remitenteNombre}</div>`
          : ''
      }
      <div style="color: #0284c7; font-weight: 600; font-size: 13px; margin-top: 2px;">${cargo} — ${resolvedBandName}</div>
      
      <div style="font-size: 13px; color: #475569; margin-top: 6px;">
        📱 <a href="tel:${telefono.replace(/\s+/g, '')}" style="color: #334155; text-decoration: none;">${telefono}</a> &nbsp;|&nbsp; 
        ✉️ <a href="mailto:${email}" style="color: #0284c7; text-decoration: none;">${email}</a>
      </div>

      <div style="font-size: 13px; margin-top: 8px;">
        🌐 <a href="${dossierPdfUrl}" style="color: #0284c7; text-decoration: underline; font-weight: 500;">Kit de Prensa (EPK)</a> &nbsp;•&nbsp; 
        <a href="${spotify}" style="color: #0284c7; text-decoration: underline; font-weight: 500;">Spotify</a> &nbsp;•&nbsp; 
        <a href="${instagram}" style="color: #0284c7; text-decoration: underline; font-weight: 500;">Instagram</a> &nbsp;•&nbsp; 
        <a href="${youtube}" style="color: #0284c7; text-decoration: underline; font-weight: 500;">YouTube</a>
      </div>
    </div>

  </div>
</body>
</html>`.trim();

  // 4. Plain text version
  const text = `
${bodyContent}

--
${remitenteNombre}
${cargo} — ${resolvedBandName}
Tel: ${telefono} | Email: ${email}
EPK / Dossier: ${dossierPdfUrl}
Spotify: ${spotify} | Instagram: ${instagram}
`.trim();

  // 5. Generate REAL PDF attachment
  const dossierPdfBase64 = buildBakandeyaDossierPdfBase64({
    bandName: resolvedBandName,
    contactEmail: email,
    phone: telefono,
  });

  const attachments: EmailAttachment[] = [
    {
      filename: dossierPdfName.endsWith('.pdf') ? dossierPdfName : `${dossierPdfName}.pdf`,
      contentType: 'application/pdf',
      dataBase64: dossierPdfBase64,
    },
  ];

  return { html, text, attachments };
}

