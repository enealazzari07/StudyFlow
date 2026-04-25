// StudyFlow — Notes (Full Whiteboard)
const { useState, useEffect, useRef, useCallback, useMemo } = React;

const DOC_MIME = 'application/studyflow-doc+json';
const DOC_VERSION = 3;

const COLORS = ['#0f172a','#ef4444','#f59e0b','#22c55e','#6366f1','#8b5cf6','#ec4899','#06b6d4','#64748b','#ffffff'];

function uid() { return Math.random().toString(36).slice(2, 9); }
function formatFileSize(b) {
  if (!b) return '—';
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b/1024).toFixed(1)} KB`;
  return `${(b/1048576).toFixed(1)} MB`;
}
function ptOnQuad(t, x1, y1, cx, cy, x2, y2) {
  const mt = 1 - t;
  return { x: mt*mt*x1 + 2*mt*t*cx + t*t*x2, y: mt*mt*y1 + 2*mt*t*cy + t*t*y2 };
}
function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
function canvasXY(canvas, e) {
  const r = canvas.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}
function renderFormula(latex) {
  if (typeof window.katex !== 'undefined') {
    try { return window.katex.renderToString(latex, { throwOnError: false, displayMode: true }); }
    catch { return `<span style="font-family:monospace">${latex}</span>`; }
  }
  return `<span style="font-family:monospace;color:#6366f1">${latex}</span>`;
}

// ─── Canvas Drawing ────────────────────────────────────────────
function drawArrow(ctx, el) {
  const { x1, y1, x2, y2, cx, cy, color = '#0f172a', width = 2 } = el;
  const sz = Math.max(12, width * 4);
  ctx.save();
  ctx.strokeStyle = color; ctx.fillStyle = color;
  ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.quadraticCurveTo(cx, cy, x2, y2);
  ctx.stroke();
  const angle = Math.atan2(y2 - cy, x2 - cx);
  ctx.save();
  ctx.translate(x2, y2); ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-sz, -sz * 0.38);
  ctx.lineTo(-sz * 0.65, 0);
  ctx.lineTo(-sz, sz * 0.38);
  ctx.closePath(); ctx.fill();
  ctx.restore(); ctx.restore();
}

function drawStroke(ctx, el) {
  const pts = el.points; if (!pts || pts.length < 2) return;
  ctx.save();
  ctx.strokeStyle = el.color || '#0f172a'; ctx.lineWidth = el.width || 3;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.globalAlpha = el.mode === 'marker' ? 0.38 : 1;
  ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i].x + pts[i+1].x) / 2, my = (pts[i].y + pts[i+1].y) / 2;
    ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
  }
  ctx.lineTo(pts[pts.length-1].x, pts[pts.length-1].y);
  ctx.stroke(); ctx.restore();
}

function drawShape(ctx, el) {
  ctx.save();
  ctx.strokeStyle = el.color || '#0f172a'; ctx.lineWidth = el.width || 2;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath();
  if (el.kind === 'rect') {
    ctx.rect(Math.min(el.x1,el.x2), Math.min(el.y1,el.y2),
             Math.abs(el.x2-el.x1), Math.abs(el.y2-el.y1));
  } else if (el.kind === 'ellipse') {
    const cx=(el.x1+el.x2)/2, cy=(el.y1+el.y2)/2;
    ctx.ellipse(cx, cy, Math.max(1,Math.abs(el.x2-el.x1)/2), Math.max(1,Math.abs(el.y2-el.y1)/2), 0, 0, 2*Math.PI);
  } else if (el.kind === 'line') {
    ctx.moveTo(el.x1,el.y1); ctx.lineTo(el.x2,el.y2);
  }
  ctx.stroke(); ctx.restore();
}

function redrawCanvas(ctx, elements, selectedId, previewEl) {
  const w = ctx.canvas.width, h = ctx.canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);

  const all = previewEl ? [...elements, previewEl] : elements;
  all.forEach(el => {
    if (el.type === 'stroke') drawStroke(ctx, el);
    else if (el.type === 'arrow') drawArrow(ctx, el);
    else if (el.type === 'shape') drawShape(ctx, el);
    else if (el.type === 'image' && el._img) ctx.drawImage(el._img, el.x, el.y, el.w, el.h);
  });

  if (selectedId) {
    const el = elements.find(e => e.id === selectedId);
    if (el?.type === 'arrow') {
      ctx.save();
      ctx.strokeStyle = 'rgba(99,102,241,0.45)'; ctx.lineWidth = 1.5;
      ctx.setLineDash([5,5]);
      ctx.beginPath(); ctx.moveTo(el.x1,el.y1); ctx.lineTo(el.cx,el.cy); ctx.lineTo(el.x2,el.y2);
      ctx.stroke(); ctx.setLineDash([]);
      // Control handle
      ctx.fillStyle = '#6366f1'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(el.cx, el.cy, 9, 0, 2*Math.PI);
      ctx.fill(); ctx.stroke();
      ctx.restore();
    }
  }
}

function hitArrow(el, px, py) {
  if (Math.hypot(px-el.cx, py-el.cy) < 14) return 'control';
  for (let t = 0; t <= 1; t += 0.04) {
    const pt = ptOnQuad(t, el.x1, el.y1, el.cx, el.cy, el.x2, el.y2);
    if (Math.hypot(px-pt.x, py-pt.y) < 10) return 'curve';
  }
  return null;
}

// ─── Formula Input Modal ──────────────────────────────────────
const FormulaInput = ({ x, y, onConfirm, onCancel }) => {
  const [latex, setLatex] = useState('');
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); }, []);
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.4)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center' }}
         onClick={onCancel}>
      <div style={{ background:'white', borderRadius:16, padding:24, width:400, boxShadow:'0 20px 60px rgba(15,23,42,0.2)' }} onClick={e=>e.stopPropagation()}>
        <div style={{ fontFamily:'Instrument Sans', fontSize:16, fontWeight:600, color:'#0f172a', marginBottom:4 }}>Formel einfügen</div>
        <div style={{ fontSize:12, color:'#94a3b8', marginBottom:14 }}>LaTeX eingeben — z.B. <span style={{fontFamily:'monospace',color:'#6366f1'}}>E=mc^2</span>, <span style={{fontFamily:'monospace',color:'#6366f1'}}>\frac{{a}}{{b}}</span></div>
        <input ref={ref} value={latex} onChange={e=>setLatex(e.target.value)}
               onKeyDown={e => { if(e.key==='Enter' && latex.trim()) onConfirm(latex.trim()); if(e.key==='Escape') onCancel(); }}
               placeholder="\sum_{i=1}^{n} x_i"
               style={{ width:'100%', padding:'10px 12px', border:'1.5px solid #e2e8f0', borderRadius:10, fontSize:15, fontFamily:'monospace', outline:'none', boxSizing:'border-box' }}/>
        {latex && (
          <div style={{ marginTop:12, padding:'10px 14px', background:'#f8fafc', borderRadius:10, minHeight:40, overflowX:'auto' }}
               dangerouslySetInnerHTML={{ __html: renderFormula(latex) }}/>
        )}
        <div style={{ display:'flex', gap:8, marginTop:16 }}>
          <button onClick={onCancel} className="btn-ghost" style={{ flex:1, justifyContent:'center', padding:'9px 0' }}>Abbrechen</button>
          <button onClick={() => latex.trim() && onConfirm(latex.trim())} disabled={!latex.trim()} className="btn-primary" style={{ flex:1, justifyContent:'center', padding:'9px 0', opacity:!latex.trim()?0.5:1 }}>
            Einfügen
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Share Modal ──────────────────────────────────────────────
const ShareModal = ({ docId, userId, onClose }) => {
  const [email, setEmail] = useState('');
  const [copied, setCopied] = useState(false);
  const [msg, setMsg] = useState('');
  const base = window.location.href.replace(/\?.*$/, '');
  const url = docId ? `${base}?id=${docId}` : base;

  const copyLink = () => {
    navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  const invite = async () => {
    if (!email.trim()) return;
    try {
      const { error } = await window.sb.from('note_shares').insert({
        doc_id: docId, invited_email: email.trim().toLowerCase(), invited_by: userId, permission: 'edit',
      });
      if (error?.code === '42P01') {
        navigator.clipboard.writeText(url);
        setMsg(`Link für ${email.trim()} kopiert — schick ihn weiter!`);
      } else if (error) {
        setMsg(`Link kopiert — schick ihn an: ${email.trim()}`);
        navigator.clipboard.writeText(url);
      } else {
        setMsg(`Einladung an ${email.trim()} gesendet!`); setEmail('');
      }
    } catch { setMsg(`Link kopiert für ${email.trim()}!`); navigator.clipboard.writeText(url); }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.5)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }} onClick={onClose}>
      <div style={{ background:'white', borderRadius:20, padding:28, width:440, boxShadow:'0 20px 60px rgba(15,23,42,0.2)' }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <div style={{ fontFamily:'Instrument Sans', fontSize:18, fontWeight:600, color:'#0f172a' }}>Note teilen</div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#64748b' }}><Icons.X size={18}/></button>
        </div>
        <div style={{ fontSize:12, color:'#64748b', marginBottom:6 }}>Direkt-Link</div>
        <div style={{ display:'flex', gap:8, marginBottom:20 }}>
          <div style={{ flex:1, padding:'9px 12px', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:8, fontSize:12, color:'#475569', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{url}</div>
          <button onClick={copyLink} className="btn-primary" style={{ padding:'9px 14px', flexShrink:0 }}>
            {copied ? <><Icons.Check size={13}/> Kopiert!</> : 'Kopieren'}
          </button>
        </div>
        <div style={{ height:1, background:'#f1f5f9', margin:'4px 0 20px' }}/>
        <div style={{ fontSize:12, color:'#64748b', marginBottom:8 }}>Mitarbeiter einladen</div>
        <div style={{ display:'flex', gap:8 }}>
          <input value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&invite()} placeholder="E-Mail-Adresse…" className="input-paper" style={{ flex:1, fontSize:13 }}/>
          <button onClick={invite} disabled={!email.trim()} className="btn-primary" style={{ padding:'9px 14px', flexShrink:0, opacity:!email.trim()?0.5:1 }}>Einladen</button>
        </div>
        {msg && <div style={{ marginTop:8, fontSize:13, color:'#059669' }}>{msg}</div>}
        <div style={{ marginTop:20, padding:'12px 14px', background:'#eef2ff', borderRadius:10, fontSize:13, color:'#4338ca', display:'flex', gap:8, alignItems:'flex-start' }}>
          <Icons.Users size={15}/>
          <span>Alle, die den Link haben, können die Note im Collab-Modus gemeinsam bearbeiten.</span>
        </div>
      </div>
    </div>
  );
};

// ─── Set Share Modal ──────────────────────────────────────────
const SetShareModal = ({ set, onClose }) => {
  const [copied, setCopied] = useState(false);
  const base = window.location.origin + window.location.pathname.replace(/[^/]*$/, '');
  const url = `${base}lernset.html?id=${set.id}`;
  const copyLink = () => { navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(()=>setCopied(false),2000); }); };
  const exportJSON = () => {
    const d = { title: set.title, cards: (set.cards||[]).map(c=>({front:c.front,back:c.back})) };
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(d,null,2)],{type:'application/json'}));
    a.download = (set.title||'lernset').replace(/[^a-z0-9]/gi,'_')+'.json';
    a.click();
  };
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.5)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }} onClick={onClose}>
      <div style={{ background:'white', borderRadius:20, padding:28, width:440, boxShadow:'0 20px 60px rgba(15,23,42,0.2)' }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <div style={{ fontFamily:'Instrument Sans', fontSize:18, fontWeight:600, color:'#0f172a' }}>Lernset teilen</div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#64748b' }}><Icons.X size={18}/></button>
        </div>
        <div style={{ fontFamily:'Caveat', fontSize:22, color:'#0f172a', marginBottom:16 }}>{set.title}</div>
        <div style={{ fontSize:12, color:'#64748b', marginBottom:6 }}>Direkt-Link</div>
        <div style={{ display:'flex', gap:8, marginBottom:16 }}>
          <div style={{ flex:1, padding:'9px 12px', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:8, fontSize:12, color:'#475569', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{url}</div>
          <button onClick={copyLink} className="btn-primary" style={{ padding:'9px 14px', flexShrink:0 }}>
            {copied ? <><Icons.Check size={13}/> Kopiert!</> : 'Kopieren'}
          </button>
        </div>
        <button onClick={exportJSON} className="btn-ghost" style={{ width:'100%', justifyContent:'center', padding:'10px 0', fontSize:13, marginBottom:12 }}>
          <Icons.Upload size={14}/> Als JSON exportieren
        </button>
        <div style={{ padding:'12px 14px', background:'#eef2ff', borderRadius:10, fontSize:13, color:'#4338ca' }}>
          Empfänger können das Lernset per Link öffnen und eine Kopie in ihrer Bibliothek speichern.
        </div>
      </div>
    </div>
  );
};

// ─── Presence Cursors ─────────────────────────────────────────
const CURSOR_COLORS = ['#ef4444','#f59e0b','#10b981','#6366f1','#ec4899','#06b6d4'];
const PresenceCursors = ({ cursors, myId }) => (
  <>
    {Object.entries(cursors).map(([id, cur]) => {
      if (id === myId) return null;
      const col = CURSOR_COLORS[parseInt(id.slice(-2), 16) % CURSOR_COLORS.length];
      return (
        <div key={id} style={{ position:'absolute', left:cur.x, top:cur.y, pointerEvents:'none', zIndex:100, transform:'translate(-2px,-2px)' }}>
          <svg width="20" height="20" viewBox="0 0 20 20">
            <path d="M4 2l12 7-7 2-2 7z" fill={col} stroke="white" strokeWidth="1.5"/>
          </svg>
          <div style={{ background:col, color:'white', fontSize:10, padding:'1px 6px', borderRadius:999, whiteSpace:'nowrap', marginTop:-4, marginLeft:14 }}>{cur.name || 'User'}</div>
        </div>
      );
    })}
  </>
);

// ─── Main Whiteboard ──────────────────────────────────────────
const Whiteboard = ({ elements, setElements, textItems, setTextItems, colChannel, myId, myName, docId }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const drawingRef = useRef({ active:false, stroke:null, startX:0, startY:0 });
  const dragRef = useRef({ active:false, targetId:null, part:null });
  const imgInputRef = useRef(null);

  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState('#0f172a');
  const [size, setSize] = useState(3);
  const [selectedId, setSelectedId] = useState(null);
  const [previewEl, setPreviewEl] = useState(null);
  const [formulaAt, setFormulaAt] = useState(null); // {x,y}
  const [editingText, setEditingText] = useState(null); // text item id being edited
  const [history, setHistory] = useState([]);
  const [cursors, setCursors] = useState({});
  const lastCursorBroadcast = useRef(0);

  // Canvas setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const w = Math.floor(r.width * dpr), h = Math.floor(r.height * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
      }
      const ctx = canvas.getContext('2d');
      redrawCanvas(ctx, elements, selectedId, previewEl);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    window.addEventListener('resize', resize);
    return () => { ro.disconnect(); window.removeEventListener('resize', resize); };
  }, []);

  // Redraw on data change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    redrawCanvas(ctx, elements, selectedId, previewEl);
  }, [elements, selectedId, previewEl]);

  // Collab: subscribe to remote events
  useEffect(() => {
    if (!colChannel) return;
    colChannel.on('broadcast', { event: 'element' }, ({ payload }) => {
      if (payload.fromId === myId) return;
      setElements(prev => {
        const exists = prev.find(e => e.id === payload.el.id);
        if (exists) return prev.map(e => e.id === payload.el.id ? payload.el : e);
        // Restore image element reference
        if (payload.el.type === 'image' && payload.el.src) {
          const img = new Image(); img.src = payload.el.src;
          return [...prev, { ...payload.el, _img: img }];
        }
        return [...prev, payload.el];
      });
    });
    colChannel.on('broadcast', { event: 'cursor' }, ({ payload }) => {
      if (payload.id === myId) return;
      setCursors(prev => ({ ...prev, [payload.id]: { x: payload.x, y: payload.y, name: payload.name } }));
    });
    colChannel.on('broadcast', { event: 'textItems' }, ({ payload }) => {
      if (payload.fromId === myId) return;
      setTextItems(payload.items);
    });
  }, [colChannel]);

  const broadcastEl = useCallback((el) => {
    if (!colChannel) return;
    colChannel.send({ type: 'broadcast', event: 'element', payload: { fromId: myId, el: { ...el, _img: undefined } } });
  }, [colChannel, myId]);

  const broadcastTextItems = useCallback((items) => {
    if (!colChannel) return;
    colChannel.send({ type: 'broadcast', event: 'textItems', payload: { fromId: myId, items } });
  }, [colChannel, myId]);

  // Undo
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        setHistory(h => {
          if (h.length === 0) return h;
          const prev = h[h.length - 1];
          setElements(prev.elements);
          setTextItems(prev.textItems);
          return h.slice(0, -1);
        });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const saveHistory = () => {
    setHistory(h => [...h.slice(-30), { elements: [...elements], textItems: [...textItems] }]);
  };

  // Pointer handlers
  const getPos = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    return canvasXY(canvas, e);
  };

  const broadcastCursor = (e) => {
    if (!colChannel) return;
    const now = Date.now();
    if (now - lastCursorBroadcast.current < 40) return;
    lastCursorBroadcast.current = now;
    const { x, y } = getPos(e);
    colChannel.send({ type: 'broadcast', event: 'cursor', payload: { id: myId, x, y, name: myName } });
  };

  const onPointerDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture?.(e.pointerId);
    const { x, y } = getPos(e);

    if (tool === 'select') {
      // Check if clicking on selected arrow's control point
      if (selectedId) {
        const el = elements.find(el => el.id === selectedId);
        if (el?.type === 'arrow' && Math.hypot(x - el.cx, y - el.cy) < 14) {
          dragRef.current = { active: true, targetId: selectedId, part: 'control' };
          return;
        }
      }
      // Hit test all elements
      let found = null;
      for (let i = elements.length - 1; i >= 0; i--) {
        const el = elements[i];
        if (el.type === 'arrow') {
          const hit = hitArrow(el, x, y);
          if (hit) { found = el.id; break; }
        }
      }
      setSelectedId(found);
      return;
    }

    if (tool === 'formula') {
      setFormulaAt({ x, y }); return;
    }

    if (tool === 'text') {
      const id = uid();
      const newItem = { id, type: 'text', x, y, text: '', color, fontSize: 18 };
      saveHistory();
      const updated = [...textItems, newItem];
      setTextItems(updated);
      broadcastTextItems(updated);
      setEditingText(id);
      return;
    }

    if (tool === 'pen' || tool === 'marker' || tool === 'eraser') {
      saveHistory();
      const c = tool === 'eraser' ? '#ffffff' : color;
      const w = tool === 'eraser' ? Math.max(16, size * 4) : size;
      const s = { id: uid(), type: 'stroke', mode: tool, color: c, width: w, points: [{ x, y }] };
      drawingRef.current = { active: true, stroke: s };
      setElements(prev => [...prev, s]);
      return;
    }

    if (tool === 'arrow') {
      saveHistory();
      const cx = x + 1, cy = y + 1;
      const s = { id: uid(), type: 'arrow', x1: x, y1: y, x2: x, y2: y, cx, cy, color, width: size };
      drawingRef.current = { active: true, stroke: s, startX: x, startY: y };
      setPreviewEl(s);
      return;
    }

    if (tool === 'line' || tool === 'rect' || tool === 'ellipse') {
      saveHistory();
      const s = { id: uid(), type: 'shape', kind: tool === 'line' ? 'line' : tool === 'rect' ? 'rect' : 'ellipse', x1: x, y1: y, x2: x, y2: y, color, width: size };
      drawingRef.current = { active: true, stroke: s, startX: x, startY: y };
      setPreviewEl(s);
      return;
    }
  };

  const onPointerMove = (e) => {
    broadcastCursor(e);
    const { x, y } = getPos(e);

    // Drag arrow control point
    if (dragRef.current.active) {
      const { targetId } = dragRef.current;
      setElements(prev => prev.map(el => {
        if (el.id !== targetId) return el;
        return { ...el, cx: x, cy: y };
      }));
      return;
    }

    if (!drawingRef.current.active) return;
    const s = drawingRef.current.stroke;

    if (tool === 'pen' || tool === 'marker' || tool === 'eraser') {
      s.points.push({ x, y });
      setElements(prev => prev.map(el => el.id === s.id ? { ...el, points: [...s.points] } : el));
      if (tool === 'eraser') {
        const eraserRadius = Math.max(16, size * 4);
        setTextItems(prev => {
          const filtered = prev.filter(item => Math.hypot(x - item.x, y - item.y) >= eraserRadius);
          if (filtered.length !== prev.length) broadcastTextItems(filtered);
          return filtered;
        });
      }
      return;
    }

    if (tool === 'arrow') {
      const mx = (drawingRef.current.startX + x) / 2;
      const my = (drawingRef.current.startY + y) / 2;
      const updated = { ...s, x2: x, y2: y, cx: mx, cy: my };
      drawingRef.current.stroke = updated;
      setPreviewEl(updated);
      return;
    }

    if (tool === 'line' || tool === 'rect' || tool === 'ellipse') {
      const updated = { ...s, x2: x, y2: y };
      drawingRef.current.stroke = updated;
      setPreviewEl(updated);
      return;
    }
  };

  const onPointerUp = (e) => {
    // Finish arrow drag
    if (dragRef.current.active) {
      const { targetId } = dragRef.current;
      dragRef.current = { active: false };
      const el = elements.find(e => e.id === targetId);
      if (el) broadcastEl(el);
      return;
    }

    if (!drawingRef.current.active) return;
    const s = drawingRef.current.stroke;
    drawingRef.current = { active: false };

    if (tool === 'pen' || tool === 'marker' || tool === 'eraser') {
      broadcastEl(s); return;
    }

    if (tool === 'arrow') {
      setPreviewEl(null);
      setElements(prev => [...prev, s]);
      broadcastEl(s);
      setSelectedId(s.id);
      setTool('select');
      return;
    }

    if (tool === 'line' || tool === 'rect' || tool === 'ellipse') {
      setPreviewEl(null);
      setElements(prev => [...prev, s]);
      broadcastEl(s);
      return;
    }
  };

  const addImage = (file) => {
    if (!file?.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        const maxW = canvas ? canvas.getBoundingClientRect().width * 0.45 : 400;
        const scale = Math.min(1, maxW / img.naturalWidth);
        const el = { id: uid(), type: 'image', x: 20, y: 20, w: img.naturalWidth * scale, h: img.naturalHeight * scale, src: ev.target.result, _img: img };
        saveHistory();
        setElements(prev => [...prev, el]);
        broadcastEl(el);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const clearBoard = () => {
    if (!confirm('Whiteboard wirklich leeren?')) return;
    saveHistory();
    setElements([]); setTextItems([]); setSelectedId(null);
  };

  const TOOL_DEFS = [
    { id:'select', label:'Auswählen', sym:'↖' },
    { id:'pen', label:'Stift', sym:'✏' },
    { id:'marker', label:'Marker', sym:'🖊' },
    { id:'eraser', label:'Radierer', sym:'⌫' },
    null,
    { id:'text', label:'Text  T', sym:'T' },
    { id:'formula', label:'Formel ∑', sym:'∑' },
    null,
    { id:'arrow', label:'Pfeil', sym:'→' },
    { id:'line', label:'Linie', sym:'—' },
    { id:'rect', label:'Rechteck', sym:'□' },
    { id:'ellipse', label:'Ellipse', sym:'○' },
  ];

  const cursor = { select:'default', pen:'crosshair', marker:'crosshair', eraser:'cell', text:'text', formula:'crosshair', arrow:'crosshair', line:'crosshair', rect:'crosshair', ellipse:'crosshair' }[tool] || 'crosshair';

  return (
    <div style={{ display:'flex', height:'100%', overflow:'hidden' }}>
      {/* Left Toolbar */}
      <div style={{ width:52, background:'white', borderRight:'1px solid rgba(15,23,42,0.07)', display:'flex', flexDirection:'column', alignItems:'center', padding:'10px 0', gap:2, flexShrink:0 }}>
        {TOOL_DEFS.map((t, i) => {
          if (!t) return <div key={i} style={{ height:1, width:32, background:'#e2e8f0', margin:'4px 0' }}/>;
          const active = tool === t.id;
          return (
            <button key={t.id} onClick={() => { setTool(t.id); setSelectedId(null); }} title={t.label}
              style={{ width:38, height:38, borderRadius:10, border:'none', cursor:'pointer', background:active?'#eef2ff':'transparent', color:active?'#4f46e5':'#475569', fontSize:t.id==='formula'?16:15, fontWeight:active?700:400, display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.12s' }}>
              {t.sym}
            </button>
          );
        })}

        <div style={{ height:1, width:32, background:'#e2e8f0', margin:'4px 0' }}/>

        {/* Image upload */}
        <button onClick={() => imgInputRef.current?.click()} title="Bild einfügen"
          style={{ width:38, height:38, borderRadius:10, border:'none', cursor:'pointer', background:'transparent', color:'#475569', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Icons.Upload size={15}/>
        </button>
        <input ref={imgInputRef} type="file" accept="image/*" style={{ display:'none' }}
          onChange={e => { addImage(e.target.files?.[0]); e.target.value=''; }}/>

        <div style={{ marginTop:'auto', paddingBottom:8 }}>
          <button onClick={clearBoard} title="Alles löschen"
            style={{ width:38, height:38, borderRadius:10, border:'none', cursor:'pointer', background:'transparent', color:'#94a3b8', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Icons.Trash size={14}/>
          </button>
        </div>
      </div>

      {/* Main canvas area */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {/* Top toolbar */}
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 14px', borderBottom:'1px solid rgba(15,23,42,0.07)', background:'#fafaf7', flexShrink:0 }}>
          {/* Colors */}
          <div style={{ display:'flex', gap:4 }}>
            {COLORS.map(c => (
              <button key={c} onClick={() => { setColor(c); if(['eraser','select','formula','text'].includes(tool)) setTool('pen'); }} title={c}
                style={{ width:20, height:20, borderRadius:'50%', background:c, border:c==='#ffffff'?'1.5px solid #e2e8f0':'none', cursor:'pointer',
                         outline:color===c&&!['eraser','select'].includes(tool)?`2.5px solid ${c}`:c==='#ffffff'&&color===c?'2.5px solid #e2e8f0':'2.5px solid transparent',
                         outlineOffset:2 }}/>
            ))}
          </div>

          <div style={{ width:1, height:22, background:'#e2e8f0' }}/>

          {/* Size */}
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ fontSize:11, color:'#64748b' }}>Größe</span>
            <input type="range" min={1} max={18} value={size} onChange={e=>setSize(+e.target.value)} style={{ width:80, accentColor:'#6366f1' }}/>
            <div style={{ width:clamp(size, 4, 18), height:clamp(size, 4, 18), borderRadius:'50%', background:['select','text','formula','eraser'].includes(tool)?'#94a3b8':color, flexShrink:0 }}/>
          </div>

          {selectedId && (
            <>
              <div style={{ width:1, height:22, background:'#e2e8f0' }}/>
              <div style={{ fontSize:12, color:'#6366f1', display:'flex', alignItems:'center', gap:5 }}>
                <Icons.Edit size={12}/> Pfeil: Kontrollpunkt ziehen zum Biegen
              </div>
            </>
          )}

          <div style={{ marginLeft:'auto', fontSize:11, color:'#94a3b8' }}>
            Strg+Z zum Rückgängig
          </div>
        </div>

        {/* Canvas + overlays */}
        <div ref={containerRef} style={{ flex:1, position:'relative', overflow:'hidden', background:'white' }}>
          <canvas ref={canvasRef} style={{ width:'100%', height:'100%', display:'block', touchAction:'none', cursor }}
            onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}/>

          {/* Text/formula overlays */}
          <div style={{ position:'absolute', inset:0, pointerEvents:'none', overflow:'hidden' }}>
            {textItems.map(item => (
              <div key={item.id} style={{ position:'absolute', left:item.x, top:item.y, pointerEvents:'auto', zIndex:10 }}>
                {item.type === 'formula' ? (
                  <div style={{ padding:'4px 8px', cursor:'move', minWidth:40 }}
                    dangerouslySetInnerHTML={{ __html: renderFormula(item.text) }}
                    onDoubleClick={() => {
                      const newLatex = prompt('Formel bearbeiten (LaTeX):', item.text);
                      if (newLatex !== null) {
                        saveHistory();
                        const updated = textItems.map(t => t.id===item.id ? {...t, text: newLatex} : t);
                        setTextItems(updated);
                        broadcastTextItems(updated);
                      }
                    }}/>
                ) : editingText === item.id ? (
                  <div
                    contentEditable
                    suppressContentEditableWarning
                    autoFocus
                    onBlur={e => {
                      const updated = textItems.map(t => t.id===item.id ? {...t, text:e.currentTarget.innerText} : t);
                      setTextItems(updated);
                      setEditingText(null);
                      broadcastTextItems(updated);
                      if (!e.currentTarget.innerText.trim()) {
                        const cleaned = updated.filter(t => t.id !== item.id);
                        setTextItems(cleaned);
                        broadcastTextItems(cleaned);
                      }
                    }}
                    onKeyDown={e => { if (e.key==='Escape') e.currentTarget.blur(); }}
                    style={{ minWidth:80, outline:'2px solid #6366f1', borderRadius:6, padding:'3px 6px', background:'white',
                             fontSize:item.fontSize||18, color:item.color||'#0f172a', fontFamily:'Caveat', cursor:'text', whiteSpace:'nowrap' }}>
                    {item.text}
                  </div>
                ) : (
                  <div style={{ fontSize:item.fontSize||18, color:item.color||'#0f172a', fontFamily:'Caveat',
                               cursor:'text', whiteSpace:'nowrap' }}
                    onClick={() => setEditingText(item.id)}
                    onDoubleClick={() => {
                      saveHistory();
                      const cleaned = textItems.filter(t => t.id !== item.id);
                      setTextItems(cleaned);
                      broadcastTextItems(cleaned);
                    }}>
                    {item.text || <span style={{ color:'#94a3b8', fontStyle:'italic' }}>Text…</span>}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Presence cursors */}
          <PresenceCursors cursors={cursors} myId={myId}/>

          {/* Empty hint */}
          {elements.length === 0 && textItems.length === 0 && (
            <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10, pointerEvents:'none', color:'#cbd5e1' }}>
              <div style={{ fontSize:48 }}>✏️</div>
              <div style={{ fontFamily:'Caveat', fontSize:22 }}>Zeichnen, schreiben, Formeln — fang einfach an</div>
              <div style={{ fontSize:13 }}>Wähle ein Werkzeug links oder drück direkt auf die Fläche</div>
            </div>
          )}
        </div>
      </div>

      {/* Formula modal */}
      {formulaAt && (
        <FormulaInput
          x={formulaAt.x} y={formulaAt.y}
          onConfirm={(latex) => {
            saveHistory();
            const newItem = { id:uid(), type:'formula', x:formulaAt.x, y:formulaAt.y, text:latex, color, fontSize:18 };
            const updated = [...textItems, newItem];
            setTextItems(updated);
            broadcastTextItems(updated);
            setFormulaAt(null);
          }}
          onCancel={() => setFormulaAt(null)}
        />
      )}
    </div>
  );
};

// ─── Main Page ─────────────────────────────────────────────────
const DokumentEditor = () => {
  const docId = useMemo(() => new URLSearchParams(window.location.search).get('id'), []);
  const [user, setUser] = useState(null);
  const [docRow, setDocRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedAt, setSavedAt] = useState(null);
  const [title, setTitle] = useState('Neue Note');
  const [elements, setElements] = useState([]);
  const [textItems, setTextItems] = useState([]);
  const [showShare, setShowShare] = useState(false);
  const [colChannel, setColChannel] = useState(null);
  const [myId] = useState(() => uid());
  const [myName, setMyName] = useState('');
  const [onlineCount, setOnlineCount] = useState(1);

  useEffect(() => {
    (async () => {
      const session = await window.requireAuth();
      if (!session) return;
      setUser(session.user);

      const { data: prof } = await window.sb.from('profiles').select('display_name').eq('id', session.user.id).single();
      setMyName(prof?.display_name || session.user.email?.split('@')[0] || 'Ich');

      try {
        if (docId) {
          const { data: row } = await window.sb.from('documents').select('*').eq('id', docId).single();
          if (row) {
            setDocRow(row);
            setTitle(row.name?.replace(/\.[^.]+$/, '') || 'Note');
            if (row.file_path) {
              const { data: dl } = await window.sb.storage.from('documents').download(row.file_path);
              if (dl) {
                const parsed = JSON.parse(await dl.text());
                setTitle(parsed.title || 'Note');
                const els = Array.isArray(parsed.elements) ? parsed.elements : [];
                // Restore image _img references
                const restored = await Promise.all(els.map(el => {
                  if (el.type === 'image' && el.src) {
                    return new Promise(res => {
                      const img = new Image(); img.onload = () => res({ ...el, _img: img }); img.onerror = () => res(el); img.src = el.src;
                    });
                  }
                  return Promise.resolve(el);
                }));
                setElements(restored);
                setTextItems(Array.isArray(parsed.textItems) ? parsed.textItems : []);
              }
            }
          }
        }
      } catch (e) { setError(e?.message || 'Ladefehler'); }
      finally { setLoading(false); }
    })();
  }, [docId]);

  // Setup realtime collab channel — only when document has a real saved ID
  useEffect(() => {
    if (!docRow?.id) return;
    const ch = window.sb.channel(`note-${docRow.id}`, { config: { broadcast: { self: false } } });
    ch.on('presence', { event: 'sync' }, () => {
      const state = ch.presenceState();
      setOnlineCount(Object.keys(state).length);
    });
    ch.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await ch.track({ user_id: myId, name: myName });
      }
    });
    setColChannel(ch);
    return () => { ch.unsubscribe(); setColChannel(null); };
  }, [docRow?.id, myName]);

  // Auto-save every 90s
  useEffect(() => {
    if (!user || loading) return;
    const t = setInterval(() => save(true), 90000);
    return () => clearInterval(t);
  }, [user, loading, title, elements, textItems]);

  const save = async (silent = false) => {
    if (!user) return;
    if (!silent) setSaving(true);
    setError('');
    try {
      const payload = {
        type: 'studyflow_doc', version: DOC_VERSION,
        title: title?.trim() || 'Note',
        elements: elements.map(({ _img, ...el }) => el),
        textItems,
        updated_at: new Date().toISOString(),
      };
      const json = JSON.stringify(payload);
      const blob = new Blob([json], { type: DOC_MIME });
      const safe = payload.title.replace(/[^a-zA-Z0-9._-]/g, '_');
      let path = docRow?.file_path || `${user.id}/${Date.now()}_${safe}.studyflow.json`;

      await window.sb.storage.from('documents').upload(path, blob, { contentType: DOC_MIME, upsert: true });

      if (!docRow) {
        const { data: row } = await window.sb.from('documents').insert({
          owner_id: user.id, name: `${payload.title}.studyflow.json`,
          file_path: path, file_size: blob.size, mime_type: DOC_MIME, ai_processed: false,
        }).select().single();
        if (row) {
          setDocRow(row);
          window.history.replaceState({}, '', `?id=${row.id}`);
        }
      } else {
        await window.sb.from('documents').update({
          name: `${payload.title}.studyflow.json`, file_path: path, file_size: blob.size,
        }).eq('id', docRow.id);
      }
      setSavedAt(new Date());
    } catch (e) { if (!silent) setError(e?.message || 'Speicherfehler'); }
    finally { if (!silent) setSaving(false); }
  };

  if (loading) return (
    <div className="dot-paper" style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ fontFamily:'Caveat', fontSize:24, color:'#64748b' }}>Lädt…</div>
    </div>
  );

  return (
    <div style={{ height:'100vh', display:'flex', flexDirection:'column', overflow:'hidden', background:'#f8fafc' }}>
      {/* Header */}
      <header style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 20px', background:'white', borderBottom:'1px solid rgba(15,23,42,0.07)', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, minWidth:0, flex:1 }}>
          <a href="dashboard.html" style={{ display:'flex', alignItems:'center', gap:5, color:'#64748b', fontSize:13, flexShrink:0, textDecoration:'none' }}>
            <Icons.ArrowLeft size={14}/> Dashboard
          </a>
          <div style={{ height:18, width:1, background:'#e2e8f0', flexShrink:0 }}/>
          <input value={title} onChange={e=>setTitle(e.target.value)}
            style={{ fontFamily:'Instrument Sans', fontSize:15, fontWeight:600, color:'#0f172a', border:'none', outline:'none', background:'transparent', minWidth:0, flex:1 }}
            placeholder="Titel…"/>
          <div style={{ fontSize:11, color:'#94a3b8', flexShrink:0, whiteSpace:'nowrap' }}>
            {formatFileSize(docRow?.file_size)}
            {savedAt && ` · ${savedAt.toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})}`}
          </div>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:8, marginLeft:16, flexShrink:0 }}>
          {onlineCount > 1 && (
            <div style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 10px', background:'#d1fae5', borderRadius:999, fontSize:12, color:'#065f46', fontWeight:500 }}>
              <Icons.Users size={12}/> {onlineCount} online
            </div>
          )}
          <button onClick={() => setShowShare(true)} className="btn-ghost" style={{ padding:'7px 12px', fontSize:13, display:'flex', alignItems:'center', gap:6 }}>
            <Icons.Share size={13}/> Teilen
          </button>
          <button onClick={() => save(false)} disabled={saving} className="btn-primary" style={{ padding:'7px 14px', fontSize:13, opacity:saving?0.7:1 }}>
            {saving ? 'Speichert…' : <><Icons.Check size={13}/> Speichern</>}
          </button>
        </div>
      </header>

      {error && (
        <div style={{ background:'#fee2e2', padding:'10px 20px', fontSize:13, color:'#991b1b', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
          <span>{error}</span>
          <button onClick={()=>setError('')} style={{ background:'none', border:'none', color:'#991b1b', cursor:'pointer' }}><Icons.X size={14}/></button>
        </div>
      )}

      {/* Whiteboard */}
      <div style={{ flex:1, overflow:'hidden', margin:'12px', borderRadius:16, border:'1px solid rgba(15,23,42,0.07)', boxShadow:'0 2px 12px rgba(15,23,42,0.06)', background:'white' }}>
        <Whiteboard
          elements={elements} setElements={setElements}
          textItems={textItems} setTextItems={setTextItems}
          colChannel={colChannel} myId={myId} myName={myName}
          docId={docRow?.id}
        />
      </div>

      {showShare && (
        <ShareModal docId={docRow?.id} userId={user?.id} onClose={() => setShowShare(false)}/>
      )}

      <AIAssistant/>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<DokumentEditor/>);
