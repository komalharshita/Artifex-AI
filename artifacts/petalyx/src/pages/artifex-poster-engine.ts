export type PosterSize = 'portrait' | 'square' | 'landscape';
export type PosterStyle = 'minimal' | 'editorial' | 'graphic';
export type Composition = 'centered' | 'split' | 'framed';
export type Pattern = 'orbit' | 'grid' | 'petals' | 'none';
export type FontChoice = 'serif' | 'sans' | 'mono';
export type Alignment = 'left' | 'center' | 'right';

export type PosterData = {
  title: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  organizer: string;
  cta: string;
  instructions: string;
  style: PosterStyle;
  size: PosterSize;
  palette: string;
  background: string;
  accent: string;
  composition: Composition;
  pattern: Pattern;
  font: FontChoice;
  alignment: Alignment;
  titleSize: number;
  variation: number;
};

export const POSTER_SIZES: Record<PosterSize, { width: number; height: number; label: string }> = {
  portrait: { width: 1080, height: 1350, label: 'Portrait' },
  square: { width: 1080, height: 1080, label: 'Square' },
  landscape: { width: 1350, height: 1080, label: 'Landscape' },
};

export const DEFAULT_POSTER: PosterData = {
  title: 'A softer kind of sound',
  description: 'An evening of live music, slow rhythms, and good company.',
  date: 'Saturday, 18 May',
  time: 'Doors at 7:30 PM',
  venue: 'The Glasshouse · Brooklyn',
  organizer: 'FIELD NOTES PRESENTS',
  cta: 'Find your seat',
  instructions: '',
  style: 'editorial',
  size: 'portrait',
  palette: 'olive',
  background: '#e9eedb',
  accent: '#bd5472',
  composition: 'split',
  pattern: 'orbit',
  font: 'serif',
  alignment: 'left',
  titleSize: 92,
  variation: 1,
};

export const PALETTES = [
  { id: 'olive', name: 'Olive / petal', background: '#e9eedb', accent: '#bd5472', ink: '#273322' },
  { id: 'citrus', name: 'Citrus / ink', background: '#d9ed74', accent: '#273322', ink: '#273322' },
  { id: 'rose', name: 'Rose / moss', background: '#f2d9dd', accent: '#4c672d', ink: '#38272d' },
  { id: 'night', name: 'Ink / lime', background: '#26342b', accent: '#d5ed72', ink: '#f3f0e4' },
  { id: 'cream', name: 'Parchment / plum', background: '#f4e9d6', accent: '#874254', ink: '#302d29' },
];

const escapeXml = (value: string) =>
  value.replace(/[<>&'"]/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[char] || char);

function wrapWords(text: string, limit: number, maxLines = 4) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  words.forEach((word) => {
    const next = line ? `${line} ${word}` : word;
    if (next.length > limit && line) {
      lines.push(line);
      line = word;
    } else line = next;
  });
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    lines.length = maxLines;
    const last = lines[maxLines - 1];
    lines[maxLines - 1] = `${last.replace(/[.,;:!?]?$/, '')}…`;
  }
  return lines.length ? lines : [''];
}

const fontFamily = (font: FontChoice) =>
  font === 'serif' ? 'Georgia, Times New Roman, serif' : font === 'mono' ? 'Courier New, monospace' : 'Arial, sans-serif';

/**
 * The same deterministic SVG is used for the live preview and PNG export.
 * It is self-contained, so the exported artwork has no external dependencies.
 */
export function createPosterSvg(data: PosterData) {
  const { width, height } = POSTER_SIZES[data.size];
  const landscape = data.size === 'landscape';
  const margin = landscape ? 82 : 76;
  const align = data.alignment;
  const anchor = align === 'center' ? 'middle' : align === 'right' ? 'end' : 'start';
  const x = align === 'center' ? width / 2 : align === 'right' ? width - margin : margin;
  const ink = data.palette === 'night' && data.background === DEFAULT_POSTER.background ? '#f3f0e4' : undefined;
  const textColor = ink || (data.background.toLowerCase() === '#26342b' ? '#f3f0e4' : '#273322');
  const accent = data.accent;
  const titleLines = wrapWords(data.title || 'Your event title', landscape ? 20 : 15, landscape ? 3 : 4);
  const descriptionLines = wrapWords(data.description || 'Your event description goes here.', landscape ? 43 : 31, 3);
  const dateLines = [data.date, data.time].filter(Boolean);
  const font = fontFamily(data.font);
  const variation = data.variation;
  const isBold = data.style === 'graphic';
  const isMinimal = data.style === 'minimal';
  const titleSize = Math.max(38, Math.min(data.titleSize, landscape ? 102 : 118)) * (isBold ? 1.08 : 1);
  const titleLeading = titleSize * 0.95;
  const bandY = landscape ? height * 0.68 : height * 0.72;
  const bodyStart = landscape ? height * 0.49 : height * 0.52;
  const titleStart = landscape ? height * 0.25 : height * 0.29;
  const descY = titleStart + titleLines.length * titleLeading + 30;
  const metadataY = Math.max(descY + descriptionLines.length * 32 + 46, bodyStart + 150);
  const titleSvg = titleLines.map((line, index) =>
    `<text x="${x}" y="${titleStart + index * titleLeading}" text-anchor="${anchor}" font-family="${font}" font-size="${titleSize}" font-weight="${isBold ? 800 : 500}" letter-spacing="${isBold ? -4 : -2}">${escapeXml(line)}</text>`,
  ).join('');
  const descriptionSvg = descriptionLines.map((line, index) =>
    `<text x="${x}" y="${descY + index * 34}" text-anchor="${anchor}" font-family="${font}" font-size="25" opacity=".78">${escapeXml(line)}</text>`,
  ).join('');
  const dateSvg = dateLines.map((line, index) =>
    `<text x="${x}" y="${metadataY + index * 36}" text-anchor="${anchor}" font-family="${font}" font-size="25" font-weight="${index === 0 ? 700 : 400}">${escapeXml(line)}</text>`,
  ).join('');
  const maxTextY = height - margin - 70;
  const safeOrganizer = data.organizer || 'YOUR ORGANIZATION';
  const venueY = Math.min(metadataY + dateLines.length * 36 + 24, maxTextY - 55);
  const ctaY = height - margin - 6;
  const titleDecoration = isMinimal ? '' : `<path d="M${margin} ${titleStart - 28} H${margin + (variation === 1 ? 96 : 156)}" stroke="${accent}" stroke-width="${variation === 2 ? 10 : 4}" />`;
  let patternSvg = '';
  if (data.pattern === 'orbit') {
    patternSvg = `<circle cx="${width - margin * 1.15}" cy="${height * .18}" r="${width * .14}" fill="none" stroke="${accent}" stroke-width="2" opacity=".48"/><circle cx="${width - margin * 1.15}" cy="${height * .18}" r="${width * .105}" fill="none" stroke="${accent}" stroke-width="1" opacity=".34"/><circle cx="${width - margin * 1.15}" cy="${height * .18}" r="8" fill="${accent}"/>`;
  } else if (data.pattern === 'grid') {
    patternSvg = `<g opacity=".17" stroke="${textColor}" stroke-width="1">${Array.from({ length: 8 }, (_, i) => `<path d="M${margin + i * 32} ${height - margin - 230}v210"/>`).join('')}${Array.from({ length: 6 }, (_, i) => `<path d="M${margin} ${height - margin - 230 + i * 34}h224"/>`).join('')}</g>`;
  } else if (data.pattern === 'petals') {
    patternSvg = `<g fill="${accent}" opacity=".58"><path d="M${width - margin * 2} ${height * .13}c48-35 82 22 27 52-13-16-21-33-27-52Z"/><path d="M${width - margin * 1.2} ${height * .21}c45-43 83 4 36 44-15-12-26-27-36-44Z"/><circle cx="${width - margin * 1.5}" cy="${height * .2}" r="8"/></g>`;
  }
  const baseShape = data.composition === 'framed'
    ? `<rect x="${margin / 2}" y="${margin / 2}" width="${width - margin}" height="${height - margin}" rx="${isMinimal ? 0 : 12}" fill="none" stroke="${accent}" stroke-width="${isBold ? 8 : 2}" opacity=".8"/>`
    : data.composition === 'split'
      ? `<rect x="0" y="${bandY}" width="${width}" height="${height - bandY}" fill="${accent}" opacity="${isBold ? .22 : .11}"/>`
      : '';
  const visual = isBold
    ? `<path d="M0 ${height * .82} L${width * .28} ${height * .58} L${width * .43} ${height * .78} L${width} ${height * .52} V${height} H0Z" fill="${accent}" opacity=".28"/><circle cx="${width * .82}" cy="${height * .2}" r="${width * .19}" fill="${accent}" opacity=".2"/>`
    : variation === 1
      ? `<circle cx="${width * .83}" cy="${height * .23}" r="${width * .17}" fill="${accent}" opacity=".12"/><path d="M${margin} ${height * .78} C${width * .32} ${height * .71},${width * .65} ${height * .89},${width - margin} ${height * .77}" fill="none" stroke="${accent}" stroke-width="2" opacity=".65"/>`
      : '';
  const sideText = landscape && data.composition === 'split'
    ? `<path d="M${width * .65} ${margin}V${height - margin}" stroke="${accent}" stroke-width="2" opacity=".55"/>`
    : '';
  const organizerSvg = `<text x="${x}" y="${margin + 18}" text-anchor="${anchor}" font-family="${font}" font-size="17" font-weight="700" letter-spacing="3">${escapeXml(safeOrganizer.toUpperCase())}</text>`;
  const venueSvg = `<text x="${x}" y="${venueY}" text-anchor="${anchor}" font-family="${font}" font-size="22" opacity=".85">${escapeXml(data.venue || 'Venue to be announced')}</text>`;
  const ctaSvg = `<text x="${x}" y="${ctaY}" text-anchor="${anchor}" font-family="${font}" font-size="19" font-weight="700" letter-spacing="1">${escapeXml((data.cta || 'JOIN US').toUpperCase())}</text>`;
  const instructionTag = data.instructions.trim()
    ? `<text x="${width - margin}" y="${margin + 18}" text-anchor="end" font-family="${font}" font-size="11" opacity=".46">DIRECTION · ${escapeXml(data.instructions.trim().slice(0, 48).toUpperCase())}</text>`
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="${data.background}"/>${visual}${patternSvg}${baseShape}${sideText}${titleDecoration}${organizerSvg}${instructionTag}${titleSvg}${descriptionSvg}${dateSvg}${venueSvg}<path d="M${align === 'right' ? x - 76 : align === 'center' ? x - 38 : x} ${ctaY - 29}h76" stroke="${accent}" stroke-width="2"/>${ctaSvg}</svg>`;
}

export function nextVariation(current: number) {
  return (current + 1) % 3;
}
