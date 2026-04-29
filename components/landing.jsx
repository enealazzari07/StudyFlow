// StudyFlow — Landing Page v2 (animated)
const { useState, useEffect, useRef } = React;

// ─── Global animation CSS ─────────────────────────────────────
const ANIM_CSS = `
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(36px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeDown {
    from { opacity: 0; transform: translateY(-24px) scale(0.95); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.86); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes fadeInLeft {
    from { opacity: 0; transform: translateX(-40px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes fadeInRight {
    from { opacity: 0; transform: translateX(40px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes floatY {
    0%,100% { transform: translateY(0px) rotate(var(--rot,0deg)); }
    50%      { transform: translateY(-12px) rotate(var(--rot,0deg)); }
  }
  @keyframes scrollBounce {
    0%,100% { transform: translateY(0); opacity: 0.7; }
    50%     { transform: translateY(9px); opacity: 0.3; }
  }
  @keyframes heroLine {
    from { width: 0; }
    to   { width: 100%; }
  }
  @keyframes progressFill {
    from { transform: scaleX(0); }
    to   { transform: scaleX(1); }
  }
  @keyframes glowPulse {
    0%,100% { opacity: 0.5; transform: scale(1); }
    50%     { opacity: 0.8; transform: scale(1.05); }
  }
  @keyframes typeIn {
    from { width: 0; }
    to   { width: 100%; }
  }
  @keyframes cursorBlink {
    0%,100% { border-color: #6366f1; }
    50%     { border-color: transparent; }
  }

  /* Reveal on scroll */
  .sf-reveal {
    opacity: 0;
    transform: translateY(56px);
    transition: opacity 1s cubic-bezier(0.16,1,0.3,1),
                transform 1s cubic-bezier(0.16,1,0.3,1);
  }
  .sf-reveal.sf-visible { opacity: 1; transform: translateY(0); }

  .sf-reveal-l {
    opacity: 0; transform: translateX(-56px);
    transition: opacity 1s cubic-bezier(0.16,1,0.3,1),
                transform 1s cubic-bezier(0.16,1,0.3,1);
  }
  .sf-reveal-l.sf-visible { opacity: 1; transform: translateX(0); }

  .sf-reveal-r {
    opacity: 0; transform: translateX(56px);
    transition: opacity 1s cubic-bezier(0.16,1,0.3,1),
                transform 1s cubic-bezier(0.16,1,0.3,1);
  }
  .sf-reveal-r.sf-visible { opacity: 1; transform: translateX(0); }

  .sf-reveal-scale {
    opacity: 0; transform: scale(0.88) translateY(24px);
    transition: opacity 1s cubic-bezier(0.16,1,0.3,1),
                transform 1s cubic-bezier(0.16,1,0.3,1);
  }
  .sf-reveal-scale.sf-visible { opacity: 1; transform: scale(1) translateY(0); }

  /* Hero word-by-word */
  .hw { opacity: 0; display: inline-block; }
  .hw.in { animation: fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) forwards; }

  /* 3D card tilt */
  .bento-tilt {
    transform-style: preserve-3d;
    will-change: transform;
  }

  /* Cursor glow */
  .cursor-glow {
    position: fixed;
    width: 640px; height: 640px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(99,102,241,0.10) 0%, rgba(99,102,241,0.03) 45%, transparent 70%);
    pointer-events: none;
    z-index: 0;
    transform: translate(-50%, -50%);
  }

  /* Particle canvas */
  .sf-particles {
    position: absolute; inset: 0; width: 100%; height: 100%;
    pointer-events: none;
  }

  /* Floating doodles */
  .doodle-float-1 { --rot: -6deg; animation: floatY 4.5s ease-in-out infinite; }
  .doodle-float-2 { --rot: 12deg; animation: floatY 5.2s ease-in-out infinite 0.6s; }
  .doodle-float-3 { --rot: -3deg; animation: floatY 3.8s ease-in-out infinite 1.2s; }

  /* Gradient hero text */
  .hero-gradient {
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%);
    background-size: 200% 200%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* Section label */
  .section-label {
    font-family: 'Caveat', cursive;
    font-size: 20px; font-weight: 600; color: #6366f1;
    animation: fadeDown 0.6s ease both;
  }
`;

// ─── Particle Canvas ──────────────────────────────────────────
const HeroParticles = () => {
  const canvasRef = useRef(null);
  const stateRef = useRef({ particles: [], mouse: { x: -999, y: -999 }, raf: null });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const state = stateRef.current;

    const resize = () => {
      canvas.width = canvas.offsetWidth * (window.devicePixelRatio || 1);
      canvas.height = canvas.offsetHeight * (window.devicePixelRatio || 1);
      ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    };
    resize();
    window.addEventListener('resize', resize);

    // Init particles
    const count = 65;
    state.particles = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.offsetWidth,
      y: Math.random() * canvas.offsetHeight,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 2.2 + 1.2,
      opacity: Math.random() * 0.5 + 0.28,
    }));

    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      state.mouse = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    window.addEventListener('mousemove', onMove);

    const draw = () => {
      const W = canvas.offsetWidth, H = canvas.offsetHeight;
      ctx.clearRect(0, 0, W, H);
      const { particles: ps, mouse } = state;

      ps.forEach(p => {
        const dx = p.x - mouse.x, dy = p.y - mouse.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 110 && dist > 0) {
          const f = ((110 - dist) / 110) * 0.25;
          p.vx += (dx / dist) * f;
          p.vy += (dy / dist) * f;
        }
        p.vx *= 0.975; p.vy *= 0.975;
        const spd = Math.hypot(p.vx, p.vy);
        if (spd > 1.4) { p.vx = p.vx / spd * 1.4; p.vy = p.vy / spd * 1.4; }
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
      });

      // Connections
      for (let i = 0; i < ps.length; i++) {
        for (let j = i + 1; j < ps.length; j++) {
          const d = Math.hypot(ps[i].x - ps[j].x, ps[i].y - ps[j].y);
          if (d < 140) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(99,102,241,${(1 - d / 140) * 0.4})`;
            ctx.lineWidth = 1;
            ctx.moveTo(ps[i].x, ps[i].y);
            ctx.lineTo(ps[j].x, ps[j].y);
            ctx.stroke();
          }
        }
      }
      // Dots
      ps.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(99,102,241,${p.opacity})`;
        ctx.fill();
      });

      state.raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(state.raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
    };
  }, []);

  return <canvas ref={canvasRef} className="sf-particles" style={{ opacity: 0.95 }}/>;
};

// ─── Cursor Glow ─────────────────────────────────────────────
const CursorGlow = () => {
  const ref = useRef(null);
  const pos = useRef({ x: -999, y: -999 });
  const rafRef = useRef(null);
  const curPos = useRef({ x: -999, y: -999 });

  useEffect(() => {
    const onMove = (e) => { pos.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener('mousemove', onMove);
    const animate = () => {
      curPos.current.x += (pos.current.x - curPos.current.x) * 0.08;
      curPos.current.y += (pos.current.y - curPos.current.y) * 0.08;
      if (ref.current) {
        ref.current.style.left = curPos.current.x + 'px';
        ref.current.style.top = curPos.current.y + 'px';
      }
      rafRef.current = requestAnimationFrame(animate);
    };
    animate();
    return () => { window.removeEventListener('mousemove', onMove); cancelAnimationFrame(rafRef.current); };
  }, []);

  return <div ref={ref} className="cursor-glow"/>;
};

// ─── Scroll Parallax hook ─────────────────────────────────────
const useScrollParallax = (ref, factor = 0.08) => {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => {
      const rect = el.getBoundingClientRect();
      const center = rect.top + rect.height / 2 - window.innerHeight / 2;
      el.style.transform = `translateY(${center * factor}px)`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
};

// ─── Scroll Reveal setup (runs once at root) ──────────────────
const useScrollReveal = () => {
  useEffect(() => {
    const sel = '.sf-reveal,.sf-reveal-l,.sf-reveal-r,.sf-reveal-scale';
    const els = document.querySelectorAll(sel);
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry, _, arr) => {
        if (entry.isIntersecting) {
          // Stagger siblings in same parent
          const siblings = [...entry.target.parentElement.querySelectorAll(sel)];
          const idx = siblings.indexOf(entry.target);
          entry.target.style.transitionDelay = `${idx * 0.07}s`;
          entry.target.classList.add('sf-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);
};

// ─── Landing features data ────────────────────────────────────
const LANDING_FEATURES = [
  { id: 'ai', size: 'lg', badge: 'AI', icon: <Icons.Sparkles size={22}/>, title: 'Flow schreibt mit.', subtitle: 'Lade ein PDF hoch — bekomme Zusammenfassung, Karteikarten und Quiz in 8 Sekunden.', visual: 'ai' },
  { id: 'cards', size: 'md', badge: 'Karteikarten', icon: <Icons.Cards size={22}/>, title: 'Karten, die sich merken.', subtitle: 'Spaced Repetition nach dem SM-2 Algorithmus.', visual: 'cards' },
  { id: 'collab', size: 'md', badge: 'Live', icon: <Icons.Users size={22}/>, title: 'Mit Freunden lernen.', subtitle: 'Echtzeit-Kollaboration — seht euch gegenseitig tippen.', visual: 'collab' },
  { id: 'quiz', size: 'sm', badge: 'Lern-Modus', icon: <Icons.Brain size={22}/>, title: 'Vier Lern-Modi.', subtitle: 'Flashcards, Quiz, Tippen, Match.', visual: 'quiz' },
  { id: 'track', size: 'sm', badge: 'Stats', icon: <Icons.Chart size={22}/>, title: 'Sieh deinen Fortschritt.', subtitle: 'Heatmap, Streaks, Schwachstellen.', visual: 'stats' },
  { id: 'docs', size: 'sm', badge: 'Dokumente', icon: <Icons.Doc size={22}/>, title: 'Dein Unibib.', subtitle: 'Alle Skripte, markiert und durchsuchbar.', visual: 'docs' },
];

const BentoVisual = ({ kind }) => {
  if (kind === 'ai') return (
    <div style={{ position: 'absolute', right: -10, bottom: -10, width: '80%', height: '75%' }}>
      <div style={{ position: 'absolute', right: 20, bottom: 90, background: 'white', borderRadius: 12, padding: '10px 14px', boxShadow: '0 4px 20px rgba(15,23,42,0.1)', border: '1px solid rgba(15,23,42,0.06)', transform: 'rotate(-1deg)', width: 220 }}>
        <div style={{ fontSize: 10, color: '#6366f1', fontWeight: 600, letterSpacing: '0.08em' }}>HOCHGELADEN</div>
        <div style={{ fontSize: 13, color: '#1e293b', marginTop: 4, fontWeight: 500 }}>Mikroökonomie_VL07.pdf</div>
        <div style={{ height: 4, background: '#eef2ff', borderRadius: 999, marginTop: 8, overflow: 'hidden' }}>
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(90deg, #6366f1, #818cf8)' }}/>
        </div>
      </div>
      <div style={{ position: 'absolute', right: 0, bottom: 0, background: 'linear-gradient(135deg, #6366f1, #818cf8)', borderRadius: 12, padding: '12px 14px', boxShadow: '0 8px 24px rgba(99,102,241,0.3)', transform: 'rotate(2deg)', width: 240, color: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, opacity: 0.9, fontWeight: 500 }}>
          <Icons.Sparkles size={12}/> ERZEUGT VON FLOW
        </div>
        <div style={{ fontSize: 13, marginTop: 6, lineHeight: 1.45 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icons.Check size={14}/> 24 Karteikarten</span><br/>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icons.Check size={14}/> Quiz mit 8 Fragen</span><br/>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icons.Check size={14}/> Zusammenfassung (3 Seiten)</span>
        </div>
      </div>
    </div>
  );
  if (kind === 'cards') return (
    <div style={{ position: 'absolute', right: 10, bottom: 10, width: 200, height: 140 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'white', borderRadius: 10, boxShadow: '0 2px 8px rgba(15,23,42,0.06)', transform: 'rotate(-4deg) translateY(6px)', border: '1px solid rgba(15,23,42,0.06)' }}/>
      <div style={{ position: 'absolute', inset: 0, background: 'white', borderRadius: 10, boxShadow: '0 2px 8px rgba(15,23,42,0.08)', transform: 'rotate(-1.5deg) translateY(3px)', border: '1px solid rgba(15,23,42,0.06)' }}/>
      <div style={{ position: 'absolute', inset: 0, background: 'white', borderRadius: 10, boxShadow: '0 4px 16px rgba(15,23,42,0.12)', transform: 'rotate(1deg)', border: '1px solid rgba(15,23,42,0.06)', padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 9, color: '#6366f1', fontWeight: 600, letterSpacing: '0.1em' }}>FRAGE</div>
        <div style={{ fontFamily: 'Caveat', fontSize: 20, color: '#0f172a', fontWeight: 500, lineHeight: 1.1 }}>Was ist das BIP?</div>
        <div style={{ display: 'flex', gap: 4 }}>
          {[1,2,0].map((v,i) => <div key={i} style={{ width: 18, height: 5, borderRadius: 999, background: v ? '#6366f1' : '#e2e8f0' }}/>)}
        </div>
      </div>
    </div>
  );
  if (kind === 'collab') return (
    <div style={{ position: 'absolute', right: 20, bottom: 20, width: '80%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: -8, justifyContent: 'flex-end' }}>
        {[{n:'Lara K',c:'#6366f1'},{n:'Tim R',c:'#f59e0b'},{n:'Noah W',c:'#10b981'}].map((a,i) => (
          <div key={a.n} style={{ marginRight: i < 2 ? -6 : 0 }}><Avatar name={a.n} size={36} ring color={a.c}/></div>
        ))}
      </div>
      <div style={{ marginTop: 16, background: 'white', borderRadius: 10, padding: '10px 12px', border: '1px solid rgba(15,23,42,0.06)', boxShadow: '0 2px 10px rgba(15,23,42,0.06)', position: 'relative' }}>
        <div style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600 }}>Tim tippt…</div>
        <div style={{ fontSize: 13, color: '#1e293b', marginTop: 2, fontFamily: 'Caveat', fontWeight: 500 }}>"Marginal Utility = abnehmend▊"</div>
        <div style={{ position: 'absolute', top: -14, right: 30 }}>
          <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
            <path d="M5.5 3.5 L 5.5 17 L 9 13.5 L 11.5 18.5 L 13.5 17.5 L 11 12.5 L 16 12.5 Z" fill="#f59e0b" stroke="white" strokeWidth="1.3"/>
          </svg>
        </div>
      </div>
    </div>
  );
  if (kind === 'quiz') return (
    <div style={{ position: 'absolute', right: 14, bottom: 14, display: 'flex', flexDirection: 'column', gap: 6, width: 150 }}>
      {['Flashcards','Quiz','Tippen','Match'].map((m,i) => (
        <div key={m} style={{ padding: '7px 10px', fontSize: 11, fontWeight: 500, background: i===1?'#1e293b':'white', color: i===1?'white':'#475569', border: '1px solid rgba(15,23,42,0.08)', borderRadius: 7, display: 'flex', alignItems: 'center', gap: 6 }}>
          {i===1 && <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981' }}/>}{m}
        </div>
      ))}
    </div>
  );
  if (kind === 'stats') return (
    <div style={{ position: 'absolute', right: 16, bottom: 16, left: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(14, 1fr)', gap: 3 }}>
        {Array.from({length:42}).map((_,i) => {
          const v = [0,0.15,0.3,0.5,0.75,1][Math.floor(Math.random()*6)];
          return <div key={i} style={{ aspectRatio:1, borderRadius:2, background: v===0?'#f1f5f9':`rgba(99,102,241,${v})` }}/>;
        })}
      </div>
      <div style={{ marginTop: 10, display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontFamily:'Caveat', fontSize:28, fontWeight:600, color:'#0f172a' }}>47</span>
        <span style={{ fontSize:11, color:'#64748b' }}>Tage aktiv</span>
      </div>
    </div>
  );
  if (kind === 'docs') return (
    <div style={{ position: 'absolute', right: 14, bottom: 14, display: 'flex', flexDirection: 'column', gap: 5, width: 160 }}>
      {['Mikroökonomie.pdf','Statistik II.pdf','Marketing.md'].map(d => (
        <div key={d} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 9px', background:'white', border:'1px solid rgba(15,23,42,0.06)', borderRadius:7, fontSize:11, color:'#334155' }}>
          <div style={{ width:20, height:24, background:'#eef2ff', borderRadius:3, display:'flex', alignItems:'center', justifyContent:'center', color:'#6366f1', flexShrink:0 }}><Icons.Doc size={12}/></div>
          <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d}</span>
        </div>
      ))}
    </div>
  );
  return null;
};

// ─── Bento Card with 3D tilt ──────────────────────────────────
const BentoCard = ({ feature, delay = 0 }) => {
  const isSm = feature.size === 'sm';
  const sizeMap = {
    lg: { gridColumn: 'span 2', gridRow: 'span 2', minHeight: 320 },
    md: { gridColumn: 'span 2', gridRow: 'span 1', minHeight: 260 },
    sm: { gridColumn: 'span 1', gridRow: 'span 1', minHeight: 340 },
  };

  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    const cx = r.width / 2, cy = r.height / 2;
    const rX = ((y - cy) / cy) * -9;
    const rY = ((x - cx) / cx) * 9;
    // No transition during move — instant response
    e.currentTarget.style.transition = 'box-shadow 0.2s ease';
    e.currentTarget.style.transform = `perspective(800px) rotateX(${rX}deg) rotateY(${rY}deg) translateY(-6px) scale(1.02)`;
    e.currentTarget.style.boxShadow = '0 24px 55px rgba(99,102,241,0.15), 0 6px 20px rgba(15,23,42,0.09)';
  };
  const onLeave = (e) => {
    // Smooth spring back on leave
    e.currentTarget.style.transition = 'transform 0.7s cubic-bezier(0.16,1,0.3,1), box-shadow 0.4s ease';
    e.currentTarget.style.transform = 'perspective(800px) rotateX(0) rotateY(0) translateY(0) scale(1)';
    e.currentTarget.style.boxShadow = '0 1px 2px rgba(15,23,42,0.04), 0 2px 10px rgba(15,23,42,0.04)';
  };

  return (
    <div className="bento-tilt sf-reveal-scale" style={{ ...sizeMap[feature.size], transitionDelay: `${delay}s`, background: 'white', borderRadius: 18, border: '1px solid rgba(15,23,42,0.07)', boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 2px 10px rgba(15,23,42,0.04)', padding: 24, overflow: 'hidden', cursor: 'default', position: 'relative', display: isSm ? 'flex' : 'block', flexDirection: isSm ? 'column' : undefined }}
      onMouseMove={onMove} onMouseLeave={onLeave}>
      <div style={{ position: 'relative', zIndex: 2, maxWidth: feature.size === 'lg' ? '50%' : '100%', flexShrink: 0 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 999, background: '#eef2ff', color: '#4f46e5', fontSize: 11, fontWeight: 600, letterSpacing: '0.02em', border: '1px solid #e0e7ff' }}>
          {feature.icon} {feature.badge}
        </div>
        <div style={{ fontFamily: 'Caveat', fontWeight: 600, fontSize: feature.size==='lg'?42:isSm?28:32, color: '#0f172a', lineHeight: 1.1, marginTop: 10, letterSpacing: '-0.01em' }}>
          {feature.title}
        </div>
        <div style={{ fontSize: feature.size==='lg'?15:13, color: '#64748b', marginTop: 6, lineHeight: 1.5, maxWidth: feature.size==='lg'?340:'100%' }}>
          {feature.subtitle}
        </div>
      </div>
      {isSm ? (
        <div style={{ flex: 1, position: 'relative', marginTop: 16, minHeight: 140 }}><BentoVisual kind={feature.visual}/></div>
      ) : (
        <BentoVisual kind={feature.visual}/>
      )}
    </div>
  );
};

// ─── Nav ──────────────────────────────────────────────────────
const Nav = () => {
  const [stuck, setStuck] = useState(false);
  useEffect(() => {
    const fn = () => setStuck(window.scrollY > 50);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <div style={{
      position: 'fixed', zIndex: 50,
      top: stuck ? 0 : 16,
      left: stuck ? 0 : '50%',
      right: stuck ? 0 : 'auto',
      transform: stuck ? 'none' : 'translateX(-50%)',
      width: stuck ? '100%' : 'min(1200px, calc(100% - 48px))',
      transition: 'top 0.4s cubic-bezier(0.16,1,0.3,1), left 0.4s cubic-bezier(0.16,1,0.3,1), right 0.4s, transform 0.4s, width 0.4s',
      animation: 'fadeDown 0.7s 0.1s cubic-bezier(0.16,1,0.3,1) both',
    }}>
      <nav style={{
        padding: stuck ? '11px 32px' : '12px 20px',
        background: stuck ? 'rgba(255,255,255,0.97)' : 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        border: stuck ? 'none' : '1px solid rgba(15,23,42,0.08)',
        borderBottom: stuck ? '1px solid rgba(15,23,42,0.09)' : 'none',
        borderRadius: stuck ? 0 : 16,
        boxShadow: stuck
          ? '0 1px 0 rgba(15,23,42,0.06), 0 6px 24px rgba(15,23,42,0.07)'
          : '0 1px 2px rgba(15,23,42,0.04), 0 4px 16px rgba(15,23,42,0.04)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        transition: 'all 0.4s cubic-bezier(0.16,1,0.3,1)',
      }}>
        <a href="Landing.html" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <Icons.Logo size={30}/>
          <div style={{ fontFamily: 'Caveat', fontSize: 26, fontWeight: 600, color: '#0f172a', lineHeight: 1 }}>StudyFlow</div>
        </a>
        <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: 28, fontSize: 14, color: '#475569' }}>
          <a href="#features" style={{ textDecoration: 'none', color: 'inherit' }}>Features</a>
          <a href="changelog.html" style={{ textDecoration: 'none', color: 'inherit' }}>Changelog</a>
          <a href="#preis" style={{ textDecoration: 'none', color: 'inherit' }}>Preise</a>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <a href="login.html" className="btn-ghost" style={{ padding: '8px 14px' }}>Anmelden</a>
          <a href="dashboard.html" className="btn-primary" style={{ padding: '8px 14px' }}>
            Kostenlos starten <Icons.ArrowRight size={14}/>
          </a>
        </div>
      </nav>
    </div>
  );
};

// ─── Hero ─────────────────────────────────────────────────────
const Hero = () => {
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const rafRef = useRef(null);
  const stickyRef = useRef(null);
  const star1Ref = useRef(null);
  const star2Ref = useRef(null);
  const [wordsIn, setWordsIn] = useState(false);

  useEffect(() => {
    // Trigger hero word animations slightly after mount
    const t = setTimeout(() => setWordsIn(true), 120);

    // Mouse parallax
    const onMove = (e) => {
      mouseRef.current = { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight };
    };
    window.addEventListener('mousemove', onMove);

    const cur = { x: 0.5, y: 0.5 };
    const anim = () => {
      cur.x += (mouseRef.current.x - cur.x) * 0.06;
      cur.y += (mouseRef.current.y - cur.y) * 0.06;
      const cx = (cur.x - 0.5) * 2, cy = (cur.y - 0.5) * 2;
      if (stickyRef.current)
        stickyRef.current.style.transform = `rotate(-6deg) translate(${cx * 14}px,${cy * 10}px)`;
      if (star1Ref.current)
        star1Ref.current.style.transform = `rotate(12deg) translate(${cx * 28}px,${cy * 18}px)`;
      if (star2Ref.current)
        star2Ref.current.style.transform = `rotate(-6deg) translate(${cx * 20}px,${cy * 13}px)`;
      rafRef.current = requestAnimationFrame(anim);
    };
    anim();

    return () => {
      clearTimeout(t);
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const W = (word, delay, extra = {}) => (
    <span className={`hw${wordsIn ? ' in' : ''}`} style={{ animationDelay: `${delay}s`, ...extra }}>{word}</span>
  );

  return (
    <section style={{ maxWidth: 1200, margin: '0 auto', padding: '96px 24px 0', position: 'relative', minHeight: '94vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      {/* Particle canvas — full hero bg */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 24, pointerEvents: 'none' }}>
        <HeroParticles/>
        {/* Soft radial bg glow */}
        <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)', width: 900, height: 600, background: 'radial-gradient(ellipse, rgba(99,102,241,0.14) 0%, rgba(99,102,241,0.04) 50%, transparent 70%)', animation: 'glowPulse 4s ease-in-out infinite', pointerEvents: 'none' }}/>
        <div style={{ position: 'absolute', top: '70%', left: '25%', transform: 'translate(-50%,-50%)', width: 400, height: 300, background: 'radial-gradient(ellipse, rgba(139,92,246,0.08) 0%, transparent 70%)', animation: 'glowPulse 5s ease-in-out infinite 1.5s', pointerEvents: 'none' }}/>
        <div style={{ position: 'absolute', top: '20%', left: '80%', transform: 'translate(-50%,-50%)', width: 350, height: 280, background: 'radial-gradient(ellipse, rgba(99,102,241,0.07) 0%, transparent 70%)', animation: 'glowPulse 6s ease-in-out infinite 0.7s', pointerEvents: 'none' }}/>
      </div>

      {/* Floating sticky note — parallax layer 1 */}
      <div ref={stickyRef} className="hide-mobile" style={{ position: 'absolute', top: 40, left: 40, zIndex: 2, willChange: 'transform', transformOrigin: 'center' }}>
        <StickyNote color="yellow" rotate={-6} tape>
          <div style={{ fontFamily: 'Caveat', fontSize: 18, color: '#0f172a', lineHeight: 1.2, maxWidth: 140 }}>
            Klausur in <span style={{ textDecoration: 'line-through', color: '#64748b' }}>3 Wochen</span>{' '}
            <span style={{ color: '#dc2626' }}>10 Tagen</span>!
          </div>
        </StickyNote>
      </div>

      {/* Doodle star — parallax layer 2 */}
      <div ref={star1Ref} className="hide-mobile" style={{ position: 'absolute', top: 30, right: 100, zIndex: 2, willChange: 'transform', transformOrigin: 'center' }}>
        <Doodles.Star color="#6366f1" size={30}/>
      </div>
      <div ref={star2Ref} className="hide-mobile" style={{ position: 'absolute', top: 90, right: 60, zIndex: 2, willChange: 'transform', transformOrigin: 'center' }}>
        <Doodles.Sparkle color="#f59e0b" size={20}/>
      </div>

      {/* Hero content */}
      <div style={{ textAlign: 'center', position: 'relative', zIndex: 3 }}>
        {/* Badge */}
        <div className="pill" style={{ marginBottom: 24, display: 'inline-flex', animation: 'fadeDown 0.6s 0.25s cubic-bezier(0.16,1,0.3,1) both', opacity: 0 }}>
          <Icons.Sparkles size={12}/>
          Jetzt mit Flow AI — dein Lernbuddy
        </div>

        {/* Headline — word by word */}
        <h1 className="hero-title" style={{ fontFamily: 'Instrument Sans', fontSize: 72, fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1.02, color: '#0f172a', margin: 0, maxWidth: 900, marginInline: 'auto' }}>
          {W('Lern', 0.35)}{' '}{W('smarter.', 0.48)}<br/>
          <span style={{ position: 'relative', display: 'inline-block' }}>
            <span className="hero-subtitle" style={{ fontFamily: 'Caveat', fontWeight: 600, fontSize: 80 }}>
              {W('Nicht', 0.62, { color: '#6366f1' })}{' '}{W('härter.', 0.76, { color: '#6366f1' })}
            </span>
            <span style={{ position: 'absolute', left: -4, right: -4, bottom: 8, animation: 'fadeIn 0.4s 1.1s both', opacity: 0 }}>
              <Doodles.Underline color="#818cf8" w={380}/>
            </span>
          </span>
        </h1>

        {/* Subtext */}
        <p style={{ fontSize: 19, color: '#64748b', lineHeight: 1.55, maxWidth: 620, margin: '28px auto 0', animation: 'fadeUp 0.8s 0.95s cubic-bezier(0.16,1,0.3,1) both', opacity: 0 }}>
          Karteikarten, Dokumente und ein AI-Lernbuddy an einem Ort.<br/>
          Zusammen mit deinen Lerngruppen — in Echtzeit.
        </p>

        {/* CTAs */}
        <div className="mobile-wrap" style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 36, animation: 'fadeUp 0.8s 1.1s cubic-bezier(0.16,1,0.3,1) both', opacity: 0 }}>
          <a href="dashboard.html" className="btn-primary" style={{ padding: '14px 24px', fontSize: 15, boxShadow: '0 8px 24px rgba(99,102,241,0.25)' }}>
            Kostenlos starten <Icons.ArrowRight size={16}/>
          </a>
          <a href="#demo" className="btn-ghost" style={{ padding: '14px 22px', fontSize: 15 }}>
            <Icons.Play size={14}/> Demo ansehen (2 Min)
          </a>
        </div>

        {/* Social proof */}
        <div style={{ marginTop: 24, fontSize: 13, color: '#94a3b8', animation: 'fadeUp 0.6s 1.3s cubic-bezier(0.16,1,0.3,1) both', opacity: 0 }}>
          Kostenlos · Keine Kreditkarte ·{' '}
          <span style={{ color: '#6366f1', fontWeight: 500 }}>42.000+ Studierende</span>
        </div>
      </div>

    </section>
  );
};

// ─── Bento Grid ───────────────────────────────────────────────
const BentoGrid = () => {
  const headingRef = useRef(null);
  useScrollParallax(headingRef, -0.06);

  return (
    <section id="features" style={{ maxWidth: 1200, margin: '120px auto 40px', padding: '0 24px', position: 'relative' }}>
      {/* Background glow that moves on scroll */}
      <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)', width: 800, height: 500, background: 'radial-gradient(ellipse, rgba(99,102,241,0.05) 0%, transparent 70%)', pointerEvents: 'none', animation: 'glowPulse 6s ease-in-out infinite' }}/>
      <div ref={headingRef} style={{ textAlign: 'center', marginBottom: 52 }}>
        <div className="sf-reveal section-label">Dein Werkzeugkasten</div>
        <div className="sf-reveal" style={{ fontFamily: 'Instrument Sans', fontSize: 46, fontWeight: 600, color: '#0f172a', letterSpacing: '-0.02em', marginTop: 6 }}>
          Alles was du zum Lernen brauchst.
        </div>
        <div className="sf-reveal" style={{ fontSize: 17, color: '#64748b', marginTop: 12, maxWidth: 500, marginInline: 'auto', lineHeight: 1.55 }}>
          Alles in einer App — kein Tab-Chaos mehr.
        </div>
      </div>
      <div className="bento-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridAutoRows: 'minmax(230px, auto)', gap: 18, position: 'relative' }}>
        {LANDING_FEATURES.map((f, i) => <BentoCard key={f.id} feature={f} delay={i * 0.08}/>)}
      </div>
    </section>
  );
};

// ─── AI Spotlight ─────────────────────────────────────────────
const AISpotlight = () => (
  <section id="ai" style={{ maxWidth: 1200, margin: '120px auto', padding: '0 24px' }}>
    <div style={{ position: 'relative', background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)', borderRadius: 28, padding: '72px 60px', color: 'white', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, opacity: 0.15, backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '22px 22px' }}/>
      {/* Glow orbs */}
      <div style={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(99,102,241,0.3)', filter: 'blur(80px)', animation: 'glowPulse 5s ease-in-out infinite' }}/>
      <div style={{ position: 'absolute', bottom: -60, left: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(139,92,246,0.25)', filter: 'blur(60px)', animation: 'glowPulse 4s ease-in-out infinite 1s' }}/>

      <div className="ai-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center', position: 'relative' }}>
        <div className="ai-grid-text sf-reveal-l">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', fontSize: 12, fontWeight: 500 }}>
            <Icons.Sparkles size={14}/> Flow AI
          </div>
          <h2 style={{ fontFamily: 'Instrument Sans', fontSize: 48, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.05, margin: '20px 0 0' }}>
            Zusammenfassung?<br/>
            <span style={{ fontFamily: 'Caveat', fontSize: 58, color: '#a5b4fc' }}>In 8 Sekunden.</span>
          </h2>
          <p style={{ fontSize: 17, color: '#c7d2fe', marginTop: 20, lineHeight: 1.55, maxWidth: 460 }}>
            Lade dein Skript hoch. Flow liest es, fasst es zusammen, erstellt Karteikarten und Quizfragen — alles automatisch.
          </p>
          <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {['Erkennt Themen und Kernkonzepte','Generiert Karteikarten im Stil deines Faches','Merkt sich deine Schwachstellen'].map(t => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(165,180,252,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icons.Check size={12}/>
                </div>
                {t}
              </div>
            ))}
          </div>
        </div>

        <div className="sf-reveal-r ai-grid-preview" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 18, padding: 20, backdropFilter: 'blur(20px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 14, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #818cf8, #c7d2fe)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icons.Sparkles size={16}/>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Flow</div>
              <div style={{ fontSize: 11, color: '#a5b4fc', display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }}/> bereit
              </div>
            </div>
          </div>
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ alignSelf: 'flex-end', background: 'white', color: '#0f172a', padding: '9px 14px', borderRadius: '14px 14px 4px 14px', fontSize: 13, maxWidth: '85%' }}>
              Kannst du aus VL07.pdf 20 Karteikarten machen?
            </div>
            <div style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.1)', color: 'white', padding: '9px 14px', borderRadius: '14px 14px 14px 4px', fontSize: 13, maxWidth: '85%' }}>
              Klar! Hauptthemen erkannt: Angebot &amp; Nachfrage, Elastizität, Marktversagen.
              <div style={{ marginTop: 8, background: 'rgba(129,140,248,0.2)', padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(129,140,248,0.3)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 14, height: 14, borderRadius: 3, background: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icons.Check size={10}/></div>
                20 Karten erstellt · 6 Quizfragen · Zusammenfassung
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

// ─── Policy Modal ─────────────────────────────────────────────
const PolicyModal = ({ onClose, onConfirm, loading }) => (
  <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
    <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 24, padding: '36px 40px', maxWidth: 540, width: '100%', boxShadow: '0 30px 80px rgba(15,23,42,0.22)', position: 'relative', animation: 'scaleIn 0.3s cubic-bezier(0.16,1,0.3,1)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg,#312e81,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}><Icons.Bolt size={20}/></div>
        <div>
          <div style={{ fontFamily: 'Instrument Sans', fontSize: 20, fontWeight: 700, color: '#0f172a' }}>StudyFlow Pro</div>
          <div style={{ fontSize: 13, color: '#64748b' }}>Monatsabo · Jederzeit kündbar</div>
        </div>
      </div>
      <div style={{ background: '#f8fafc', borderRadius: 14, padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontFamily: 'Instrument Sans', fontSize: 36, fontWeight: 700, color: '#0f172a' }}>5,99 €</span>
        <span style={{ fontSize: 15, color: '#64748b' }}>/ Monat · inkl. MwSt.</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28 }}>
        {[{icon:'🔄',title:'Automatische Verlängerung',text:'Das Abo verlängert sich monatlich um 5,99 € bis zur Kündigung. Du kannst jederzeit in den Einstellungen kündigen — dein Zugriff bleibt bis Periodenende aktiv.'},{icon:'↩️',title:'14 Tage Widerrufsrecht',text:'Nach EU-Recht hast du 14 Tage nach Kaufdatum ein gesetzliches Widerrufsrecht. Schreib uns an support@studyflow.app für eine vollständige Rückerstattung — keine Fragen.'},{icon:'🔒',title:'Sichere Zahlung via Stripe',text:'Zahlungsdaten werden ausschliesslich von Stripe verarbeitet. Wir speichern keine Kartendaten.'}].map(p => (
          <div key={p.title} style={{ display: 'flex', gap: 12 }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>{p.icon}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', marginBottom: 3 }}>{p.title}</div>
              <div style={{ fontSize: 12.5, color: '#64748b', lineHeight: 1.5 }}>{p.text}</div>
            </div>
          </div>
        ))}
      </div>
      <button onClick={onConfirm} disabled={loading} style={{ width: '100%', padding: '14px 0', background: loading?'#e2e8f0':'linear-gradient(135deg,#312e81,#6366f1)', color: loading?'#94a3b8':'white', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 600, cursor: loading?'default':'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10 }}>
        {loading ? <span style={{ display:'flex', gap:5 }}>{[0,1,2].map(i=><span key={i} style={{ width:6,height:6,borderRadius:'50%',background:'#94a3b8',display:'inline-block' }}/>)}</span> : <><Icons.Bolt size={15}/> Jetzt kaufen · 5,99 €/Monat</>}
      </button>
      <button onClick={onClose} style={{ width: '100%', padding: '11px 0', background: 'none', border: '1px solid #e2e8f0', borderRadius: 14, fontSize: 14, color: '#64748b', cursor: 'pointer', fontFamily: 'inherit' }}>Abbrechen</button>
      <div style={{ marginTop: 14, textAlign: 'center', fontSize: 11.5, color: '#94a3b8', lineHeight: 1.5 }}>
        Mit dem Kauf stimmst du unseren <a href="#" style={{ color: '#6366f1' }}>AGB</a> und der <a href="#" style={{ color: '#6366f1' }}>Datenschutzerklärung</a> zu.
      </div>
    </div>
  </div>
);

const SUPABASE_URL = 'https://rbvzfqpgwmzefrdnexhq.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJidnpmcXBnd216ZWZyZG5leGhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI4MjEwNzIsImV4cCI6MjA1ODM5NzA3Mn0.i7-J42s9uLPHXifEpuI0I0XPP7FgD8e4d0_hF1Vvyeg';

// ─── Pricing ──────────────────────────────────────────────────
const Pricing = () => {
  const [showPolicy, setShowPolicy] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  const handleProClick = () => { setShowPolicy(true); setCheckoutError(''); };
  const handleConfirmPurchase = async () => {
    setCheckoutLoading(true); setCheckoutError('');
    try {
      const sb = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON) : null;
      let token = null;
      if (sb) { const { data: { session } } = await sb.auth.getSession(); token = session?.access_token; }
      if (!token) { window.location.href = 'login.html?redirect=pro'; return; }
      const res = await fetch(`${SUPABASE_URL}/functions/v1/stripe-checkout`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } });
      if (!res.ok) throw new Error(await res.text() || 'Fehler');
      const { url } = await res.json();
      if (url) window.location.href = url; else throw new Error('Keine Checkout-URL');
    } catch (e) { setCheckoutError(e.message || 'Fehler'); setCheckoutLoading(false); }
  };

  return (
    <section id="preis" style={{ maxWidth: 1200, margin: '100px auto', padding: '0 24px' }}>
      {showPolicy && <PolicyModal onClose={() => { setShowPolicy(false); setCheckoutLoading(false); }} onConfirm={handleConfirmPurchase} loading={checkoutLoading}/>}
      <div style={{ textAlign: 'center', marginBottom: 60 }}>
        <div className="sf-reveal section-label">Preise</div>
        <h2 className="sf-reveal" style={{ fontFamily: 'Instrument Sans', fontSize: 44, fontWeight: 600, color: '#0f172a', letterSpacing: '-0.02em', marginTop: 4 }}>Ein Plan für alle.</h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 32, maxWidth: 860, margin: '0 auto' }}>
        {/* Free */}
        <div className="sf-reveal-l" style={{ background: 'white', borderRadius: 24, padding: 40, border: '1px solid rgba(15,23,42,0.08)', boxShadow: '0 4px 20px rgba(15,23,42,0.03)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#f1f5f9', borderRadius: 999, fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 20, alignSelf: 'flex-start' }}><Icons.Bookmark size={14}/> Free</div>
          <div style={{ fontFamily: 'Instrument Sans', fontSize: 42, fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>0 € <span style={{ fontSize: 16, color: '#64748b', fontWeight: 500 }}>/Monat</span></div>
          <div style={{ fontSize: 14, color: '#64748b', marginBottom: 32 }}>Für den einfachen Start ins Semester.</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 40, flex: 1 }}>
            {['Bis zu 10 Lernsets','3 AI-Analysen pro Monat','Basis-Lernstatistiken','Spaced Repetition (SM-2)'].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#334155' }}><span style={{ color: '#94a3b8', display: 'flex' }}><Icons.Check size={16}/></span>{f}</div>
            ))}
          </div>
          <a href="login.html" className="btn-ghost" style={{ width: '100%', justifyContent: 'center', padding: '12px 0', fontSize: 15 }}>Kostenlos starten</a>
        </div>
        {/* Pro */}
        <div className="sf-reveal-r" style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', borderRadius: 24, padding: 40, color: 'white', boxShadow: '0 20px 40px rgba(49,46,129,0.2)', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, background: '#6366f1', color: 'white', fontSize: 11, fontWeight: 700, padding: '6px 36px', transform: 'translate(30%, 20px) rotate(45deg)', letterSpacing: '0.05em' }}>BELIEBT</div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 999, fontSize: 13, fontWeight: 600, color: '#c7d2fe', marginBottom: 20, alignSelf: 'flex-start' }}><Icons.Bolt size={14}/> Pro</div>
          <div style={{ fontFamily: 'Instrument Sans', fontSize: 42, fontWeight: 600, color: 'white', marginBottom: 8 }}>5,99 € <span style={{ fontSize: 16, color: '#a5b4fc', fontWeight: 500 }}>/Monat</span></div>
          <div style={{ fontSize: 14, color: '#c7d2fe', marginBottom: 32 }}>Für Power-User &amp; Lerngruppen. Jederzeit kündbar.</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 40, flex: 1 }}>
            {['Unbegrenzte Lernsets','Unbegrenzte AI & Vision AI','Live-Kollaboration mit Freunden','Detaillierte Lern-Analytics','Prioritäts-Support'].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#e0e7ff' }}><span style={{ color: '#818cf8', display: 'flex' }}><Icons.Check size={16}/></span>{f}</div>
            ))}
          </div>
          {checkoutError && <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 14px', marginBottom: 12, fontSize: 13, color: '#fca5a5' }}>{checkoutError}</div>}
          <button onClick={handleProClick} style={{ width: '100%', justifyContent: 'center', padding: '13px 0', fontSize: 15, background: 'white', color: '#1e1b4b', border: 'none', borderRadius: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8 }} onMouseEnter={e=>e.currentTarget.style.opacity='0.92'} onMouseLeave={e=>e.currentTarget.style.opacity='1'}>
            <Icons.Bolt size={15}/> Pro aktivieren
          </button>
          <div style={{ marginTop: 12, textAlign: 'center', fontSize: 11.5, color: 'rgba(165,180,252,0.7)' }}>Sicher via Stripe · 14 Tage Widerrufsrecht</div>
        </div>
      </div>
      <div className="sf-reveal" style={{ textAlign: 'center', marginTop: 32, fontSize: 14, color: '#64748b' }}>
        Hast du eine Uni-Mailadresse? <a href="login.html" style={{ color: '#6366f1', fontWeight: 500, textDecoration: 'underline' }}>Hol dir Pro kostenlos.</a>
      </div>
    </section>
  );
};

// ─── Footer ───────────────────────────────────────────────────
const Footer = () => (
  <footer style={{ maxWidth: 1200, margin: '80px auto 40px', padding: '0 24px', borderTop: '1px solid rgba(15,23,42,0.08)', paddingTop: 40 }}>
    <div className="footer-layout sf-reveal" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 40 }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icons.Logo size={26}/>
          <div style={{ fontFamily: 'Caveat', fontSize: 24, fontWeight: 600, color: '#0f172a' }}>StudyFlow</div>
        </div>
        <div style={{ fontSize: 13, color: '#64748b', marginTop: 8, maxWidth: 300 }}>Made with ☕ &amp; late nights. Aus der Schweiz.</div>
      </div>
      <div className="footer-links" style={{ display: 'flex', gap: 60, fontSize: 13 }}>
        {[['Produkt',['Features','AI','Changelog','Preise','Roadmap']],['Rechtliches',['Datenschutz','AGB','Impressum']]].map(([h,items]) => (
          <div key={h}>
            <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: 10 }}>{h}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, color: '#64748b' }}>
              {items.map(i => <a key={i} href={i==='Changelog'?'changelog.html':'#'} style={{ color: 'inherit', textDecoration: 'none' }}>{i}</a>)}
            </div>
          </div>
        ))}
      </div>
    </div>
    <div style={{ marginTop: 32, fontSize: 12, color: '#94a3b8' }}>© 2026 StudyFlow GmbH</div>
  </footer>
);

// ─── Root ─────────────────────────────────────────────────────
const Landing = () => {
  useScrollReveal();
  return (
    <div className="dot-paper" style={{ minHeight: '100vh', overflowX: 'hidden' }}>
      <style>{ANIM_CSS}</style>
      <CursorGlow/>
      <Nav/>
      <Hero/>
      <BentoGrid/>
      <AISpotlight/>
      <Pricing/>
      <Footer/>
      <AIAssistant/>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<Landing/>);
