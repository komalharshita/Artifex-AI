import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Download, Layers2, RotateCcw, Sparkles, Type, Palette as PaletteIcon, LayoutGrid } from 'lucide-react';
import {
  createPosterSvg,
  DEFAULT_POSTER,
  nextVariation,
  PALETTES,
  POSTER_SIZES,
  type Alignment,
  type Composition,
  type FontChoice,
  type Pattern,
  type PosterData,
  type PosterSize,
  type PosterStyle,
} from './artifex-poster-engine';
import './artifex-create.css';

const STORAGE_KEY = 'artifex-ai-poster-v1';
function loadSaved(): PosterData {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...DEFAULT_POSTER, ...JSON.parse(saved) } : DEFAULT_POSTER;
  } catch {
    return DEFAULT_POSTER;
  }
}

export default function ArtifexCreate() {
  const [poster, setPoster] = useState<PosterData>(loadSaved);
  const [message, setMessage] = useState('');
  const [exportError, setExportError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSaving(true);
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(poster));
        setSaving(false);
      } catch {
        setSaving(false);
        setMessage('Autosave is unavailable in this browser session.');
      }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [poster]);

  const svg = useMemo(() => createPosterSvg(poster), [poster]);
  const sizeInfo = POSTER_SIZES[poster.size];
  const update = <K extends keyof PosterData>(key: K, value: PosterData[K]) =>
    setPoster((current) => ({ ...current, [key]: value }));

  const choosePalette = (id: string) => {
    const palette = PALETTES.find((item) => item.id === id);
    if (palette) setPoster((current) => ({ ...current, palette: id, background: palette.background, accent: palette.accent }));
  };

  const generate = (regenerate = false) => {
    setPoster((current) => {
      const variation = regenerate
        ? nextVariation(current.variation)
        : (['minimal', 'editorial', 'graphic'] as PosterStyle[]).indexOf(current.style);
      return {
        ...current,
        variation,
        style: regenerate
          ? (['minimal', 'editorial', 'graphic'] as PosterStyle[])[variation]
          : current.style,
      };
    });
    setMessage(regenerate ? 'A fresh composition is ready. Your event details stayed in place.' : 'Template composition generated from your event details.');
    window.setTimeout(() => setMessage(''), 3800);
  };

  const reset = () => {
    setPoster({ ...DEFAULT_POSTER, title: '', description: '', date: '', time: '', venue: '', organizer: '', cta: 'Join us', instructions: '' });
    setMessage('New poster started. Your previous draft was replaced.');
    setExportError('');
    window.setTimeout(() => setMessage(''), 3800);
  };

  const exportPng = async () => {
    setExportError('');
    try {
      const { width, height } = sizeInfo;
      const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      const objectUrl = URL.createObjectURL(blob);
      try {
        const image = new Image();
        image.decoding = 'async';
        image.src = objectUrl;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Canvas is unavailable in this browser.');
        context.drawImage(image, 0, 0, width, height);
        const png = await new Promise<Blob>((resolve, reject) =>
          canvas.toBlob((result) => result ? resolve(result) : reject(new Error('The PNG could not be created.')), 'image/png'),
        );
        const downloadUrl = URL.createObjectURL(png);
        const anchor = document.createElement('a');
        anchor.href = downloadUrl;
        anchor.download = `${(poster.title || 'artifex-poster').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${poster.size}.png`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(downloadUrl);
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
      setMessage(`PNG exported at ${width} × ${height}px.`);
      window.setTimeout(() => setMessage(''), 3800);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Export failed. Please try again.');
    }
  };

  const variations = [
    { title: 'Minimal & Elegant', sub: 'Quiet type, generous space', icon: 'minimal', style: 'minimal' as PosterStyle },
    { title: 'Editorial', sub: 'Artful balance & detail', icon: 'editorial', style: 'editorial' as PosterStyle },
    { title: 'Bold & Graphic', sub: 'Confident shape & contrast', icon: 'bold', style: 'graphic' as PosterStyle },
  ];

  return (
    <main className="artifex-editor">
      <header className="ae-topbar">
        <a className="ae-brand" href="/" aria-label="Artifex AI home" data-testid="link-editor-home">
          <span className="ae-mark" aria-hidden="true">a</span>
          <span>artifex<span style={{ fontWeight: 400 }}> ai</span></span>
        </a>
        <div className="ae-top-right">
          <span className="ae-save-state" aria-live="polite"><i className="ae-save-dot" />{saving ? 'SAVING DRAFT' : 'SAVED LOCALLY'}</span>
          <a className="ae-home" href="/" data-testid="return-to-home"><ArrowLeft size={15} /> Return to home</a>
        </div>
      </header>

      <section className="ae-heading">
        <div>
          <p className="ae-kicker">The poster studio · local templates</p>
          <h1>Make the moment visible.</h1>
          <p>Shape an event brief into a poster you can make your own.</p>
        </div>
        <div className="ae-heading-tools">
          <button className="ae-button" type="button" onClick={reset} data-testid="new-poster"><RotateCcw size={14} /> New poster</button>
          <button className="ae-button ae-button-primary" type="button" onClick={() => generate(false)} data-testid="generate-poster"><Sparkles size={14} /> Generate poster</button>
        </div>
      </section>

      <div className="ae-workspace">
        <section className="ae-panel ae-form-panel ae-event-panel" aria-label="Event and poster details">
          <div className="ae-panel-heading"><h2>Event details</h2><span className="ae-step">01 / 03</span></div>
          <div className="ae-fields">
            <div className="ae-field ae-field-full"><label htmlFor="poster-title">Poster title</label><input id="poster-title" className="ae-control" value={poster.title} onChange={(e) => update('title', e.target.value)} placeholder="A title worth stopping for" data-testid="poster-title" /></div>
            <div className="ae-field ae-field-full"><label htmlFor="poster-description">Subtitle / description</label><textarea id="poster-description" className="ae-control ae-textarea" value={poster.description} onChange={(e) => update('description', e.target.value)} placeholder="A line or two about the experience" data-testid="poster-description" /></div>
            <div className="ae-field"><label htmlFor="poster-date">Date</label><input id="poster-date" className="ae-control" value={poster.date} onChange={(e) => update('date', e.target.value)} placeholder="Saturday, 18 May" data-testid="poster-date" /></div>
            <div className="ae-field"><label htmlFor="poster-time">Time</label><input id="poster-time" className="ae-control" value={poster.time} onChange={(e) => update('time', e.target.value)} placeholder="Doors at 7:30 PM" data-testid="poster-time" /></div>
            <div className="ae-field ae-field-full"><label htmlFor="poster-venue">Venue</label><input id="poster-venue" className="ae-control" value={poster.venue} onChange={(e) => update('venue', e.target.value)} placeholder="Venue and city" data-testid="poster-venue" /></div>
            <div className="ae-field"><label htmlFor="poster-organizer">Organizer / brand</label><input id="poster-organizer" className="ae-control" value={poster.organizer} onChange={(e) => update('organizer', e.target.value)} placeholder="Presented by" data-testid="poster-organizer" /></div>
            <div className="ae-field"><label htmlFor="poster-cta">CTA text</label><input id="poster-cta" className="ae-control" value={poster.cta} onChange={(e) => update('cta', e.target.value)} placeholder="Find your seat" data-testid="poster-cta" /></div>
          </div>
        </section>

        <section className="ae-workspace-right ae-panel ae-canvas-panel" aria-label="Live poster preview and export">
          <div className="ae-preview-top">
            <div className="ae-preview-label"><Layers2 size={15} /> Live composition <span className="ae-template-tag">Template-generated</span></div>
            <span className="ae-preview-size">{sizeInfo.width} × {sizeInfo.height}</span>
          </div>
          <div className="ae-preview-stage">
            <div className={`ae-poster-frame ${poster.size}`} role="img" aria-label={`Poster preview: ${poster.title || 'Untitled event'}`} data-testid="poster-preview" dangerouslySetInnerHTML={{ __html: svg }} />
          </div>
          <div className="ae-variation-strip" role="group" aria-label="Design variations">
            {variations.map((variation, index) => <button key={variation.title} type="button" className="ae-variation" onClick={() => setPoster((current) => ({ ...current, variation: index, style: variation.style }))} aria-pressed={poster.variation === index} data-testid={`variation-${index}`}><span className={`ae-variation-icon ${variation.icon}`} /><span><strong>{variation.title}</strong><small>{variation.sub}</small></span></button>)}
          </div>
          <div className="ae-preview-actions">
            <div className="ae-action-group">
              <button className="ae-button ae-button-accent" type="button" onClick={() => generate(true)} data-testid="regenerate-design"><Sparkles size={14} /> Regenerate design</button>
              <button className="ae-button ae-button-primary" type="button" onClick={exportPng} data-testid="export-png"><Download size={14} /> Export PNG</button>
            </div>
            <span className="ae-export-note">Exact size · locally rendered</span>
          </div>
          <p className={`ae-status${exportError ? ' error' : ''}`} role={exportError ? 'alert' : 'status'} data-testid="editor-status">{exportError || message || 'This is a local template composition, not an AI-generated image.'}</p>
        </section>

        <section className="ae-panel ae-form-panel ae-design-panel" aria-label="Poster design controls">
          <div className="ae-panel-heading"><h2>Design controls</h2><span className="ae-step">02 / 03</span></div>
          <div className="ae-section">
            <h3 className="ae-section-title"><PaletteIcon size={13} /> Art direction</h3>
            <div className="ae-field" style={{ marginBottom: 12 }}>
              <span className="ae-label">Color palette</span>
              <div className="ae-palettes" role="group" aria-label="Color palette">
                {PALETTES.map((palette) => <button key={palette.id} type="button" className="ae-palette" onClick={() => choosePalette(palette.id)} aria-pressed={poster.palette === palette.id} data-testid={`palette-${palette.id}`}><span className="ae-swatches"><i style={{ background: palette.background }} /><i style={{ background: palette.accent }} /></span>{palette.name}</button>)}
              </div>
            </div>
            <div className="ae-fields">
              <div className="ae-field"><label htmlFor="background-color">Background</label><input id="background-color" type="color" className="ae-control" value={poster.background} onChange={(e) => update('background', e.target.value)} data-testid="background-color" /></div>
              <div className="ae-field"><label htmlFor="accent-color">Accent color</label><input id="accent-color" type="color" className="ae-control" value={poster.accent} onChange={(e) => update('accent', e.target.value)} data-testid="accent-color" /></div>
              <div className="ae-field"><label htmlFor="poster-size">Poster size</label><select id="poster-size" className="ae-control ae-select" value={poster.size} onChange={(e) => update('size', e.target.value as PosterSize)} data-testid="poster-size">{Object.entries(POSTER_SIZES).map(([key, size]) => <option key={key} value={key}>{size.label} · {size.width} × {size.height}</option>)}</select></div>
              <div className="ae-field"><label htmlFor="poster-style">Poster style</label><select id="poster-style" className="ae-control ae-select" value={poster.style} onChange={(e) => update('style', e.target.value as PosterStyle)} data-testid="poster-style"><option value="minimal">Minimal & elegant</option><option value="editorial">Editorial</option><option value="graphic">Bold & graphic</option></select></div>
            </div>
          </div>
          <div className="ae-section">
            <h3 className="ae-section-title"><Type size={13} /> Typography</h3>
            <div className="ae-fields">
              <div className="ae-field"><label htmlFor="poster-font">Typeface</label><select id="poster-font" className="ae-control ae-select" value={poster.font} onChange={(e) => update('font', e.target.value as FontChoice)} data-testid="poster-font"><option value="serif">Literary serif</option><option value="sans">Modern sans</option><option value="mono">Studio mono</option></select></div>
              <div className="ae-field"><label htmlFor="poster-alignment">Text alignment</label><select id="poster-alignment" className="ae-control ae-select" value={poster.alignment} onChange={(e) => update('alignment', e.target.value as Alignment)} data-testid="poster-alignment"><option value="left">Left aligned</option><option value="center">Centered</option><option value="right">Right aligned</option></select></div>
              <div className="ae-field ae-field-full"><label htmlFor="title-size">Title size</label><div className="ae-range-line"><input id="title-size" type="range" min="52" max="118" value={poster.titleSize} onChange={(e) => update('titleSize', Number(e.target.value))} data-testid="title-size" /><span className="ae-range-value">{poster.titleSize}</span></div></div>
            </div>
          </div>
          <div className="ae-section">
            <h3 className="ae-section-title"><LayoutGrid size={13} /> Composition details</h3>
            <div className="ae-field" style={{ marginBottom: 12 }}>
              <span className="ae-label">Layout</span>
              <div className="ae-layout-options" role="group" aria-label="Composition layout">
                {(['centered', 'split', 'framed'] as Composition[]).map((option) => <button className="ae-layout-button" type="button" key={option} onClick={() => update('composition', option)} aria-pressed={poster.composition === option} data-testid={`composition-${option}`}><span className={`ae-layout-glyph ${option}`} />{option[0].toUpperCase() + option.slice(1)}</button>)}
              </div>
            </div>
            <div className="ae-fields">
              <div className="ae-field"><label htmlFor="poster-pattern">Decorative pattern</label><select id="poster-pattern" className="ae-control ae-select" value={poster.pattern} onChange={(e) => update('pattern', e.target.value as Pattern)} data-testid="poster-pattern"><option value="orbit">Orbit lines</option><option value="grid">Fine grid</option><option value="petals">Petal marks</option><option value="none">No pattern</option></select></div>
              <div className="ae-field"><label htmlFor="creative-instructions">Creative instructions</label><input id="creative-instructions" className="ae-control" value={poster.instructions} onChange={(e) => update('instructions', e.target.value)} placeholder="e.g. airy, nocturnal" data-testid="creative-instructions" /></div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
