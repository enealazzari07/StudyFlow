// StudyFlow — Landing Page
const { useState, useEffect, useRef } = React;

const LANDING_FEATURES = [
  {
    id: 'ai', size: 'lg',
    badge: 'AI', icon: <Icons.Sparkles size={22}/>,
    title: 'Flow schreibt mit.',
    subtitle: 'Lade ein PDF hoch — bekomme Zusammenfassung, Karteikarten und Quiz in 8 Sekunden.',
    visual: 'ai',
  },
  {
    id: 'cards', size: 'md',
    badge: 'Karteikarten', icon: <Icons.Cards size={22}/>,
    title: 'Karten, die sich merken.',
    subtitle: 'Spaced Repetition nach dem SM-2 Algorithmus.',
    visual: 'cards',
  },
  {
    id: 'collab', size: 'md',
    badge: 'Live', icon: <Icons.Users size={22}/>,
    title: 'Mit Freunden lernen.',
    subtitle: 'Echtzeit-Kollaboration — seht euch gegenseitig tippen.',
    visual: 'collab',
  },
  {
    id: 'quiz', size: 'sm',
    badge: 'Lern-Modus', icon: <Icons.Brain size={22}/>,
    title: 'Vier Lern-Modi.',
    subtitle: 'Flashcards, Quiz, Tippen, Match.',
    visual: 'quiz',
  },
  {
    id: 'track', size: 'sm',
    badge: 'Stats', icon: <Icons.Chart size={22}/>,
    title: 'Sieh deinen Fortschritt.',
    subtitle: 'Heatmap, Streaks, Schwachstellen.',
    visual: 'stats',
  },
  {
    id: 'docs', size: 'sm',
    badge: 'Dokumente', icon: <Icons.Doc size={22}/>,
    title: 'Dein Unibib.',
    subtitle: 'Alle Skripte, markiert und durchsuchbar.',
    visual: 'docs',
  },
];

const BentoVisual = ({ kind }) => {
  if (kind === 'ai') return (
    <div style={{ position: 'absolute', right: -10, bottom: -10, width: '80%', height: '75%' }}>
      <div style={{ position: 'absolute', right: 20, bottom: 90, background: 'white', borderRadius: 12, padding: '10px 14px', boxShadow: '0 4px 20px rgba(15,23,42,0.1)', border: '1px solid rgba(15,23,42,0.06)', transform: 'rotate(-1deg)', width: 220 }}>
        <div style={{ fontSize: 10, color: '#6366f1', fontWeight: 600, letterSpacing: '0.08em' }}>HOCHGELADEN</div>
        <div style={{ fontSize: 13, color: '#1e293b', marginTop: 4, fontWeight: 500 }}>Mikroökonomie_VL07.pdf</div>
        <div style={{ height: 4, background: '#eef2ff', borderRadius: 999, marginTop: 8, overflow: 'hidden' }}>
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(90deg, #6366f1, #818cf8)' }}></div>
        </div>
      </div>
      <div style={{ position: 'absolute', right: 0, bottom: 0, background: 'linear-gradient(135deg, #6366f1, #818cf8)', borderRadius: 12, padding: '12px 14px', boxShadow: '0 8px 24px rgba(99,102,241,0.3)', transform: 'rotate(2deg)', width: 240, color: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, opacity: 0.9, fontWeight: 500 }}>
          <Icons.Sparkles size={12}/> ERZEUGT VON FLOW
        </div>
        <div style={{ fontSize: 13, marginTop: 6, lineHeight: 1.45 }}>
          ✓ 24 Karteikarten<br/>
          ✓ Quiz mit 8 Fragen<br/>
          ✓ Zusammenfassung (3 Seiten)
        </div>
      </div>
    </div>
  );
  if (kind === 'cards') return (
    <div style={{ position: 'absolute', right: 10, bottom: 10, width: 200, height: 140 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'white', borderRadius: 10, boxShadow: '0 2px 8px rgba(15,23,42,0.06)', transform: 'rotate(-4deg) translateY(6px)', border: '1px solid rgba(15,23,42,0.06)' }}></div>
      <div style={{ position: 'absolute', inset: 0, background: 'white', borderRadius: 10, boxShadow: '0 2px 8px rgba(15,23,42,0.08)', transform: 'rotate(-1.5deg) translateY(3px)', border: '1px solid rgba(15,23,42,0.06)' }}></div>
      <div style={{ position: 'absolute', inset: 0, background: 'white', borderRadius: 10, boxShadow: '0 4px 16px rgba(15,23,42,0.12)', transform: 'rotate(1deg)', border: '1px solid rgba(15,23,42,0.06)', padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 9, color: '#6366f1', fontWeight: 600, letterSpacing: '0.1em' }}>FRAGE</div>
        <div style={{ fontFamily: 'Caveat', fontSize: 20, color: '#0f172a', fontWeight: 500, lineHeight: 1.1 }}>Was ist das BIP?</div>
        <div style={{ display: 'flex', gap: 4 }}>
          <div style={{ width: 18, height: 5, borderRadius: 999, background: '#6366f1' }}></div>
          <div style={{ width: 18, height: 5, borderRadius: 999, background: '#6366f1' }}></div>
          <div style={{ width: 18, height: 5, borderRadius: 999, background: '#e2e8f0' }}></div>
        </div>
      </div>
    </div>
  );
  if (kind === 'collab') return (
    <div style={{ position: 'absolute', right: 20, bottom: 20, width: '80%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: -8, justifyContent: 'flex-end' }}>
        <div style={{ marginRight: -6 }}><Avatar name="Lara K" size={36} ring color="#6366f1"/></div>
        <div style={{ marginRight: -6 }}><Avatar name="Tim R" size={36} ring color="#f59e0b"/></div>
        <div><Avatar name="Noah W" size={36} ring color="#10b981"/></div>
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
      {['Flashcards', 'Quiz', 'Tippen', 'Match'].map((m, i) => (
        <div key={m} style={{
          padding: '7px 10px', fontSize: 11, fontWeight: 500,
          background: i === 1 ? '#1e293b' : 'white',
          color: i === 1 ? 'white' : '#475569',
          border: '1px solid rgba(15,23,42,0.08)',
          borderRadius: 7,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          {i === 1 && <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981' }}></span>}
          {m}
        </div>
      ))}
    </div>
  );
  if (kind === 'stats') return (
    <div style={{ position: 'absolute', right: 16, bottom: 16, left: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(14, 1fr)', gap: 3 }}>
        {Array.from({length: 42}).map((_, i) => {
          const intensity = [0, 0.15, 0.3, 0.5, 0.75, 1][Math.floor(Math.random() * 6)];
          return <div key={i} style={{
            aspectRatio: 1,
            borderRadius: 2,
            background: intensity === 0 ? '#f1f5f9' : `rgba(99,102,241,${intensity})`,
          }}></div>;
        })}
      </div>
      <div style={{ marginTop: 10, display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontFamily: 'Caveat', fontSize: 28, fontWeight: 600, color: '#0f172a' }}>47</span>
        <span style={{ fontSize: 11, color: '#64748b' }}>Tage Streak</span>
      </div>
    </div>
  );
  if (kind === 'docs') return (
    <div style={{ position: 'absolute', right: 14, bottom: 14, display: 'flex', flexDirection: 'column', gap: 5, width: 160 }}>
      {['Mikroökonomie.pdf', 'Statistik II.pdf', 'Marketing.md'].map((d, i) => (
        <div key={d} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '7px 9px',
          background: 'white',
          border: '1px solid rgba(15,23,42,0.06)',
          borderRadius: 7,
          fontSize: 11,
          color: '#334155',
        }}>
          <div style={{ width: 20, height: 24, background: '#eef2ff', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1', flexShrink: 0 }}>
            <Icons.Doc size={12}/>
          </div>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d}</span>
        </div>
      ))}
    </div>
  );
  return null;
};

const BentoCard = ({ feature }) => {
  const sizeMap = {
    lg: { gridColumn: 'span 2', gridRow: 'span 2', minHeight: 320 },
    md: { gridColumn: 'span 2', gridRow: 'span 1', minHeight: 260 },
    sm: { gridColumn: 'span 1', gridRow: 'span 1', minHeight: 230 },
  };
  return (
    <div style={{
      ...sizeMap[feature.size],
      position: 'relative',
      background: 'white',
      borderRadius: 18,
      border: '1px solid rgba(15,23,42,0.07)',
      boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 2px 10px rgba(15,23,42,0.04)',
      padding: 24,
      overflow: 'hidden',
      transition: 'transform 0.25s ease, box-shadow 0.25s ease',
      cursor: 'default',
    }}
    onMouseEnter={e => {
      e.currentTarget.style.transform = 'translateY(-3px)';
      e.currentTarget.style.boxShadow = '0 4px 12px rgba(15,23,42,0.08), 0 16px 40px rgba(15,23,42,0.08)';
    }}
    onMouseLeave={e => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 1px 2px rgba(15,23,42,0.04), 0 2px 10px rgba(15,23,42,0.04)';
    }}
    >
      <div style={{ position: 'relative', zIndex: 2, maxWidth: feature.size === 'lg' ? '50%' : '90%' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 10px', borderRadius: 999,
          background: '#eef2ff', color: '#4f46e5',
          fontSize: 11, fontWeight: 600, letterSpacing: '0.02em',
          border: '1px solid #e0e7ff',
        }}>
          {feature.icon}
          {feature.badge}
        </div>
        <div style={{
          fontFamily: 'Caveat', fontWeight: 600,
          fontSize: feature.size === 'lg' ? 42 : 32,
          color: '#0f172a',
          lineHeight: 1.05,
          marginTop: 12,
          letterSpacing: '-0.01em',
        }}>
          {feature.title}
        </div>
        <div style={{
          fontSize: feature.size === 'lg' ? 15 : 13.5,
          color: '#64748b',
          marginTop: 8,
          lineHeight: 1.5,
          maxWidth: 340,
        }}>
          {feature.subtitle}
        </div>
      </div>
      <BentoVisual kind={feature.visual}/>
    </div>
  );
};

const Nav = () => (
  <nav style={{
    position: 'sticky', top: 16, zIndex: 50,
    margin: '16px auto 0',
    maxWidth: 1200,
    padding: '12px 20px',
    background: 'rgba(255,255,255,0.85)',
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
    border: '1px solid rgba(15,23,42,0.08)',
    borderRadius: 16,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 4px 16px rgba(15,23,42,0.04)',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <Icons.Logo size={30}/>
      <div style={{ fontFamily: 'Caveat', fontSize: 26, fontWeight: 600, color: '#0f172a', lineHeight: 1 }}>StudyFlow</div>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 28, fontSize: 14, color: '#475569' }}>
      <a href="#features">Features</a>
      <a href="#ai">AI</a>
      <a href="#preis">Preise</a>
      <a href="#uni">Für Unis</a>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <a href="login.html" className="btn-ghost" style={{ padding: '8px 14px' }}>Anmelden</a>
      <a href="dashboard.html" className="btn-primary" style={{ padding: '8px 14px' }}>
        Kostenlos starten
        <Icons.ArrowRight size={14}/>
      </a>
    </div>
  </nav>
);

const Hero = () => (
  <section style={{ maxWidth: 1200, margin: '80px auto 60px', padding: '0 24px', position: 'relative' }}>
    {/* Sticky note floating top-left */}
    <div style={{ position: 'absolute', top: -30, left: 40, zIndex: 2 }}>
      <StickyNote color="yellow" rotate={-6} tape>
        <div style={{ fontFamily: 'Caveat', fontSize: 18, color: '#0f172a', lineHeight: 1.2, maxWidth: 140 }}>
          Klausur in <span style={{ textDecoration: 'line-through', color: '#64748b' }}>3 Wochen</span> <span style={{ color: '#dc2626' }}>10 Tagen</span>!
        </div>
      </StickyNote>
    </div>
    {/* Doodle top-right */}
    <div style={{ position: 'absolute', top: 20, right: 80, transform: 'rotate(12deg)', zIndex: 2 }}>
      <Doodles.Star color="#6366f1" size={28}/>
    </div>
    <div style={{ position: 'absolute', top: 60, right: 40, transform: 'rotate(-6deg)', zIndex: 2 }}>
      <Doodles.Sparkle color="#f59e0b" size={18}/>
    </div>

    <div style={{ textAlign: 'center', position: 'relative' }}>
      <div className="pill" style={{ marginBottom: 24 }}>
        <Icons.Sparkles size={12}/>
        Jetzt mit Flow AI — dein Lernbuddy
      </div>
      <h1 style={{
        fontFamily: 'Instrument Sans',
        fontSize: 72,
        fontWeight: 600,
        letterSpacing: '-0.03em',
        lineHeight: 1.02,
        color: '#0f172a',
        margin: 0,
        maxWidth: 900,
        marginInline: 'auto',
      }}>
        Lern smarter.<br/>
        <span style={{ position: 'relative', display: 'inline-block' }}>
          <span style={{ fontFamily: 'Caveat', fontWeight: 600, color: '#6366f1', fontSize: 80 }}>Nicht härter.</span>
          <span style={{ position: 'absolute', left: -4, right: -4, bottom: 8 }}>
            <Doodles.Underline color="#818cf8" w={380}/>
          </span>
        </span>
      </h1>
      <p style={{
        fontSize: 19, color: '#64748b', lineHeight: 1.55,
        maxWidth: 620, margin: '28px auto 0',
      }}>
        Karteikarten, Dokumente und ein AI-Lernbuddy an einem Ort.<br/>
        Zusammen mit deinen Lerngruppen — in Echtzeit.
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 36 }}>
        <a href="dashboard.html" className="btn-primary" style={{ padding: '14px 24px', fontSize: 15 }}>
          Kostenlos starten
          <Icons.ArrowRight size={16}/>
        </a>
        <a href="#demo" className="btn-ghost" style={{ padding: '14px 22px', fontSize: 15 }}>
          <Icons.Play size={14}/>
          Demo ansehen (2 Min)
        </a>
      </div>
      <div style={{ marginTop: 24, fontSize: 13, color: '#94a3b8' }}>
        Kostenlos · Keine Kreditkarte · <span style={{ color: '#6366f1', fontWeight: 500 }}>42.000+ Studierende</span>
      </div>
    </div>
  </section>
);

const BentoGrid = () => (
  <section id="features" style={{ maxWidth: 1200, margin: '40px auto', padding: '0 24px' }}>
    <div style={{ textAlign: 'center', marginBottom: 48 }}>
      <div style={{ fontFamily: 'Caveat', fontSize: 22, color: '#6366f1', fontWeight: 600 }}>Dein Werkzeugkasten</div>
      <div style={{ fontFamily: 'Instrument Sans', fontSize: 44, fontWeight: 600, color: '#0f172a', letterSpacing: '-0.02em', marginTop: 4 }}>
        Alles was du zum Lernen brauchst.
      </div>
    </div>
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gridAutoRows: 'minmax(230px, auto)',
      gap: 16,
    }}>
      {LANDING_FEATURES.map(f => <BentoCard key={f.id} feature={f}/>)}
    </div>
  </section>
);

const AISpotlight = () => (
  <section id="ai" style={{ maxWidth: 1200, margin: '100px auto', padding: '0 24px' }}>
    <div style={{
      position: 'relative',
      background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
      borderRadius: 28,
      padding: '72px 60px',
      color: 'white',
      overflow: 'hidden',
    }}>
      {/* dots in bg */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.15, backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '22px 22px' }}></div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center', position: 'relative' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', fontSize: 12, fontWeight: 500 }}>
            <Icons.Sparkles size={14}/>
            Flow AI
          </div>
          <h2 style={{ fontFamily: 'Instrument Sans', fontSize: 48, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.05, margin: '20px 0 0' }}>
            Zusammenfassung?<br/>
            <span style={{ fontFamily: 'Caveat', fontSize: 58, color: '#a5b4fc' }}>In 8 Sekunden.</span>
          </h2>
          <p style={{ fontSize: 17, color: '#c7d2fe', marginTop: 20, lineHeight: 1.55, maxWidth: 460 }}>
            Lade dein Skript hoch. Flow liest es, fasst es zusammen, erstellt Karteikarten und Quizfragen — alles automatisch.
          </p>
          <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {['Erkennt Themen und Kernkonzepte', 'Generiert Karteikarten im Stil deines Faches', 'Merkt sich deine Schwachstellen'].map(t => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(165,180,252,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icons.Check size={12}/>
                </div>
                {t}
              </div>
            ))}
          </div>
        </div>

        {/* Chat preview */}
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 18,
          padding: 20,
          backdropFilter: 'blur(20px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 14, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #818cf8, #c7d2fe)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icons.Sparkles size={16}/>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Flow</div>
              <div style={{ fontSize: 11, color: '#a5b4fc', display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }}></span>
                bereit
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
                <div style={{ width: 14, height: 14, borderRadius: 3, background: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icons.Check size={10}/>
                </div>
                20 Karten erstellt · 6 Quizfragen · Zusammenfassung
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const Footer = () => (
  <footer style={{ maxWidth: 1200, margin: '80px auto 40px', padding: '0 24px', borderTop: '1px solid rgba(15,23,42,0.08)', paddingTop: 40 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 40 }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icons.Logo size={26}/>
          <div style={{ fontFamily: 'Caveat', fontSize: 24, fontWeight: 600, color: '#0f172a' }}>StudyFlow</div>
        </div>
        <div style={{ fontSize: 13, color: '#64748b', marginTop: 8, maxWidth: 300 }}>Made with ☕ &amp; late nights. Aus Berlin.</div>
      </div>
      <div style={{ display: 'flex', gap: 60, fontSize: 13 }}>
        {[
          ['Produkt', ['Features', 'AI', 'Preise', 'Roadmap']],
          ['Für Unis', ['Lizenzen', 'Case Studies', 'Support']],
          ['Rechtliches', ['Datenschutz', 'AGB', 'Impressum']],
        ].map(([h, items]) => (
          <div key={h}>
            <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: 10 }}>{h}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, color: '#64748b' }}>
              {items.map(i => <a key={i} href="#">{i}</a>)}
            </div>
          </div>
        ))}
      </div>
    </div>
    <div style={{ marginTop: 32, fontSize: 12, color: '#94a3b8' }}>© 2026 StudyFlow GmbH</div>
  </footer>
);

const Landing = () => (
  <div className="dot-paper" style={{ minHeight: '100vh' }}>
    <Nav/>
    <Hero/>
    <BentoGrid/>
    <AISpotlight/>
    <Footer/>
    <AIAssistant/>
  </div>
);

ReactDOM.createRoot(document.getElementById('root')).render(<Landing/>);
