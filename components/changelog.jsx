// StudyFlow — Changelog
const { useState } = React;

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
    <a href="Landing.html" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
      <Icons.Logo size={30}/>
      <div style={{ fontFamily: 'Caveat', fontSize: 26, fontWeight: 600, color: '#0f172a', lineHeight: 1 }}>StudyFlow</div>
    </a>
    <div style={{ display: 'flex', alignItems: 'center', gap: 28, fontSize: 14, color: '#475569' }}>
      <a href="Landing.html#features" style={{ textDecoration: 'none', color: 'inherit' }}>Features</a>
      <a href="Landing.html#ai" style={{ textDecoration: 'none', color: 'inherit' }}>AI</a>
      <a href="changelog.html" style={{ textDecoration: 'none', color: '#0f172a', fontWeight: 500 }}>Changelog</a>
      <a href="Landing.html#preis" style={{ textDecoration: 'none', color: 'inherit' }}>Preise</a>
      <a href="Landing.html#uni" style={{ textDecoration: 'none', color: 'inherit' }}>Für Unis</a>
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
          ['Produkt', [{label: 'Features', href: 'Landing.html#features'}, {label: 'AI', href: 'Landing.html#ai'}, {label: 'Changelog', href: 'changelog.html'}, {label: 'Preise', href: 'Landing.html#preis'}, {label: 'Roadmap', href: '#'}]],
          ['Für Unis', [{label: 'Lizenzen', href: 'Landing.html#uni'}, {label: 'Case Studies', href: '#'}, {label: 'Support', href: '#'}]],
          ['Rechtliches', [{label: 'Datenschutz', href: '#'}, {label: 'AGB', href: '#'}, {label: 'Impressum', href: '#'}]],
        ].map(([h, items]) => (
          <div key={h}>
            <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: 10 }}>{h}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, color: '#64748b' }}>
              {items.map(i => <a key={i.label} href={i.href} style={{ textDecoration: 'none', color: 'inherit' }}>{i.label}</a>)}
            </div>
          </div>
        ))}
      </div>
    </div>
    <div style={{ marginTop: 32, fontSize: 12, color: '#94a3b8' }}>© 2026 StudyFlow GmbH</div>
  </footer>
);

const Changelog = () => {
  return (
    <div className="dot-paper" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Nav />
      <main style={{ flex: 1, maxWidth: 800, margin: '60px auto', padding: '0 24px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <h1 style={{ fontFamily: 'Instrument Sans', fontSize: 48, fontWeight: 600, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: 16 }}>Changelog</h1>
          <p style={{ fontSize: 18, color: '#64748b' }}>Neue Updates und Verbesserungen für StudyFlow.</p>
        </div>

        <div style={{ display: 'flex', gap: 32, position: 'relative' }}>
          {/* Timeline line */}
          <div style={{ position: 'absolute', left: 15, top: 8, bottom: 0, width: 2, background: '#e2e8f0', zIndex: 0 }}></div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 48, width: '100%' }}>
            
            {/* Version 0.1 */}
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: 24 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'white', border: '2px solid #6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 4 }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#6366f1' }}></div>
              </div>
              <div style={{ flex: 1, background: 'white', borderRadius: 16, border: '1px solid rgba(15,23,42,0.06)', padding: 32, boxShadow: '0 4px 20px rgba(15,23,42,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#6366f1', background: '#eef2ff', padding: '4px 10px', borderRadius: 999 }}>v0.1</span>
                  <span style={{ fontSize: 14, color: '#64748b' }}>April 2026</span>
                </div>
                <h2 style={{ fontFamily: 'Instrument Sans', fontSize: 24, fontWeight: 600, color: '#0f172a', marginBottom: 16 }}>Erster Release 🚀</h2>
                <div style={{ fontSize: 15, color: '#475569', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <p>Willkommen bei StudyFlow! Mit der ersten Version bringen wir die wichtigsten Features für dein Studium an den Start:</p>
                  <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <li><strong>AI-Dokumentenverarbeitung:</strong> Lade PDFs, DOCX oder Markdown hoch und generiere in Sekunden Zusammenfassungen, Karteikarten und Quizfragen.</li>
                    <li><strong>Spaced Repetition:</strong> Lerne mit Karteikarten, die sich an deinen Lernfortschritt anpassen.</li>
                    <li><strong>Kollaboration in Echtzeit:</strong> Teile Lernsets mit Freunden, seht euch gegenseitig tippen und bearbeitet Karten gemeinsam.</li>
                    <li><strong>Dokumentenverwaltung:</strong> Speichere alle deine Skripte übersichtlich in Ordnern.</li>
                    <li><strong>Whiteboards:</strong> Skizziere Ideen und Zusammenhänge direkt in StudyFlow.</li>
                    <li><strong>Fortschritts-Tracking:</strong> Behalte deine Streaks und Lernaktivität im Blick.</li>
                  </ul>
                  <p style={{ marginTop: 8 }}>Wir freuen uns auf dein Feedback!</p>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<Changelog />);