const { useCallback, useEffect, useMemo, useRef, useState } = React;

const WB_MIME = 'application/studyflow-whiteboard+json';
const PALETTE = ['#0f172a', '#475569', '#ef4444', '#f97316', '#f59e0b', '#eab308', '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#a855f7', '#ec4899', '#ffffff'];
const PASTELS = ['#fef3a0', '#bfdbfe', '#fbcfe8', '#bbf7d0', '#fed7aa', '#e9d5ff', '#fecaca'];
const STICKY_THEMES = [
  { bg: '#fef3a0', border: '#eab308' },
  { bg: '#bfdbfe', border: '#3b82f6' },
  { bg: '#fbcfe8', border: '#ec4899' },
  { bg: '#bbf7d0', border: '#22c55e' },
  { bg: '#fed7aa', border: '#f97316' },
  { bg: '#e9d5ff', border: '#a855f7' },
];

const STICKER_CATEGORIES = [
  { name: 'Beliebt',    items: ['⭐', '✅', '❗', '💡', '🔥', '🎯', '📌', '🏆', '⚡', '💯', '✨', '💥'] },
  { name: 'Lernen',     items: ['📚', '📖', '✏️', '📝', '🎓', '🧠', '🔬', '💻', '📐', '🧮', '🖊️', '🔭', '📊', '📈', '📉', '🗂️'] },
  { name: 'Reaktionen', items: ['👍', '❤️', '🎉', '😍', '🙌', '👏', '🤔', '😎', '🥳', '💪', '🤩', '👋', '🫶', '🤯', '😅', '🙏'] },
  { name: 'Natur',      items: ['🚀', '💎', '🌈', '🌟', '🦋', '🎨', '🔮', '💫', '🌸', '🏅', '🍀', '🦄', '🌙', '🌺', '🌻', '⭐'] },
  { name: 'Status',     items: ['✔️', '❌', '⚠️', '❓', '🔄', '⏳', '🔒', '📍', '🆕', '🔑', '🚧', '🎖️', '📎', '🗝️', '🔓', '📬'] },
];

const TEMPLATES = [
  { id: 'mindmap',  name: 'Mind Map',          desc: 'Brainstorming für ein Thema',            icon: '🧠' },
  { id: 'flow',     name: 'Flussdiagramm',     desc: 'Prozess oder Ablauf visualisieren',      icon: '📊' },
  { id: 'matrix',   name: 'Eisenhower-Matrix', desc: 'Aufgaben nach Wichtigkeit sortieren',    icon: '🗂️' },
  { id: 'cards',    name: 'Lern-Karteikarten', desc: 'Karten gruppieren und verbinden',        icon: '🃏' },
  { id: 'swot',     name: 'SWOT-Analyse',      desc: 'Stärken, Schwächen, Chancen, Risiken',  icon: '🔍' },
  { id: 'timeline', name: 'Zeitleiste',         desc: 'Ereignisse chronologisch darstellen',   icon: '📅' },
  { id: 'cornell',  name: 'Cornell-Notizen',   desc: 'Strukturierte Mitschriften',             icon: '📋' },
  { id: 'kanban',   name: 'Kanban-Board',      desc: 'Aufgaben nach Status verwalten',         icon: '📌' },
];

const PEN_SIZES = [
  { id: 'thin',   label: 'Dünn',   size: 1.5, dot: 5  },
  { id: 'normal', label: 'Normal', size: 3,   dot: 9  },
  { id: 'thick',  label: 'Dick',   size: 7,   dot: 13 },
  { id: 'brush',  label: 'Pinsel', size: 18,  dot: 18 },
];

const LINE_STYLES = [
  { id: 'solid',  label: 'Durchgehend', dash: []     },
  { id: 'dashed', label: 'Gestrichelt', dash: [8, 5] },
  { id: 'dotted', label: 'Gepunktet',   dash: [2, 5] },
];

const ARROW_ENDS = [
  { id: 'none',  label: 'Keine Pfeile',    icon: '━' },
  { id: 'end',   label: 'Pfeil am Ende',   icon: '→' },
  { id: 'both',  label: 'Beide Pfeile',    icon: '↔' },
  { id: 'start', label: 'Pfeil am Start',  icon: '←' },
];

const SHORTCUT_MAP = {
  'v': 'select', 'h': 'pan', 'p': 'pen', 'm': 'highlight',
  'e': 'eraser', 'n': 'note', 'r': 'rect', 'c': 'circle',
  'a': 'arrow', 't': 'text', 'i': 'image', 'f': 'frame', 's': 'sticker',
};

const DEFAULT_BOARD = () => ({
  strokes: [],
  shapes: [],
  texts: [],
  notes: [],
  emojis: [],
  frames: [],
  comments: [],
  images: [],
});

const randomId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const clone = (value) => JSON.parse(JSON.stringify(value));
const dist2 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

const ToolIcon = ({ children, size = 18 }) => (
  <Icon size={size} stroke={1.9}>
    {children}
  </Icon>
);

const TOOL_DEFS = {
  select:    { label: 'Auswählen (V)',  icon: <ToolIcon><path d="M5 3l13 8-6 2-2 6z" fill="currentColor" stroke="none"/></ToolIcon> },
  pan:       { label: 'Verschieben (H)',icon: <ToolIcon><path d="M9 11V5a2 2 0 0 1 4 0v6"/><path d="M9 11V8a2 2 0 0 0-4 0v6c0 4 3 7 7 7s7-3 7-7v-3a2 2 0 0 0-4 0v-1a2 2 0 0 0-4 0"/></ToolIcon> },
  pen:       { label: 'Stift (P)',      icon: <Icons.Edit size={18}/> },
  highlight: { label: 'Marker (M)',     icon: <ToolIcon><path d="M4 15l7-7 5 5-7 7H4z"/><path d="M13 6l2-2 5 5-2 2"/></ToolIcon> },
  eraser:    { label: 'Radierer (E)',   icon: <ToolIcon><path d="M20 20H7l-4-4 9-9 8 8z"/><path d="M16 16l-7-7"/></ToolIcon> },
  note:      { label: 'Notiz (N)',      icon: <ToolIcon><path d="M4 4h16v16H4z" rx="3"/><path d="M9 9h6M9 13h4"/></ToolIcon> },
  rect:      { label: 'Rechteck (R)',   icon: <ToolIcon><rect x="4" y="6" width="16" height="12" rx="2"/></ToolIcon> },
  circle:    { label: 'Kreis (C)',      icon: <ToolIcon><circle cx="12" cy="12" r="7"/></ToolIcon> },
  arrow:     { label: 'Pfeil (A)',      icon: <Icons.ArrowRight size={18}/> },
  text:      { label: 'Text (T)',       icon: <ToolIcon><path d="M5 5h14"/><path d="M12 5v14"/></ToolIcon> },
  image:     { label: 'Bild (I)',       icon: <ToolIcon><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="M21 15l-5-5L4 20"/></ToolIcon> },
  frame:     { label: 'Frame (F)',      icon: <ToolIcon><path d="M5 7H3M5 17H3M19 7h2M19 17h2M7 5V3M17 5V3M7 21v-2M17 21v-2"/><rect x="5" y="5" width="14" height="14" rx="1"/></ToolIcon> },
  sticker:   { label: 'Sticker (S)',    icon: <ToolIcon><path d="M15 3H6a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h9l6-6V6a3 3 0 0 0-3-3z"/><path d="M15 21v-4a2 2 0 0 1 2-2h4"/></ToolIcon> },
  connector: { label: 'Verbinder',      icon: <ToolIcon><circle cx="5" cy="6" r="2"/><circle cx="19" cy="18" r="2"/><path d="M7 7l10 10"/></ToolIcon> },
  comment:   { label: 'Kommentar',      icon: <ToolIcon><path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></ToolIcon> },
  more:      { label: 'Vorlagen',       icon: <Icons.Plus size={18}/> },
};

const TOOL_ROWS = ['select', 'pan', 'pen', 'highlight', 'eraser', 'note', 'divider', 'rect', 'circle', 'arrow', 'text', 'image', 'frame', 'sticker', 'connector', 'divider', 'comment', 'more'];

/* ─── helpers ─────────────────────────────────────────────────────────────── */

function getWorldPoint(evt, canvas, pan, zoom) {
  const rect = canvas.getBoundingClientRect();
  return { x: (evt.clientX - rect.left - pan.x) / zoom, y: (evt.clientY - rect.top - pan.y) / zoom };
}

function toScreen(x, y, pan, zoom) {
  return { x: x * zoom + pan.x, y: y * zoom + pan.y };
}

/* Smooth stroke with quadratic Bézier curves */
function drawSmoothStroke(ctx, stroke) {
  const pts = stroke.points;
  if (!pts?.length) return;
  ctx.save();
  ctx.globalAlpha = stroke.alpha ?? 1;
  ctx.strokeStyle = stroke.color;
  ctx.lineWidth = stroke.width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (pts.length === 1) {
    ctx.beginPath();
    ctx.arc(pts[0].x, pts[0].y, stroke.width / 2, 0, Math.PI * 2);
    ctx.fillStyle = stroke.color;
    ctx.fill();
  } else if (pts.length === 2) {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    ctx.lineTo(pts[1].x, pts[1].y);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i].x + pts[i + 1].x) / 2;
      const my = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
    }
    const last = pts[pts.length - 1];
    ctx.lineTo(last.x, last.y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBoard(ctx, board, pan, zoom) {
  const dpr = window.devicePixelRatio || 1;
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.translate(pan.x, pan.y);
  ctx.scale(zoom, zoom);

  /* strokes — smooth bezier */
  for (const stroke of board.strokes) drawSmoothStroke(ctx, stroke);

  /* shapes */
  for (const shape of board.shapes) {
    ctx.save();
    ctx.strokeStyle = shape.color;
    ctx.lineWidth = shape.width || 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.setLineDash(shape.dash !== undefined ? shape.dash : (shape.type === 'connector' ? [6, 6] : []));
    ctx.beginPath();
    if (shape.type === 'rect') {
      const x = Math.min(shape.x1, shape.x2);
      const y = Math.min(shape.y1, shape.y2);
      const w = Math.abs(shape.x2 - shape.x1);
      const h = Math.abs(shape.y2 - shape.y1);
      if (ctx.roundRect) ctx.roundRect(x, y, w, h, 10);
      else ctx.rect(x, y, w, h);
    } else if (shape.type === 'circle') {
      ctx.ellipse((shape.x1 + shape.x2) / 2, (shape.y1 + shape.y2) / 2, Math.abs(shape.x2 - shape.x1) / 2, Math.abs(shape.y2 - shape.y1) / 2, 0, 0, Math.PI * 2);
    } else {
      const ae = shape.arrowEnd !== undefined ? shape.arrowEnd : (shape.type === 'arrow' ? 'end' : 'none');
      const angle = Math.atan2(shape.y2 - shape.y1, shape.x2 - shape.x1);
      const head = 14;
      ctx.moveTo(shape.x1, shape.y1);
      ctx.lineTo(shape.x2, shape.y2);
      if (ae === 'end' || ae === 'both') {
        ctx.moveTo(shape.x2 - head * Math.cos(angle - 0.45), shape.y2 - head * Math.sin(angle - 0.45));
        ctx.lineTo(shape.x2, shape.y2);
        ctx.lineTo(shape.x2 - head * Math.cos(angle + 0.45), shape.y2 - head * Math.sin(angle + 0.45));
      }
      if (ae === 'start' || ae === 'both') {
        const ar = angle + Math.PI;
        ctx.moveTo(shape.x1 - head * Math.cos(ar - 0.45), shape.y1 - head * Math.sin(ar - 0.45));
        ctx.lineTo(shape.x1, shape.y1);
        ctx.lineTo(shape.x1 - head * Math.cos(ar + 0.45), shape.y1 - head * Math.sin(ar + 0.45));
      }
    }
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

function withinBox(x, y, box, pad = 0) {
  return x >= box.x - pad && x <= box.x + box.width + pad && y >= box.y - pad && y <= box.y + box.height + pad;
}

/* returns array of { kind, id } for every object whose bounding box overlaps the marquee (world coords) */
function objectsInMarquee(board, ax, ay, bx, by) {
  const minX = Math.min(ax, bx), maxX = Math.max(ax, bx);
  const minY = Math.min(ay, by), maxY = Math.max(ay, by);
  const overlap = (ox, oy, ow, oh) => ox + ow >= minX && ox <= maxX && oy + oh >= minY && oy <= maxY;
  const result = [];
  for (const n of board.notes)    if (overlap(n.x, n.y, n.width, n.height))        result.push({ kind: 'notes',    id: n.id });
  for (const t of board.texts)    if (overlap(t.x, t.y, t.width, t.height || 48)) result.push({ kind: 'texts',    id: t.id });
  for (const f of board.frames)   if (overlap(f.x, f.y, f.width, f.height))        result.push({ kind: 'frames',   id: f.id });
  for (const i of board.images)   if (overlap(i.x, i.y, i.width, i.height))        result.push({ kind: 'images',   id: i.id });
  for (const e of board.emojis)   if (overlap(e.x, e.y, 50, 50))                  result.push({ kind: 'emojis',   id: e.id });
  for (const c of board.comments) if (overlap(c.x, c.y, c.width, c.height || 140))result.push({ kind: 'comments', id: c.id });
  for (const s of board.shapes) {
    const sx = Math.min(s.x1, s.x2), sy = Math.min(s.y1, s.y2);
    const sw = Math.abs(s.x2 - s.x1), sh = Math.abs(s.y2 - s.y1);
    if (overlap(sx, sy, sw, sh)) result.push({ kind: 'shapes', id: s.id });
  }
  return result;
}

/* find nearest object center within radius (world coords), returns { x, y, id, kind } or null */
function findNearestAnchor(board, wx, wy, radius) {
  let best = null, bestD = radius;
  const check = (x, y, cx, cy, id, kind) => {
    const d = Math.hypot(wx - cx, wy - cy);
    if (d < bestD) { bestD = d; best = { x: cx, y: cy, id, kind }; }
  };
  for (const n of board.notes)  check(0,0, n.x + n.width/2, n.y + n.height/2, n.id, 'notes');
  for (const t of board.texts)  check(0,0, t.x + t.width/2, t.y + (t.height||48)/2, t.id, 'texts');
  for (const f of board.frames) check(0,0, f.x + f.width/2, f.y + f.height/2, f.id, 'frames');
  for (const i of board.images) check(0,0, i.x + i.width/2, i.y + i.height/2, i.id, 'images');
  return best;
}

function findStroke(board, x, y, zoom) {
  for (let i = board.strokes.length - 1; i >= 0; i -= 1) {
    const stroke = board.strokes[i];
    const radius = (stroke.width || 1) * 0.8 + 10 / zoom;
    if (stroke.points.some((pt) => Math.hypot(pt.x - x, pt.y - y) <= radius)) return { index: i, item: stroke };
  }
  return null;
}

function findSelection(board, x, y, zoom) {
  for (let i = board.comments.length - 1; i >= 0; i -= 1) {
    const item = board.comments[i];
    if (withinBox(x, y, item, 12 / zoom)) return { kind: 'comments', item };
  }
  for (let i = board.images.length - 1; i >= 0; i -= 1) {
    const item = board.images[i];
    if (withinBox(x, y, item, 12 / zoom)) return { kind: 'images', item };
  }
  for (let i = board.frames.length - 1; i >= 0; i -= 1) {
    const item = board.frames[i];
    if (withinBox(x, y, item, 12 / zoom)) return { kind: 'frames', item };
  }
  for (let i = board.notes.length - 1; i >= 0; i -= 1) {
    const item = board.notes[i];
    if (withinBox(x, y, item, 12 / zoom)) return { kind: 'notes', item };
  }
  for (let i = board.texts.length - 1; i >= 0; i -= 1) {
    const item = board.texts[i];
    if (withinBox(x, y, item, 12 / zoom)) return { kind: 'texts', item };
  }
  for (let i = board.emojis.length - 1; i >= 0; i -= 1) {
    const item = board.emojis[i];
    if (withinBox(x, y, { x: item.x, y: item.y, width: 48, height: 48 }, 12 / zoom)) return { kind: 'emojis', item };
  }
  for (let i = board.shapes.length - 1; i >= 0; i -= 1) {
    const item = board.shapes[i];
    const left = Math.min(item.x1, item.x2);
    const top = Math.min(item.y1, item.y2);
    const width = Math.abs(item.x2 - item.x1) || 24;
    const height = Math.abs(item.y2 - item.y1) || 24;
    if (withinBox(x, y, { x: left, y: top, width, height }, 12 / zoom)) return { kind: 'shapes', item };
  }
  return null;
}

/* ─── TemplatesPanel ──────────────────────────────────────────────────────── */

function TemplatesPanel({ onClose, onInsert }) {
  return (
    <div style={{ position: 'absolute', right: 18, top: 70, bottom: 110, width: 330, background: 'white', borderRadius: 14, border: '1px solid rgba(15,23,42,0.08)', boxShadow: '0 8px 28px rgba(15,23,42,0.12), 0 1px 3px rgba(15,23,42,0.06)', display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 30 }}>
      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(15,23,42,0.06)' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Vorlagen &amp; Diagramme</div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: '#94a3b8', display: 'flex' }}><Icons.X size={14}/></button>
      </div>
      <div style={{ padding: '0 10px 10px', overflowY: 'auto', flex: 1 }}>
        {TEMPLATES.map((template) => (
          <div
            key={template.id}
            onClick={() => onInsert(template.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 8px', borderRadius: 8, cursor: 'pointer', transition: 'background 0.1s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ width: 38, height: 38, borderRadius: 9, background: 'linear-gradient(135deg, #eef2ff, #e0e7ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, flexShrink: 0 }}>{template.icon}</div>
            <div style={{ fontSize: 12.5, color: '#0f172a', lineHeight: 1.4 }}>
              <span style={{ fontWeight: 600 }}>{template.name}</span><br/>
              <span style={{ color: '#64748b', fontSize: 11.5 }}>{template.desc}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── StickersPanel ───────────────────────────────────────────────────────── */

function StickersPanel({ onClose, onPick }) {
  const [activeCategory, setActiveCategory] = useState(0);
  return (
    <div style={{ position: 'absolute', bottom: 82, left: '50%', transform: 'translateX(-50%)', background: 'white', borderRadius: 16, border: '1px solid rgba(15,23,42,0.08)', boxShadow: '0 8px 28px rgba(15,23,42,0.14)', width: 340, zIndex: 30, overflow: 'hidden' }}>
      {/* header */}
      <div style={{ padding: '10px 12px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: '#0f172a' }}>Sticker einfügen</div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', color: '#94a3b8', display: 'flex' }}><Icons.X size={13}/></button>
      </div>
      {/* category tabs */}
      <div style={{ display: 'flex', gap: 2, padding: '0 10px 8px', overflowX: 'auto' }}>
        {STICKER_CATEGORIES.map((cat, i) => (
          <button
            key={cat.name}
            onClick={() => setActiveCategory(i)}
            style={{ padding: '4px 10px', borderRadius: 999, border: 'none', fontSize: 11.5, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap', background: activeCategory === i ? '#0f172a' : '#f1f5f9', color: activeCategory === i ? 'white' : '#475569', fontFamily: 'inherit' }}
          >
            {cat.name}
          </button>
        ))}
      </div>
      {/* grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 2, padding: '0 10px 12px' }}>
        {STICKER_CATEGORIES[activeCategory].items.map((sticker) => (
          <button
            key={sticker}
            onClick={() => onPick(sticker)}
            style={{ padding: '7px 4px', background: 'transparent', border: '1px solid transparent', borderRadius: 8, fontSize: 20, cursor: 'pointer', lineHeight: 1, transition: 'background 0.1s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            {sticker}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── LineStylePicker ─────────────────────────────────────────────────────── */

function LineStylePicker({ lineStyle, arrowEnd, onLineStyle, onArrowEnd }) {
  const lineIcons = { solid: '—', dashed: '╌', dotted: '···' };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'white', borderRadius: 999, padding: '6px 10px', border: '1px solid rgba(15,23,42,0.06)', boxShadow: '0 4px 12px rgba(15,23,42,0.06)' }}>
        {LINE_STYLES.map((s) => (
          <button key={s.id} onClick={() => onLineStyle(s.id)} title={s.label}
            style={{ width: 36, height: 28, borderRadius: 8, border: lineStyle === s.id ? '2px solid #0f172a' : '1px solid #e2e8f0', background: lineStyle === s.id ? '#f8fafc' : 'transparent', cursor: 'pointer', fontFamily: 'monospace', fontSize: 14, color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {lineIcons[s.id]}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'white', borderRadius: 999, padding: '6px 10px', border: '1px solid rgba(15,23,42,0.06)', boxShadow: '0 4px 12px rgba(15,23,42,0.06)' }}>
        {ARROW_ENDS.map((a) => (
          <button key={a.id} onClick={() => onArrowEnd(a.id)} title={a.label}
            style={{ width: 36, height: 28, borderRadius: 8, border: arrowEnd === a.id ? '2px solid #0f172a' : '1px solid #e2e8f0', background: arrowEnd === a.id ? '#f8fafc' : 'transparent', cursor: 'pointer', fontFamily: 'monospace', fontSize: 16, color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {a.icon}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── PenSizePicker ───────────────────────────────────────────────────────── */

function PenSizePicker({ penSizeId, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'white', borderRadius: 999, padding: '6px 12px', border: '1px solid rgba(15,23,42,0.06)', boxShadow: '0 4px 12px rgba(15,23,42,0.06)' }}>
      {PEN_SIZES.map((ps) => (
        <button
          key={ps.id}
          onClick={() => onChange(ps.id)}
          title={ps.label}
          style={{ width: 28, height: 28, borderRadius: '50%', border: penSizeId === ps.id ? '2.5px solid #0f172a' : '1.5px solid #cbd5e1', background: penSizeId === ps.id ? '#f8fafc' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
        >
          <div style={{ width: ps.dot, height: ps.dot, borderRadius: '50%', background: '#334155' }} />
        </button>
      ))}
    </div>
  );
}

/* ─── Main Whiteboard Component ───────────────────────────────────────────── */

const Whiteboard = () => {
  const docId = useMemo(() => new URLSearchParams(window.location.search).get('id'), []);
  const clientId = useMemo(() => randomId('client'), []);
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const autosaveRef = useRef(null);
  const boardRef = useRef(DEFAULT_BOARD());
  const panRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(1);
  const drawRef = useRef({ active: false, stroke: null });
  const shapeRef = useRef({ active: false, type: null, x1: 0, y1: 0, x2: 0, y2: 0 });
  const moveRef = useRef({ active: false, kind: null, id: null, startX: 0, startY: 0, origin: null });
  const dragPanRef = useRef({ active: false, startX: 0, startY: 0, originX: 0, originY: 0 });

  const [user, setUser] = useState(null);
  const [docRow, setDocRow] = useState(null);
  const [title, setTitle] = useState('Ohne Namen');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState('#0f172a');
  const [penSizeId, setPenSizeId] = useState('normal');
  const [lineStyle, setLineStyle] = useState('solid');
  const [arrowEnd, setArrowEnd] = useState('end');
  const [board, setBoard] = useState(DEFAULT_BOARD);
  const [history, setHistory] = useState([]);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const [showShapePicker, setShowShapePicker] = useState(false);
  const [selected, setSelected] = useState(null);
  const [multiSelected, setMultiSelected] = useState([]); // [{ kind, id }]
  const [marquee, setMarquee] = useState(null);           // screen rect { x,y,w,h }
  const [contextMenu, setContextMenu] = useState(null);   // { x,y, target:{kind,id}|null }
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [collaborators, setCollaborators] = useState([]);
  const channelRef = useRef(null);
  const broadcastThrottleRef = useRef(null);
  const isRemoteUpdate = useRef(false);
  const isInteractingRef = useRef(false);
  const userRef = useRef(null);
  const marqueeRef = useRef({ active: false, x1: 0, y1: 0, x2: 0, y2: 0 });

  useEffect(() => { boardRef.current = board; }, [board]);
  useEffect(() => { panRef.current = pan; }, [pan]);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { userRef.current = user; }, [user]);

  const pushHistory = useCallback(() => setHistory((prev) => [...prev.slice(-39), clone(boardRef.current)]), []);
  const mutateBoard = useCallback((fn) => setBoard((prev) => { const next = clone(prev); fn(next); return next; }), []);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawBoard(canvas.getContext('2d'), boardRef.current, panRef.current, zoomRef.current);
    if (shapeRef.current.active) {
      const preview = clone(boardRef.current);
      const dash = LINE_STYLES.find((s) => s.id === lineStyle)?.dash || [];
      const ae = ['arrow', 'connector'].includes(shapeRef.current.type) ? arrowEnd : 'none';
      preview.shapes.push({ id: 'preview', type: shapeRef.current.type, x1: shapeRef.current.x1, y1: shapeRef.current.y1, x2: shapeRef.current.x2, y2: shapeRef.current.y2, color, width: 2.5, dash, arrowEnd: ae });
      drawBoard(canvas.getContext('2d'), preview, panRef.current, zoomRef.current);
    }
  }, [color, lineStyle, arrowEnd]);

  useEffect(() => { redraw(); }, [board, pan, zoom, redraw]);

  /* auth + load */
  useEffect(() => {
    (async () => {
      const session = await window.requireAuth();
      if (!session) return;
      setUser(session.user);
      if (docId) {
        const { data: row } = await window.sb.from('documents').select('*').eq('id', docId).single();
        if (row) {
          setDocRow(row);
          setTitle(row.name || 'Ohne Namen');
          if (row.file_path) {
            const { data: blob } = await window.sb.storage.from('documents').download(row.file_path);
            if (blob) {
              try {
                const payload = JSON.parse(await blob.text());
                setTitle(payload.title || row.name || 'Ohne Namen');
                setBoard({
                  strokes:  payload.strokes  || [],
                  shapes:   payload.shapes   || [],
                  texts:    payload.texts    || [],
                  notes:    payload.notes    || [],
                  emojis:   payload.emojis   || [],
                  frames:   payload.frames   || [],
                  comments: payload.comments || [],
                  images:   payload.images   || [],
                });
              } catch {}
            }
          }
        }
      }
      setLoading(false);
    })();
  }, [docId]);

  /* realtime collaboration */
  useEffect(() => {
    if (!docId) return;
    const channelName = `whiteboard:${docId}`;
    const ch = window.sb.channel(channelName, { config: { broadcast: { self: false } } });

    ch.on('broadcast', { event: 'board-update' }, ({ payload }) => {
      if (payload?.clientId === clientId) return;
      isRemoteUpdate.current = true;
      setBoard({
        strokes:  payload.board?.strokes  || [],
        shapes:   payload.board?.shapes   || [],
        texts:    payload.board?.texts    || [],
        notes:    payload.board?.notes    || [],
        emojis:   payload.board?.emojis   || [],
        frames:   payload.board?.frames   || [],
        comments: payload.board?.comments || [],
        images:   payload.board?.images   || [],
      });
      setTimeout(() => { isRemoteUpdate.current = false; }, 50);
    });

    ch.on('presence', { event: 'sync' }, () => {
      const state = ch.presenceState();
      const others = Object.values(state).flat().filter(p => p.clientId !== clientId);
      setCollaborators(others);
    });

    ch.subscribe(async (status) => {
      if (status === 'SUBSCRIBED' && userRef.current) {
        const u = userRef.current;
        const name = u.user_metadata?.full_name || u.email || '';
        const initials = name
          .split(/[\s.@]+/)
          .filter(Boolean)
          .slice(0, 2)
          .map(p => p[0].toUpperCase())
          .join('');
        await ch.track({ clientId, initials: initials || '?', joinedAt: new Date().toISOString() });
      }
    });

    channelRef.current = ch;
    return () => { window.sb.removeChannel(ch); };
  }, [docId, clientId]);

  /* broadcast board changes to collaborators — only when not actively dragging/drawing */
  useEffect(() => {
    if (isRemoteUpdate.current || isInteractingRef.current || !channelRef.current || !docId) return;
    window.clearTimeout(broadcastThrottleRef.current);
    broadcastThrottleRef.current = window.setTimeout(() => {
      channelRef.current?.send({ type: 'broadcast', event: 'board-update', payload: { clientId, board: boardRef.current } });
    }, 80);
  }, [board, clientId, docId]);

  /* canvas resize */
  useEffect(() => {
    if (loading) return undefined;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      redraw();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [loading, redraw]);

  /* ── scroll-wheel zoom (zoom towards cursor) ── */
  useEffect(() => {
    if (loading) return undefined;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const onWheel = (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
      setZoom((prevZoom) => {
        const newZoom = Math.min(4, Math.max(0.15, prevZoom * factor));
        setPan((prevPan) => ({
          x: mx - (mx - prevPan.x) * (newZoom / prevZoom),
          y: my - (my - prevPan.y) * (newZoom / prevZoom),
        }));
        return newZoom;
      });
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, [loading]);

  /* save */
  const save = useCallback(async () => {
    if (!user) return null;
    setSaving(true);
    try {
      const payload = { type: 'studyflow_whiteboard', client_id: clientId, updated_at: new Date().toISOString(), title, ...boardRef.current };
      const blob = new Blob([JSON.stringify(payload)], { type: WB_MIME });
      const safe = title.replace(/[^a-zA-Z0-9._-]/g, '_') || 'whiteboard';
      // Use stable path: prefer existing file_path, then docId-based path (deterministic, no timestamp churn)
      const existingPath = docRow?.file_path && docRow.file_path !== '' ? docRow.file_path : null;
      const path = existingPath || `${user.id}/${docId || Date.now()}_${safe}.whiteboard.json`;
      const { error: upErr } = await window.sb.storage.from('documents').upload(path, blob, { contentType: WB_MIME, upsert: true });
      if (upErr) throw new Error(`Speicherfehler: ${upErr.message}`);
      const meta = { name: title, file_path: path, file_size: blob.size, mime_type: WB_MIME };
      let row = docRow;
      if (docRow?.id) {
        const { data, error: dbErr } = await window.sb.from('documents').update(meta).eq('id', docRow.id).select().single();
        if (dbErr) throw new Error(`DB-Fehler: ${dbErr.message}`);
        if (data) row = data;
      } else {
        const { data, error: dbErr } = await window.sb.from('documents').insert({ owner_id: user.id, doc_type: 'whiteboard', ...meta }).select().single();
        if (dbErr) throw new Error(`DB-Fehler: ${dbErr.message}`);
        if (data) {
          row = data;
          const url = new URL(window.location.href);
          url.searchParams.set('id', data.id);
          window.history.replaceState({}, '', url.toString());
        }
      }
      setDocRow(row);
      setSavedAt(new Date());
      return row;
    } catch (err) {
      console.error('Whiteboard save failed:', err);
      alert(err.message || 'Speichern fehlgeschlagen');
      return null;
    } finally {
      setSaving(false);
    }
  }, [clientId, docId, docRow, title, user]);

  /* autosave — 300 ms after last change */
  useEffect(() => {
    if (loading || !user) return undefined;
    window.clearTimeout(autosaveRef.current);
    autosaveRef.current = window.setTimeout(() => { save(); }, 300);
    return () => window.clearTimeout(autosaveRef.current);
  }, [board, title, loading, save, user]);

  /* save before tab/window close */
  useEffect(() => {
    if (!user) return undefined;
    const onUnload = () => { save(); };
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, [save, user]);

  /* keyboard shortcuts */
  useEffect(() => {
    const onKeyDown = (event) => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      const isEditing = tag === 'input' || tag === 'textarea';

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        setHistory((prev) => {
          if (!prev.length) return prev;
          setBoard(prev[prev.length - 1]);
          return prev.slice(0, -1);
        });
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        save();
        return;
      }
      if (event.key === 'Escape') {
        setSelected(null);
        setMultiSelected([]);
        setMarquee(null);
        marqueeRef.current.active = false;
        setContextMenu(null);
        return;
      }
      if ((event.key === 'Delete' || event.key === 'Backspace') && !isEditing) {
        if (multiSelected.length > 0) {
          pushHistory();
          mutateBoard((draft) => {
            for (const sel of multiSelected) draft[sel.kind] = draft[sel.kind].filter(o => o.id !== sel.id);
          });
          setMultiSelected([]);
          return;
        }
        if (selected) {
          pushHistory();
          mutateBoard((draft) => {
            draft[selected.kind] = draft[selected.kind].filter((item) => item.id !== selected.id);
          });
          setSelected(null);
          return;
        }
      }
      if (!isEditing && !event.ctrlKey && !event.metaKey && !event.altKey) {
        const mapped = SHORTCUT_MAP[event.key.toLowerCase()];
        if (mapped) {
          if (mapped === 'sticker') { setShowStickers((p) => !p); return; }
          if (mapped === 'image') { fileInputRef.current?.click(); return; }
          setTool(mapped);
          setShowShapePicker(false);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [multiSelected, mutateBoard, pushHistory, save, selected]);

  /* template insert */
  const insertTemplate = useCallback((templateId) => {
    const canvas = canvasRef.current;
    const cx = ((canvas?.offsetWidth || 1000) / 2 - panRef.current.x) / zoomRef.current;
    const cy = ((canvas?.offsetHeight || 700) / 2 - panRef.current.y) / zoomRef.current;
    pushHistory();
    mutateBoard((draft) => {
      if (templateId === 'mindmap') {
        draft.notes.push({ id: randomId('note'), x: cx - 220, y: cy - 110, width: 180, height: 120, text: 'Hauptthema\nHier eingeben', ...STICKY_THEMES[0] });
        draft.notes.push({ id: randomId('note'), x: cx + 40, y: cy - 120, width: 160, height: 100, text: 'Unterthema 1', ...STICKY_THEMES[1] });
        draft.notes.push({ id: randomId('note'), x: cx + 40, y: cy + 10, width: 160, height: 100, text: 'Unterthema 2', ...STICKY_THEMES[2] });
        draft.notes.push({ id: randomId('note'), x: cx + 40, y: cy + 140, width: 160, height: 100, text: 'Unterthema 3', ...STICKY_THEMES[3] });
        draft.shapes.push({ id: randomId('shape'), type: 'connector', x1: cx - 30, y1: cy - 50, x2: cx + 40, y2: cy - 70, color: '#94a3b8', width: 2 });
        draft.shapes.push({ id: randomId('shape'), type: 'connector', x1: cx - 30, y1: cy - 30, x2: cx + 40, y2: cy + 60, color: '#94a3b8', width: 2 });
        draft.shapes.push({ id: randomId('shape'), type: 'connector', x1: cx - 30, y1: cy - 10, x2: cx + 40, y2: cy + 190, color: '#94a3b8', width: 2 });
      }
      if (templateId === 'flow') {
        draft.frames.push({ id: randomId('frame'), x: cx - 280, y: cy - 130, width: 580, height: 270, title: 'Flussdiagramm' });
        draft.texts.push({ id: randomId('text'), x: cx - 220, y: cy - 20, width: 110, height: 38, text: 'Start', color: '#0f172a', bubble: true });
        draft.texts.push({ id: randomId('text'), x: cx - 60, y: cy - 20, width: 120, height: 38, text: 'Schritt 1', color: '#0f172a', bubble: true });
        draft.texts.push({ id: randomId('text'), x: cx + 100, y: cy - 20, width: 120, height: 38, text: 'Schritt 2', color: '#0f172a', bubble: true });
        draft.texts.push({ id: randomId('text'), x: cx + 230, y: cy - 20, width: 110, height: 38, text: 'Ende', color: '#0f172a', bubble: true });
        draft.shapes.push({ id: randomId('shape'), type: 'arrow', x1: cx - 100, y1: cy, x2: cx - 60, y2: cy, color: '#6366f1', width: 2.5 });
        draft.shapes.push({ id: randomId('shape'), type: 'arrow', x1: cx + 68, y1: cy, x2: cx + 100, y2: cy, color: '#6366f1', width: 2.5 });
        draft.shapes.push({ id: randomId('shape'), type: 'arrow', x1: cx + 228, y1: cy, x2: cx + 230, y2: cy, color: '#6366f1', width: 2.5 });
      }
      if (templateId === 'matrix') {
        const hw = 240, hh = 160;
        draft.frames.push({ id: randomId('frame'), x: cx - hw, y: cy - hh, width: hw * 2, height: hh * 2, title: 'Eisenhower-Matrix' });
        draft.shapes.push({ id: randomId('shape'), type: 'connector', x1: cx, y1: cy - hh, x2: cx, y2: cy + hh, color: '#94a3b8', width: 2 });
        draft.shapes.push({ id: randomId('shape'), type: 'connector', x1: cx - hw, y1: cy, x2: cx + hw, y2: cy, color: '#94a3b8', width: 2 });
        draft.texts.push({ id: randomId('text'), x: cx - hw + 10, y: cy - hh + 8, width: 120, height: 28, text: '① Wichtig + Dringend', color: '#ef4444', bubble: false });
        draft.texts.push({ id: randomId('text'), x: cx + 10, y: cy - hh + 8, width: 120, height: 28, text: '② Wichtig + Nicht dringend', color: '#3b82f6', bubble: false });
        draft.texts.push({ id: randomId('text'), x: cx - hw + 10, y: cy + 8, width: 120, height: 28, text: '③ Nicht wichtig + Dringend', color: '#f59e0b', bubble: false });
        draft.texts.push({ id: randomId('text'), x: cx + 10, y: cy + 8, width: 120, height: 28, text: '④ Nicht wichtig + Nicht dringend', color: '#94a3b8', bubble: false });
      }
      if (templateId === 'cards') {
        draft.notes.push({ id: randomId('note'), x: cx - 220, y: cy - 80, width: 170, height: 120, text: 'Begriff\n\nHier eingeben', ...STICKY_THEMES[2] });
        draft.notes.push({ id: randomId('note'), x: cx + 30, y: cy - 80, width: 170, height: 120, text: 'Definition\n\nHier eingeben', ...STICKY_THEMES[3] });
        draft.shapes.push({ id: randomId('shape'), type: 'arrow', x1: cx - 40, y1: cy - 20, x2: cx + 30, y2: cy - 20, color: '#94a3b8', width: 2 });
      }
      if (templateId === 'swot') {
        const sw = 200, sh = 140;
        draft.frames.push({ id: randomId('frame'), x: cx - sw - 10, y: cy - sh - 10, width: (sw + 10) * 2, height: (sh + 10) * 2, title: 'SWOT-Analyse' });
        draft.notes.push({ id: randomId('note'), x: cx - sw - 4, y: cy - sh - 4, width: sw, height: sh, text: '💪 Stärken\n\n•', ...STICKY_THEMES[3] });
        draft.notes.push({ id: randomId('note'), x: cx + 14, y: cy - sh - 4, width: sw, height: sh, text: '⚠️ Schwächen\n\n•', ...STICKY_THEMES[0] });
        draft.notes.push({ id: randomId('note'), x: cx - sw - 4, y: cy + 14, width: sw, height: sh, text: '🚀 Chancen\n\n•', ...STICKY_THEMES[1] });
        draft.notes.push({ id: randomId('note'), x: cx + 14, y: cy + 14, width: sw, height: sh, text: '❌ Risiken\n\n•', ...STICKY_THEMES[0] });
      }
      if (templateId === 'timeline') {
        draft.frames.push({ id: randomId('frame'), x: cx - 320, y: cy - 100, width: 660, height: 220, title: 'Zeitleiste' });
        draft.shapes.push({ id: randomId('shape'), type: 'arrow', x1: cx - 280, y1: cy + 20, x2: cx + 300, y2: cy + 20, color: '#6366f1', width: 3 });
        [-200, -100, 0, 100, 200].forEach((offset, i) => {
          draft.shapes.push({ id: randomId('shape'), type: 'connector', x1: cx + offset, y1: cy - 40, x2: cx + offset, y2: cy + 20, color: '#94a3b8', width: 1.5 });
          draft.notes.push({ id: randomId('note'), x: cx + offset - 55, y: cy - 100, width: 110, height: 56, text: `Ereignis ${i + 1}`, ...STICKY_THEMES[i % STICKY_THEMES.length] });
        });
      }
      if (templateId === 'cornell') {
        const fw = 580, fh = 420;
        draft.frames.push({ id: randomId('frame'), x: cx - fw / 2, y: cy - fh / 2, width: fw, height: fh, title: 'Cornell-Notizen' });
        draft.texts.push({ id: randomId('text'), x: cx - fw / 2 + 8, y: cy - fh / 2 + 8, width: 150, height: 28, text: '🔑 Schlüsselwörter', color: '#4f46e5', bubble: false });
        draft.texts.push({ id: randomId('text'), x: cx - fw / 2 + 168, y: cy - fh / 2 + 8, width: 200, height: 28, text: '📝 Notizen / Mitschrift', color: '#0f172a', bubble: false });
        draft.texts.push({ id: randomId('text'), x: cx - fw / 2 + 8, y: cy + 80, width: fw - 16, height: 28, text: '💡 Zusammenfassung', color: '#0f172a', bubble: false });
        draft.shapes.push({ id: randomId('shape'), type: 'connector', x1: cx - fw / 2 + 158, y1: cy - fh / 2, x2: cx - fw / 2 + 158, y2: cy + 70, color: '#cbd5e1', width: 1.5 });
        draft.shapes.push({ id: randomId('shape'), type: 'connector', x1: cx - fw / 2, y1: cy + 70, x2: cx + fw / 2, y2: cy + 70, color: '#cbd5e1', width: 1.5 });
      }
      if (templateId === 'kanban') {
        const cols = [
          { title: '📋 Offen', theme: STICKY_THEMES[0], items: ['Aufgabe 1', 'Aufgabe 2'] },
          { title: '⚙️ In Arbeit', theme: STICKY_THEMES[1], items: ['Aufgabe 3'] },
          { title: '✅ Erledigt', theme: STICKY_THEMES[3], items: ['Aufgabe 4'] },
        ];
        cols.forEach((col, ci) => {
          const colX = cx - 300 + ci * 220;
          draft.frames.push({ id: randomId('frame'), x: colX, y: cy - 200, width: 200, height: 400, title: col.title });
          col.items.forEach((item, ii) => {
            draft.notes.push({ id: randomId('note'), x: colX + 10, y: cy - 180 + ii * 130, width: 180, height: 110, text: item, ...col.theme });
          });
        });
      }
    });
    setShowTemplates(false);
  }, [mutateBoard, pushHistory]);

  const placeSticker = useCallback((emoji) => {
    const canvas = canvasRef.current;
    const x = ((canvas?.offsetWidth || 1000) / 2 - panRef.current.x) / zoomRef.current + (Math.random() - 0.5) * 200;
    const y = ((canvas?.offsetHeight || 700) / 2 - panRef.current.y) / zoomRef.current + (Math.random() - 0.5) * 140;
    pushHistory();
    mutateBoard((draft) => {
      draft.emojis.push({ id: randomId('emoji'), x, y, emoji, rotate: (Math.random() - 0.5) * 28 });
    });
    setShowStickers(false);
  }, [mutateBoard, pushHistory]);

  const handleImagePick = useCallback(async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const canvas = canvasRef.current;
      const x = ((canvas?.offsetWidth || 1000) / 2 - panRef.current.x) / zoomRef.current;
      const y = ((canvas?.offsetHeight || 700) / 2 - panRef.current.y) / zoomRef.current;
      pushHistory();
      mutateBoard((draft) => {
        draft.images.push({ id: randomId('image'), x, y, width: 220, height: 140, src: reader.result });
      });
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  }, [mutateBoard, pushHistory]);

  const updateArrayItem = useCallback((kind, id, patch) => {
    mutateBoard((draft) => {
      draft[kind] = draft[kind].map((item) => item.id === id ? { ...item, ...patch } : item);
    });
  }, [mutateBoard]);

  const startOverlayMove = useCallback((event, kind, item) => {
    if (tool !== 'select') {
      setSelected({ kind, id: item.id });
      return;
    }
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    const world = getWorldPoint(event, canvasRef.current, panRef.current, zoomRef.current);
    moveRef.current = { active: true, kind, id: item.id, startX: world.x, startY: world.y, origin: clone(item) };
    setSelected({ kind, id: item.id });
  }, [tool]);

  /* ── pointer events ── */

  const onPointerDown = useCallback((event) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (event.button === 2) return; // right-click handled by onContextMenu
    canvas.setPointerCapture?.(event.pointerId);
    const world = getWorldPoint(event, canvas, panRef.current, zoomRef.current);
    isInteractingRef.current = true;
    setContextMenu(null);

    if (tool === 'pan' || event.button === 1) {
      dragPanRef.current = { active: true, startX: event.clientX, startY: event.clientY, originX: panRef.current.x, originY: panRef.current.y };
      return;
    }
    if (tool === 'select') {
      const found = findSelection(boardRef.current, world.x, world.y, zoomRef.current);
      if (found) {
        // If clicking a multi-selected item, move the whole group; else single select
        const inMulti = multiSelected.some(s => s.id === found.item.id);
        if (inMulti && multiSelected.length > 1) {
          moveRef.current = { active: true, kind: found.kind, id: found.item.id, startX: world.x, startY: world.y, origin: clone(found.item), multi: multiSelected.map(s => ({ ...s, origin: boardRef.current[s.kind].find(o => o.id === s.id) })) };
        } else {
          moveRef.current = { active: true, kind: found.kind, id: found.item.id, startX: world.x, startY: world.y, origin: clone(found.item), multi: null };
          setSelected({ kind: found.kind, id: found.item.id });
          setMultiSelected([]);
        }
      } else {
        // Start marquee selection on empty canvas
        setSelected(null);
        setMultiSelected([]);
        marqueeRef.current = { active: true, x1: event.clientX, y1: event.clientY, x2: event.clientX, y2: event.clientY };
        setMarquee({ x: event.clientX, y: event.clientY, w: 0, h: 0 });
      }
      return;
    }
    if (tool === 'note') {
      pushHistory();
      const theme = STICKY_THEMES[boardRef.current.notes.length % STICKY_THEMES.length];
      mutateBoard((draft) => { draft.notes.push({ id: randomId('note'), x: world.x, y: world.y, width: 180, height: 130, text: 'Neue Notiz', ...theme }); });
      setTool('select');
      return;
    }
    if (tool === 'text') {
      pushHistory();
      mutateBoard((draft) => { draft.texts.push({ id: randomId('text'), x: world.x, y: world.y, width: 180, height: 48, text: 'Text', color, bubble: false }); });
      setTool('select');
      return;
    }
    if (tool === 'comment') {
      pushHistory();
      mutateBoard((draft) => { draft.comments.push({ id: randomId('comment'), x: world.x, y: world.y, width: 260, height: 140, text: 'Kommentar' }); });
      setTool('select');
      return;
    }
    if (tool === 'frame') {
      pushHistory();
      mutateBoard((draft) => { draft.frames.push({ id: randomId('frame'), x: world.x, y: world.y, width: 360, height: 220, title: 'Frame' }); });
      setTool('select');
      return;
    }
    if (tool === 'eraser') {
      pushHistory();
      const found = findSelection(boardRef.current, world.x, world.y, zoomRef.current);
      const strokeHit = findStroke(boardRef.current, world.x, world.y, zoomRef.current);
      if (found || strokeHit) {
        mutateBoard((draft) => {
          if (found) draft[found.kind] = draft[found.kind].filter((item) => item.id !== found.item.id);
          if (strokeHit) draft.strokes.splice(strokeHit.index, 1);
        });
      }
      // Also start wipe-area: reuse marquee ref with eraser mode
      marqueeRef.current = { active: true, eraseMode: true, x1: event.clientX, y1: event.clientY, x2: event.clientX, y2: event.clientY };
      setMarquee({ x: event.clientX, y: event.clientY, w: 0, h: 0, eraseMode: true });
      return;
    }
    if (['rect', 'circle', 'arrow', 'connector'].includes(tool)) {
      pushHistory();
      const snap = tool === 'connector' ? findNearestAnchor(boardRef.current, world.x, world.y, 40 / zoomRef.current) : null;
      const sx = snap ? snap.x : world.x;
      const sy = snap ? snap.y : world.y;
      shapeRef.current = { active: true, type: tool, x1: sx, y1: sy, x2: sx, y2: sy, sourceId: snap?.id || null };
      return;
    }
    if (tool === 'pen' || tool === 'highlight') {
      pushHistory();
      const ps = PEN_SIZES.find((p) => p.id === penSizeId) || PEN_SIZES[1];
      const width = tool === 'highlight' ? Math.max(ps.size * 3, 14) : ps.size;
      drawRef.current = {
        active: true,
        stroke: { id: randomId('stroke'), tool, color, alpha: tool === 'highlight' ? 0.28 : 1, width, points: [world] },
      };
    }
  }, [color, multiSelected, mutateBoard, penSizeId, pushHistory, tool]);

  const onPointerMove = useCallback((event) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (dragPanRef.current.active) {
      setPan({ x: dragPanRef.current.originX + event.clientX - dragPanRef.current.startX, y: dragPanRef.current.originY + event.clientY - dragPanRef.current.startY });
      return;
    }
    // Update marquee rectangle (both select and erase mode)
    if (marqueeRef.current.active) {
      marqueeRef.current.x2 = event.clientX;
      marqueeRef.current.y2 = event.clientY;
      const { x1, y1, x2, y2 } = marqueeRef.current;
      setMarquee({ x: Math.min(x1,x2), y: Math.min(y1,y2), w: Math.abs(x2-x1), h: Math.abs(y2-y1), eraseMode: marqueeRef.current.eraseMode });
      return;
    }
    if (moveRef.current.active) {
      const world = getWorldPoint(event, canvas, panRef.current, zoomRef.current);
      const dx = world.x - moveRef.current.startX;
      const dy = world.y - moveRef.current.startY;
      mutateBoard((draft) => {
        if (moveRef.current.multi && moveRef.current.multi.length > 1) {
          // Move all multi-selected objects
          for (const sel of moveRef.current.multi) {
            draft[sel.kind] = draft[sel.kind].map((item) => {
              if (item.id !== sel.id) return item;
              const orig = sel.origin;
              if (!orig) return item;
              if (sel.kind === 'shapes') return { ...item, x1: orig.x1+dx, y1: orig.y1+dy, x2: orig.x2+dx, y2: orig.y2+dy };
              return { ...item, x: orig.x + dx, y: orig.y + dy };
            });
          }
        } else {
          draft[moveRef.current.kind] = draft[moveRef.current.kind].map((item) => {
            if (item.id !== moveRef.current.id) return item;
            const origin = moveRef.current.origin;
            if (moveRef.current.kind === 'shapes') return { ...item, x1: origin.x1+dx, y1: origin.y1+dy, x2: origin.x2+dx, y2: origin.y2+dy };
            return { ...item, x: origin.x + dx, y: origin.y + dy };
          });
        }
      });
      return;
    }
    if (shapeRef.current.active) {
      const world = getWorldPoint(event, canvas, panRef.current, zoomRef.current);
      shapeRef.current = { ...shapeRef.current, x2: world.x, y2: world.y };
      redraw();
      return;
    }
    if (drawRef.current.active) {
      const world = getWorldPoint(event, canvas, panRef.current, zoomRef.current);
      const pts = drawRef.current.stroke.points;
      if (!pts.length || dist2(pts[pts.length - 1], world) >= 3 / zoomRef.current) {
        drawRef.current.stroke.points.push(world);
      }
      const ctx = canvas.getContext('2d');
      drawBoard(ctx, boardRef.current, panRef.current, zoomRef.current);
      const dpr = window.devicePixelRatio || 1;
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.translate(panRef.current.x, panRef.current.y);
      ctx.scale(zoomRef.current, zoomRef.current);
      drawSmoothStroke(ctx, drawRef.current.stroke);
      ctx.restore();
    }
  }, [mutateBoard, redraw]);

  const onPointerUp = useCallback((event) => {
    dragPanRef.current.active = false;
    moveRef.current.active = false;
    isInteractingRef.current = false;

    // Finish marquee selection or wipe
    if (marqueeRef.current.active) {
      const { x1, y1, x2, y2, eraseMode } = marqueeRef.current;
      marqueeRef.current = { active: false, x1: 0, y1: 0, x2: 0, y2: 0 };
      setMarquee(null);
      // Convert screen rect to world coords
      const canvas = canvasRef.current;
      if (canvas) {
        const toWorld = (sx, sy) => ({
          x: (sx - canvas.getBoundingClientRect().left - panRef.current.x) / zoomRef.current,
          y: (sy - canvas.getBoundingClientRect().top  - panRef.current.y) / zoomRef.current,
        });
        const tl = toWorld(Math.min(x1,x2), Math.min(y1,y2));
        const br = toWorld(Math.max(x1,x2), Math.max(y1,y2));
        const found = objectsInMarquee(boardRef.current, tl.x, tl.y, br.x, br.y);
        if (eraseMode && found.length > 0) {
          mutateBoard((draft) => {
            for (const sel of found) draft[sel.kind] = draft[sel.kind].filter(o => o.id !== sel.id);
          });
        } else if (!eraseMode && found.length > 0) {
          setMultiSelected(found);
          setSelected(null);
        }
      }
      // broadcast after wipe/select
      window.setTimeout(() => {
        if (channelRef.current && docId) {
          channelRef.current.send({ type: 'broadcast', event: 'board-update', payload: { clientId, board: boardRef.current } });
        }
      }, 20);
      return;
    }

    if (shapeRef.current.active) {
      const current = shapeRef.current;
      shapeRef.current = { active: false, type: null, x1: 0, y1: 0, x2: 0, y2: 0 };
      const dash = LINE_STYLES.find((s) => s.id === lineStyle)?.dash || [];
      const ae = ['arrow', 'connector'].includes(current.type) ? arrowEnd : 'none';
      // Connector snap-to-target
      const canvas = canvasRef.current;
      let ex = current.x2, ey = current.y2, targetId = null;
      if (canvas && current.type === 'connector') {
        const world = getWorldPoint(event, canvas, panRef.current, zoomRef.current);
        const snap = findNearestAnchor(boardRef.current, world.x, world.y, 40 / zoomRef.current);
        if (snap) { ex = snap.x; ey = snap.y; targetId = snap.id; }
      }
      mutateBoard((draft) => {
        draft.shapes.push({ id: randomId('shape'), type: current.type, x1: current.x1, y1: current.y1, x2: ex, y2: ey, color, width: 2.5, dash, arrowEnd: ae, sourceId: current.sourceId || null, targetId: targetId || null });
      });
      // Broadcast + save after shape
      window.setTimeout(() => {
        if (channelRef.current && docId) channelRef.current.send({ type: 'broadcast', event: 'board-update', payload: { clientId, board: boardRef.current } });
        save();
      }, 50);
      return;
    }

    if (drawRef.current.active) {
      const stroke = clone(drawRef.current.stroke);
      drawRef.current = { active: false, stroke: null };
      mutateBoard((draft) => { draft.strokes.push(stroke); });
      // Broadcast + save after stroke
      window.setTimeout(() => {
        if (channelRef.current && docId) channelRef.current.send({ type: 'broadcast', event: 'board-update', payload: { clientId, board: boardRef.current } });
        save();
      }, 50);
      return;
    }

    // After a move — broadcast + save
    window.setTimeout(() => {
      if (channelRef.current && docId) channelRef.current.send({ type: 'broadcast', event: 'board-update', payload: { clientId, board: boardRef.current } });
      save();
    }, 50);
  }, [clientId, color, docId, lineStyle, arrowEnd, mutateBoard, save]);

  /* context menu */
  const onContextMenu = useCallback((event) => {
    event.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const world = getWorldPoint(event, canvas, panRef.current, zoomRef.current);
    const found = findSelection(boardRef.current, world.x, world.y, zoomRef.current);
    const strokeHit = findStroke(boardRef.current, world.x, world.y, zoomRef.current);
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      target: found ? { kind: found.kind, id: found.item.id } : strokeHit ? { kind: 'strokes', index: strokeHit.index } : null,
      worldX: world.x,
      worldY: world.y,
    });
  }, []);

  const closeContextMenu = useCallback(() => setContextMenu(null), []);

  const ctxDelete = useCallback(() => {
    if (!contextMenu) return;
    pushHistory();
    if (contextMenu.target) {
      mutateBoard((draft) => {
        if (contextMenu.target.kind === 'strokes') {
          draft.strokes.splice(contextMenu.target.index, 1);
        } else {
          draft[contextMenu.target.kind] = draft[contextMenu.target.kind].filter(o => o.id !== contextMenu.target.id);
        }
      });
    } else if (multiSelected.length > 0) {
      mutateBoard((draft) => {
        for (const sel of multiSelected) draft[sel.kind] = draft[sel.kind].filter(o => o.id !== sel.id);
      });
      setMultiSelected([]);
    }
    setContextMenu(null);
    save();
  }, [contextMenu, multiSelected, mutateBoard, pushHistory, save]);

  const ctxDuplicate = useCallback(() => {
    if (!contextMenu?.target || contextMenu.target.kind === 'strokes') return;
    pushHistory();
    mutateBoard((draft) => {
      const arr = draft[contextMenu.target.kind];
      const item = arr.find(o => o.id === contextMenu.target.id);
      if (!item) return;
      const copy = { ...clone(item), id: randomId(contextMenu.target.kind.slice(0,-1)) };
      if ('x' in copy) { copy.x += 20; copy.y += 20; }
      if ('x1' in copy) { copy.x1 += 20; copy.y1 += 20; copy.x2 += 20; copy.y2 += 20; }
      arr.push(copy);
    });
    setContextMenu(null);
  }, [contextMenu, mutateBoard, pushHistory]);

  const ctxBringFront = useCallback(() => {
    if (!contextMenu?.target || contextMenu.target.kind === 'strokes') return;
    mutateBoard((draft) => {
      const arr = draft[contextMenu.target.kind];
      const idx = arr.findIndex(o => o.id === contextMenu.target.id);
      if (idx >= 0) { const [item] = arr.splice(idx, 1); arr.push(item); }
    });
    setContextMenu(null);
  }, [contextMenu, mutateBoard]);

  const ctxSendBack = useCallback(() => {
    if (!contextMenu?.target || contextMenu.target.kind === 'strokes') return;
    mutateBoard((draft) => {
      const arr = draft[contextMenu.target.kind];
      const idx = arr.findIndex(o => o.id === contextMenu.target.id);
      if (idx >= 0) { const [item] = arr.splice(idx, 1); arr.unshift(item); }
    });
    setContextMenu(null);
  }, [contextMenu, mutateBoard]);

  const ctxAddNote = useCallback(() => {
    if (!contextMenu) return;
    pushHistory();
    const theme = STICKY_THEMES[boardRef.current.notes.length % STICKY_THEMES.length];
    mutateBoard((draft) => { draft.notes.push({ id: randomId('note'), x: contextMenu.worldX, y: contextMenu.worldY, width: 180, height: 130, text: 'Neue Notiz', ...theme }); });
    setContextMenu(null);
  }, [contextMenu, mutateBoard, pushHistory]);

  const ctxAddText = useCallback(() => {
    if (!contextMenu) return;
    pushHistory();
    mutateBoard((draft) => { draft.texts.push({ id: randomId('text'), x: contextMenu.worldX, y: contextMenu.worldY, width: 180, height: 48, text: 'Text', color: '#0f172a', bubble: false }); });
    setContextMenu(null);
  }, [contextMenu, mutateBoard, pushHistory]);

  const ctxSelectAll = useCallback(() => {
    const all = objectsInMarquee(boardRef.current, -1e9, -1e9, 1e9, 1e9);
    setMultiSelected(all);
    setSelected(null);
    setContextMenu(null);
  }, []);

  /* share */
  const shareUrl = (() => {
    const url = new URL(window.location.href);
    if (docRow?.id) url.searchParams.set('id', docRow.id);
    return url.toString();
  })();

  const copyShareLink = async () => {
    if (!docRow?.id) await save();
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      window.prompt('Link kopieren', shareUrl);
    }
  };

  if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Whiteboard wird geladen…</div>;

  /* ─── render ── */
  return (
    <div onPointerMove={onPointerMove} onPointerUp={onPointerUp} onClick={contextMenu ? closeContextMenu : undefined} style={{ height: '100vh', overflow: 'hidden', position: 'relative', background: '#fafaf7' }}>
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImagePick} style={{ display: 'none' }} />

      {/* canvas layer */}
      <div className="dot-paper" style={{ position: 'absolute', inset: 0, backgroundColor: '#fafaf7' }}>
        <canvas
          ref={canvasRef}
          onPointerDown={onPointerDown}
          onContextMenu={onContextMenu}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', touchAction: 'none', cursor: tool === 'pan' ? 'grab' : tool === 'select' ? 'default' : tool === 'eraser' ? 'cell' : 'crosshair' }}
        />

        {/* Marquee selection / wipe rectangle */}
        {marquee && marquee.w > 4 && marquee.h > 4 && (
          <div style={{ position: 'fixed', left: marquee.x, top: marquee.y, width: marquee.w, height: marquee.h, border: `1.5px ${marquee.eraseMode ? 'solid #ef4444' : 'dashed #6366f1'}`, background: marquee.eraseMode ? 'rgba(239,68,68,0.06)' : 'rgba(99,102,241,0.06)', borderRadius: 4, pointerEvents: 'none', zIndex: 30 }}/>
        )}

        {board.frames.map((frame) => {
          const p = toScreen(frame.x, frame.y, pan, zoom);
          return (
            <div key={frame.id} onPointerDown={(e) => startOverlayMove(e, 'frames', frame)} style={{ position: 'absolute', left: p.x, top: p.y, width: frame.width * zoom, height: frame.height * zoom, border: selected?.kind === 'frames' && selected?.id === frame.id ? '2px dashed #6366f1' : '1.5px dashed #94a3b8', borderRadius: 14, background: 'rgba(255,255,255,0.16)' }}>
              <input value={frame.title} onChange={(e) => updateArrayItem('frames', frame.id, { title: e.target.value })} style={{ position: 'absolute', top: -18, left: 10, border: 'none', background: 'white', padding: '4px 10px', borderRadius: 999, fontSize: 12, color: '#475569', boxShadow: '0 1px 2px rgba(15,23,42,0.06)' }} />
            </div>
          );
        })}

        {board.notes.map((note) => {
          const p = toScreen(note.x, note.y, pan, zoom);
          const isMulti = multiSelected.some(s => s.id === note.id);
          return (
            <textarea key={note.id} value={note.text}
              onPointerDown={(e) => startOverlayMove(e, 'notes', note)}
              onContextMenu={e => { e.preventDefault(); e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY, target: { kind: 'notes', id: note.id }, worldX: 0, worldY: 0 }); }}
              onChange={(e) => updateArrayItem('notes', note.id, { text: e.target.value })}
              style={{ position: 'absolute', left: p.x, top: p.y, width: note.width * zoom, height: note.height * zoom, padding: `${14 * zoom}px`, background: note.bg, border: `${(selected?.kind === 'notes' && selected?.id === note.id) || isMulti ? 2 : 1}px solid ${isMulti ? '#6366f1' : note.border}`, borderRadius: 6, boxShadow: '2px 3px 0 rgba(15,23,42,0.05), 0 8px 20px rgba(15,23,42,0.08)', fontFamily: 'Caveat', fontSize: Math.max(14, 18 * zoom), color: '#0f172a', resize: 'none', outline: 'none' }} />
          );
        })}

        {board.texts.map((text) => {
          const p = toScreen(text.x, text.y, pan, zoom);
          return text.bubble ? (
            <input key={text.id} value={text.text} onPointerDown={(e) => startOverlayMove(e, 'texts', text)} onChange={(e) => updateArrayItem('texts', text.id, { text: e.target.value })} style={{ position: 'absolute', left: p.x, top: p.y, width: text.width * zoom, padding: '10px 16px', background: 'white', border: `${selected?.kind === 'texts' && selected?.id === text.id ? 3 : 2}px solid #6366f1`, borderRadius: 999, fontSize: 13 * zoom, fontWeight: 500, color: text.color, textAlign: 'center', outline: 'none' }} />
          ) : (
            <textarea key={text.id} value={text.text} onPointerDown={(e) => startOverlayMove(e, 'texts', text)} onChange={(e) => updateArrayItem('texts', text.id, { text: e.target.value })} style={{ position: 'absolute', left: p.x, top: p.y, width: text.width * zoom, height: text.height * zoom, background: selected?.kind === 'texts' && selected?.id === text.id ? 'rgba(255,255,255,0.8)' : 'transparent', border: 'none', color: text.color, fontSize: Math.max(14, 20 * zoom), fontFamily: 'Caveat', outline: selected?.kind === 'texts' && selected?.id === text.id ? '1px dashed #6366f1' : 'none', resize: 'none' }} />
          );
        })}

        {board.comments.map((comment) => {
          const p = toScreen(comment.x, comment.y, pan, zoom);
          return (
            <div key={comment.id} onPointerDown={(e) => startOverlayMove(e, 'comments', comment)} style={{ position: 'absolute', left: p.x, top: p.y, width: comment.width * zoom, background: 'white', borderRadius: 18, border: selected?.kind === 'comments' && selected?.id === comment.id ? '2px solid #6366f1' : '1px solid #cbd5e1', boxShadow: '0 8px 20px rgba(15,23,42,0.08)' }}>
              <textarea value={comment.text} onChange={(e) => updateArrayItem('comments', comment.id, { text: e.target.value })} style={{ width: '100%', height: comment.height * zoom, border: 'none', background: 'transparent', resize: 'none', outline: 'none', padding: `${16 * zoom}px`, fontSize: Math.max(12, 14 * zoom), color: '#334155' }} />
            </div>
          );
        })}

        {board.images.map((image) => {
          const p = toScreen(image.x, image.y, pan, zoom);
          const isSelected = selected?.kind === 'images' && selected?.id === image.id;
          return (
            <div key={image.id} onPointerDown={(e) => startOverlayMove(e, 'images', image)} style={{ position: 'absolute', left: p.x, top: p.y, width: image.width * zoom, height: image.height * zoom, overflow: 'hidden', outline: isSelected ? '2px solid #6366f1' : 'none', cursor: tool === 'select' ? 'grab' : 'default' }}>
              <img src={image.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', userSelect: 'none', pointerEvents: 'none' }} />
            </div>
          );
        })}

        {board.emojis.map((emoji) => {
          const p = toScreen(emoji.x, emoji.y, pan, zoom);
          const isMulti = multiSelected.some(s => s.id === emoji.id);
          return (
            <div key={emoji.id} onPointerDown={(e) => startOverlayMove(e, 'emojis', emoji)} onContextMenu={e => { e.preventDefault(); e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY, target: { kind: 'emojis', id: emoji.id }, worldX: 0, worldY: 0 }); }} style={{ position: 'absolute', left: p.x, top: p.y, fontSize: 32 * zoom, transform: `rotate(${emoji.rotate}deg)`, filter: 'drop-shadow(2px 3px 4px rgba(15,23,42,0.15))', cursor: 'grab', userSelect: 'none', outline: isMulti ? '2px dashed #6366f1' : 'none', borderRadius: 4 }}>
              {emoji.emoji}
            </div>
          );
        })}

        {/* Multi-select highlight overlays for notes/texts/frames/images/comments */}
        {multiSelected.map(sel => {
          const items = boardRef.current[sel.kind];
          if (!items) return null;
          const item = items.find(o => o.id === sel.id);
          if (!item || sel.kind === 'shapes') return null;
          const px = 'x' in item ? item.x : 0;
          const py = 'y' in item ? item.y : 0;
          const pw = item.width || 80;
          const ph = item.height || 40;
          const sp = toScreen(px, py, pan, zoom);
          return (
            <div key={sel.id} style={{ position: 'absolute', left: sp.x - 3, top: sp.y - 3, width: pw * zoom + 6, height: ph * zoom + 6, border: '2px dashed #6366f1', borderRadius: 8, pointerEvents: 'none', background: 'rgba(99,102,241,0.04)', zIndex: 28 }}/>
          );
        })}
      </div>

      {/* top-left: logo + title */}
      <div style={{ position: 'absolute', top: 14, left: 14, display: 'flex', alignItems: 'center', gap: 8, background: 'white', borderRadius: 10, padding: '6px 10px 6px 8px', border: '1px solid rgba(15,23,42,0.06)', boxShadow: '0 1px 2px rgba(15,23,42,0.04)', zIndex: 20 }}>
        <a href="dashboard.html" style={{ display: 'flex', alignItems: 'center', gap: 8, paddingRight: 8, borderRight: '1px solid #e2e8f0', textDecoration: 'none' }}>
          <Icons.Logo size={22} />
          <span style={{ fontFamily: 'Caveat', fontSize: 18, fontWeight: 600, color: '#0f172a' }}>StudyFlow</span>
        </a>
        <input value={title} onChange={(e) => setTitle(e.target.value)} style={{ border: 'none', outline: 'none', fontSize: 13, color: '#0f172a', fontWeight: 500, width: 160 }} />
        <span style={{ fontSize: 10.5, color: '#a78bfa', background: '#f3e8ff', padding: '1px 6px', borderRadius: 4, fontWeight: 500 }}>Kostenlos</span>
        {savedAt && <span style={{ fontSize: 11, color: '#94a3b8' }}>{savedAt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</span>}
      </div>

      {/* top-right: avatar group + share */}
      <div style={{ position: 'absolute', top: 14, right: 14, display: 'flex', alignItems: 'center', gap: 10, zIndex: 20 }}>
        {/* Own avatar + collaborators — single overlapping group */}
        {(() => {
          const ownName = user?.user_metadata?.full_name || user?.email || 'Du';
          const ownInitials = ownName.split(/[\s.@]+/).filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join('') || '?';
          const colors = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#ec4899'];
          const allUsers = [
            { initials: ownInitials, color: colors[0], label: 'Du' },
            ...collaborators.slice(0, 4).map((c, i) => ({ initials: c.initials || '?', color: colors[(i + 1) % colors.length], label: 'Mitarbeiter' })),
          ];
          return (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {allUsers.map((u, i) => (
                <div key={i} title={u.label} style={{ width: 30, height: 30, borderRadius: '50%', background: u.color, border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'white', fontWeight: 700, marginLeft: i > 0 ? -8 : 0, zIndex: allUsers.length - i, position: 'relative', letterSpacing: '-0.02em' }}>
                  {u.initials}
                </div>
              ))}
              {collaborators.length > 0 && (
                <div style={{ marginLeft: 8, background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: '3px 8px', fontSize: 11, color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }}/>
                  {collaborators.length + 1} online
                </div>
              )}
            </div>
          );
        })()}
        <button onClick={() => setShareOpen(true)} style={{ padding: '7px 14px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 10, fontSize: 12.5, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 1px 2px rgba(139,92,246,0.3)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icons.Share size={14}/> Teilen
        </button>
      </div>

      {/* templates panel */}
      {showTemplates && <TemplatesPanel onClose={() => setShowTemplates(false)} onInsert={insertTemplate} />}

      {showStickers && <StickersPanel onClose={() => setShowStickers(false)} onPick={placeSticker} />}

      {/* bottom centre: toolbar */}
      <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 25, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>

        {/* colour + pen-size strip — shown for pen / highlight */}
        {(tool === 'pen' || tool === 'highlight') && (
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <PenSizePicker penSizeId={penSizeId} onChange={setPenSizeId} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'white', borderRadius: 999, padding: '6px 10px', border: '1px solid rgba(15,23,42,0.06)', boxShadow: '0 4px 12px rgba(15,23,42,0.06)' }}>
              {PASTELS.concat(PALETTE).map((swatch) => (
                <button key={swatch} onClick={() => setColor(swatch)} style={{ width: swatch === '#ffffff' ? 18 : 18, height: 18, borderRadius: '50%', background: swatch, border: color === swatch ? '2.5px solid #0f172a' : swatch === '#ffffff' ? '1px solid #cbd5e1' : '1px solid rgba(15,23,42,0.1)', cursor: 'pointer', padding: 0, flexShrink: 0 }} />
              ))}
            </div>
          </div>
        )}

        {(['arrow', 'connector'].includes(tool)) && (
          <LineStylePicker lineStyle={lineStyle} arrowEnd={arrowEnd} onLineStyle={setLineStyle} onArrowEnd={setArrowEnd} />
        )}

        {showShapePicker && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'white', borderRadius: 999, padding: '6px 10px', border: '1px solid rgba(15,23,42,0.06)', boxShadow: '0 4px 12px rgba(15,23,42,0.06)' }}>
            {['rect', 'circle', 'arrow', 'connector'].map((shapeTool) => (
              <button key={shapeTool} onClick={() => { setTool(shapeTool); setShowShapePicker(false); }} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: tool === shapeTool ? '#0f172a' : 'transparent', color: tool === shapeTool ? 'white' : '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {TOOL_DEFS[shapeTool].icon}
              </button>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 1, background: 'white', borderRadius: 12, padding: 5, border: '1px solid rgba(15,23,42,0.06)', boxShadow: '0 6px 20px rgba(15,23,42,0.08), 0 1px 3px rgba(15,23,42,0.04)' }}>
          {TOOL_ROWS.map((item, index) => {
            if (item === 'divider') return <div key={`d_${index}`} style={{ width: 1, height: 22, background: '#e2e8f0', margin: '0 4px' }} />;
            const active = tool === item || (item === 'more' && showTemplates) || (item === 'sticker' && showStickers);
            return (
              <button
                key={item}
                onClick={() => {
                  if (item === 'sticker') { setShowStickers((prev) => !prev); return; }
                  if (item === 'more') { setShowTemplates((prev) => !prev); return; }
                  if (item === 'image') { fileInputRef.current?.click(); return; }
                  if (['rect', 'circle', 'arrow', 'connector'].includes(item)) { setTool(item); setShowShapePicker(false); return; }
                  setTool(item);
                  setShowShapePicker(false);
                }}
                onContextMenu={(e) => {
                  if (['rect', 'circle', 'arrow', 'connector'].includes(item)) {
                    e.preventDefault();
                    setShowShapePicker((prev) => !prev);
                  }
                }}
                title={TOOL_DEFS[item].label}
                style={{ width: 34, height: 34, borderRadius: 10, background: active ? '#0f172a' : 'transparent', color: active ? 'white' : '#475569', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}
              >
                {TOOL_DEFS[item].icon}
              </button>
            );
          })}
        </div>
      </div>

      {/* bottom-right: zoom + undo + save */}
      <div style={{ position: 'absolute', bottom: 16, right: 16, display: 'flex', gap: 6, zIndex: 20 }}>
        <button
          onClick={() => setHistory((prev) => { if (!prev.length) return prev; setBoard(prev[prev.length - 1]); return prev.slice(0, -1); })}
          title="Rückgängig (Ctrl+Z)"
          style={{ width: 30, height: 30, background: 'white', border: '1px solid rgba(15,23,42,0.06)', borderRadius: 8, cursor: 'pointer', color: history.length ? '#475569' : '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <ToolIcon size={14}><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/></ToolIcon>
        </button>
        <div style={{ background: 'white', border: '1px solid rgba(15,23,42,0.06)', borderRadius: 8, display: 'flex', alignItems: 'center', boxShadow: '0 1px 2px rgba(15,23,42,0.04)' }}>
          <button onClick={() => setZoom((prev) => Math.max(0.15, prev - 0.1))} style={{ padding: 7, background: 'none', border: 'none', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, lineHeight: 1 }}>-</button>
          <span style={{ fontSize: 11.5, color: '#475569', fontFamily: 'JetBrains Mono', minWidth: 36, textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom((prev) => Math.min(4, prev + 0.1))} style={{ padding: 7, background: 'none', border: 'none', cursor: 'pointer', color: '#475569', display: 'flex' }}><Icons.Plus size={13}/></button>
        </div>
        <button onClick={() => save()} style={{ width: 30, height: 30, background: 'white', border: '1px solid rgba(15,23,42,0.06)', borderRadius: 8, cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Speichern (Ctrl+S)"><Icons.Doc size={14}/></button>
      </div>

      {/* bottom-left: centre-view */}
      <div style={{ position: 'absolute', bottom: 16, left: 16, zIndex: 20 }}>
        <button onClick={() => { setPan({ x: 0, y: 0 }); setZoom(1); }} style={{ background: 'white', border: '1px solid rgba(15,23,42,0.06)', padding: 8, borderRadius: 8, cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontFamily: 'inherit', boxShadow: '0 1px 2px rgba(15,23,42,0.04)' }} title="Board zentrieren">
          <ToolIcon size={14}><path d="M12 2L2 7l10 5 10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></ToolIcon>
        </button>
      </div>

      {/* Right-click context menu */}
      {contextMenu && (
        <div
          style={{ position: 'fixed', left: contextMenu.x, top: contextMenu.y, background: 'white', borderRadius: 12, boxShadow: '0 8px 32px rgba(15,23,42,0.18)', border: '1px solid rgba(15,23,42,0.08)', minWidth: 180, zIndex: 200, overflow: 'hidden', fontSize: 13, color: '#1e293b' }}
          onPointerDown={e => e.stopPropagation()}
        >
          {contextMenu.target ? (
            <>
              <button onClick={ctxDuplicate} style={{ display:'flex', alignItems:'center', gap:9, width:'100%', padding:'10px 14px', border:'none', background:'none', cursor:'pointer', textAlign:'left', fontFamily:'inherit', fontSize:13 }}
                onMouseEnter={e=>e.currentTarget.style.background='#f1f5f9'} onMouseLeave={e=>e.currentTarget.style.background='none'}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                Duplizieren
              </button>
              <button onClick={ctxBringFront} style={{ display:'flex', alignItems:'center', gap:9, width:'100%', padding:'10px 14px', border:'none', background:'none', cursor:'pointer', textAlign:'left', fontFamily:'inherit', fontSize:13 }}
                onMouseEnter={e=>e.currentTarget.style.background='#f1f5f9'} onMouseLeave={e=>e.currentTarget.style.background='none'}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="17 11 12 6 7 11"/><polyline points="17 18 12 13 7 18"/></svg>
                In den Vordergrund
              </button>
              <button onClick={ctxSendBack} style={{ display:'flex', alignItems:'center', gap:9, width:'100%', padding:'10px 14px', border:'none', background:'none', cursor:'pointer', textAlign:'left', fontFamily:'inherit', fontSize:13 }}
                onMouseEnter={e=>e.currentTarget.style.background='#f1f5f9'} onMouseLeave={e=>e.currentTarget.style.background='none'}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="7 13 12 18 17 13"/><polyline points="7 6 12 11 17 6"/></svg>
                In den Hintergrund
              </button>
              <div style={{ height:1, background:'#f1f5f9', margin:'4px 0' }}/>
              <button onClick={ctxDelete} style={{ display:'flex', alignItems:'center', gap:9, width:'100%', padding:'10px 14px', border:'none', background:'none', cursor:'pointer', textAlign:'left', fontFamily:'inherit', fontSize:13, color:'#ef4444' }}
                onMouseEnter={e=>e.currentTarget.style.background='#fef2f2'} onMouseLeave={e=>e.currentTarget.style.background='none'}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                Löschen
              </button>
            </>
          ) : (
            <>
              <button onClick={ctxAddNote} style={{ display:'flex', alignItems:'center', gap:9, width:'100%', padding:'10px 14px', border:'none', background:'none', cursor:'pointer', textAlign:'left', fontFamily:'inherit', fontSize:13 }}
                onMouseEnter={e=>e.currentTarget.style.background='#f1f5f9'} onMouseLeave={e=>e.currentTarget.style.background='none'}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="3"/></svg>
                Notiz hinzufügen
              </button>
              <button onClick={ctxAddText} style={{ display:'flex', alignItems:'center', gap:9, width:'100%', padding:'10px 14px', border:'none', background:'none', cursor:'pointer', textAlign:'left', fontFamily:'inherit', fontSize:13 }}
                onMouseEnter={e=>e.currentTarget.style.background='#f1f5f9'} onMouseLeave={e=>e.currentTarget.style.background='none'}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7V4h16v3"/><path d="M9 20h6M12 4v16"/></svg>
                Text hinzufügen
              </button>
              <div style={{ height:1, background:'#f1f5f9', margin:'4px 0' }}/>
              <button onClick={ctxSelectAll} style={{ display:'flex', alignItems:'center', gap:9, width:'100%', padding:'10px 14px', border:'none', background:'none', cursor:'pointer', textAlign:'left', fontFamily:'inherit', fontSize:13 }}
                onMouseEnter={e=>e.currentTarget.style.background='#f1f5f9'} onMouseLeave={e=>e.currentTarget.style.background='none'}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="4 2"/></svg>
                Alles auswählen
              </button>
              {multiSelected.length > 0 && (
                <button onClick={ctxDelete} style={{ display:'flex', alignItems:'center', gap:9, width:'100%', padding:'10px 14px', border:'none', background:'none', cursor:'pointer', textAlign:'left', fontFamily:'inherit', fontSize:13, color:'#ef4444' }}
                  onMouseEnter={e=>e.currentTarget.style.background='#fef2f2'} onMouseLeave={e=>e.currentTarget.style.background='none'}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                  Auswahl löschen ({multiSelected.length})
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* share modal */}
      {shareOpen && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.36)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ width: 520, background: 'white', borderRadius: 24, boxShadow: '0 24px 60px rgba(15,23,42,0.22)', padding: 20 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Board teilen</div>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 14 }}>Link für Coworking und gemeinsames Bearbeiten.</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <input readOnly value={shareUrl} style={{ flex: 1, border: '1px solid #cbd5e1', borderRadius: 12, padding: '11px 12px', fontSize: 12, color: '#334155' }} />
              <button onClick={copyShareLink} style={{ border: 'none', borderRadius: 12, padding: '0 16px', background: copied ? '#16a34a' : '#0f172a', color: 'white', fontWeight: 600, cursor: 'pointer' }}>{copied ? 'Kopiert' : 'Kopieren'}</button>
            </div>
            <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setShareOpen(false)} style={{ border: '1px solid #e2e8f0', background: 'white', borderRadius: 10, padding: '9px 14px', cursor: 'pointer' }}>Schließen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<Whiteboard />);
