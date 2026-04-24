// app-ui.jsx — shared UI primitives for the gym app.
// TOKENS lives in app-theme.jsx and is mutated on theme change.

// ─── Icons (hairline, 20px) ──────────────────────────────────
const Icon = {
  plus: (p = {}) => <svg width="20" height="20" viewBox="0 0 20 20" fill="none" {...p}><path d="M10 4.5v11M4.5 10h11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  chevron: (p = {}) => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...p}><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  back: (p = {}) => <svg width="20" height="20" viewBox="0 0 20 20" fill="none" {...p}><path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  close: (p = {}) => <svg width="20" height="20" viewBox="0 0 20 20" fill="none" {...p}><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  trash: (p = {}) => <svg width="18" height="18" viewBox="0 0 18 18" fill="none" {...p}><path d="M3 5h12M7 5V3.5a1 1 0 011-1h2a1 1 0 011 1V5M5 5l.8 9.1a1 1 0 001 .9h4.4a1 1 0 001-.9L13 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  check: (p = {}) => <svg width="18" height="18" viewBox="0 0 18 18" fill="none" {...p}><path d="M3.5 9.5l3.5 3.5 7.5-8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  home: (p = {}) => <svg width="22" height="22" viewBox="0 0 22 22" fill="none" {...p}><path d="M3 10l8-6 8 6v8.5a1 1 0 01-1 1h-4v-6h-6v6H4a1 1 0 01-1-1V10z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg>,
  dumbbell: (p = {}) => <svg width="22" height="22" viewBox="0 0 22 22" fill="none" {...p}><path d="M3 8v6M5.5 6v10M16.5 6v10M19 8v6M5.5 11h11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  calendar: (p = {}) => <svg width="22" height="22" viewBox="0 0 22 22" fill="none" {...p}><rect x="3.5" y="5" width="15" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M3.5 9h15M7 3.5v3M15 3.5v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  ellipsis: (p = {}) => <svg width="20" height="20" viewBox="0 0 20 20" fill="none" {...p}><circle cx="4" cy="10" r="1.3" fill="currentColor"/><circle cx="10" cy="10" r="1.3" fill="currentColor"/><circle cx="16" cy="10" r="1.3" fill="currentColor"/></svg>,
  settings: (p = {}) => <svg width="20" height="20" viewBox="0 0 20 20" fill="none" {...p}><circle cx="10" cy="10" r="2.6" stroke="currentColor" strokeWidth="1.4"/><path d="M10 2.5v2M10 15.5v2M2.5 10h2M15.5 10h2M4.7 4.7l1.4 1.4M13.9 13.9l1.4 1.4M4.7 15.3l1.4-1.4M13.9 6.1l1.4-1.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
};

// ─── Screen chrome ─────────────────────────────────────────────
function Screen({ children, style = {} }) {
  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      background: TOKENS.bg, fontFamily: TOKENS.font, color: TOKENS.ink,
      ...style,
    }}>{children}</div>
  );
}

function TopBar({ title, onBack, left, right, subtle }) {
  return (
    <div style={{
      paddingTop: 54, paddingBottom: 12,
      paddingLeft: 20, paddingRight: 20,
      display: 'flex', alignItems: 'center', gap: 8,
      minHeight: 54,
    }}>
      {onBack ? (
        <button onClick={onBack} style={btnIconStyle}>
          <Icon.back />
        </button>
      ) : left ? (
        <div style={{ width: 34, display: 'flex', justifyContent: 'flex-start' }}>{left}</div>
      ) : <div style={{ width: 34 }} />}
      <div style={{
        flex: 1, textAlign: 'center',
        fontSize: 15, fontWeight: 600, letterSpacing: -0.2,
        color: subtle ? TOKENS.muted : TOKENS.ink,
      }}>{title}</div>
      <div style={{ width: 34, display: 'flex', justifyContent: 'flex-end' }}>{right}</div>
    </div>
  );
}

function LargeTitle({ children, eyebrow }) {
  return (
    <div style={{ padding: '4px 24px 20px' }}>
      {eyebrow && (
        <div style={{
          fontSize: 11, fontWeight: 600, letterSpacing: 1.4,
          textTransform: 'uppercase', color: TOKENS.subtle, marginBottom: 8,
        }}>{eyebrow}</div>
      )}
      <div style={{
        fontSize: 34, fontWeight: 700, letterSpacing: -1.2,
        lineHeight: 1.05, color: TOKENS.ink,
      }}>{children}</div>
    </div>
  );
}

const btnIconStyle = {
  width: 34, height: 34, borderRadius: 10,
  background: 'transparent', border: 'none',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: TOKENS.ink, cursor: 'pointer', padding: 0,
};

function PrimaryButton({ children, onClick, disabled, style = {} }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: '100%', height: 52, borderRadius: 14,
      background: disabled ? TOKENS.lineStrong : TOKENS.ink,
      color: '#fff', border: 'none',
      fontFamily: TOKENS.font, fontSize: 16, fontWeight: 600, letterSpacing: -0.2,
      cursor: disabled ? 'default' : 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      ...style,
    }}>{children}</button>
  );
}

function SecondaryButton({ children, onClick, style = {} }) {
  return (
    <button onClick={onClick} style={{
      height: 44, borderRadius: 12, padding: '0 18px',
      background: TOKENS.surface, border: `1px solid ${TOKENS.line}`,
      color: TOKENS.ink, fontFamily: TOKENS.font, fontSize: 14.5, fontWeight: 500,
      cursor: 'pointer',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      ...style,
    }}>{children}</button>
  );
}

function Card({ children, style = {}, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: TOKENS.surface, borderRadius: 16,
      border: `1px solid ${TOKENS.line}`,
      padding: 18,
      cursor: onClick ? 'pointer' : 'default',
      ...style,
    }}>{children}</div>
  );
}

function TextInput({ value, onChange, placeholder, autoFocus, type = 'text', inputMode, style = {}, align = 'left' }) {
  return (
    <input
      type={type}
      inputMode={inputMode}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
      style={{
        width: '100%', height: 48, borderRadius: 12,
        border: `1px solid ${TOKENS.line}`, background: TOKENS.surface,
        padding: '0 14px', fontFamily: TOKENS.font, fontSize: 16,
        color: TOKENS.ink, outline: 'none', textAlign: align,
        boxSizing: 'border-box',
        ...style,
      }}
    />
  );
}

function Sheet({ open, onClose, children, title, height = 'auto' }) {
  if (!open) return null;
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 100,
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
    }}>
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.28)',
        animation: 'fadeIn 180ms ease-out',
      }} />
      <div style={{
        position: 'relative', background: TOKENS.bg,
        borderTopLeftRadius: 22, borderTopRightRadius: 22,
        padding: '8px 0 24px', minHeight: 200,
        maxHeight: '85%', display: 'flex', flexDirection: 'column',
        animation: 'slideUp 240ms cubic-bezier(.22,1,.36,1)',
        boxShadow: '0 -10px 40px rgba(0,0,0,0.12)',
      }}>
        <div style={{
          alignSelf: 'center', width: 36, height: 4, borderRadius: 2,
          background: TOKENS.lineStrong, margin: '6px 0 10px',
        }} />
        {title && (
          <div style={{
            padding: '4px 24px 12px',
            fontSize: 17, fontWeight: 600, letterSpacing: -0.3,
          }}>{title}</div>
        )}
        <div style={{ flex: 1, overflow: 'auto', paddingBottom: 12 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ icon, title, body, action }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      textAlign: 'center', padding: '40px 32px',
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 16,
        background: TOKENS.surface, border: `1px solid ${TOKENS.line}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: TOKENS.muted, marginBottom: 16,
      }}>{icon}</div>
      <div style={{ fontSize: 17, fontWeight: 600, color: TOKENS.ink, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 14, color: TOKENS.muted, lineHeight: 1.45, marginBottom: 18, maxWidth: 260 }}>{body}</div>
      {action}
    </div>
  );
}

// Global keyframes injected once
if (typeof document !== 'undefined' && !document.getElementById('gym-app-keyframes')) {
  const s = document.createElement('style');
  s.id = 'gym-app-keyframes';
  s.textContent = `
    @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
    @keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
    @keyframes gymPulse { 0% { transform: scale(1); opacity: 0.45 } 70% { transform: scale(2.4); opacity: 0 } 100% { transform: scale(2.4); opacity: 0 } }
    input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
    input[type=number] { -moz-appearance: textfield; }
    button:active { transform: scale(0.98); }
    button { transition: transform 80ms ease, background 120ms ease; }
  `;
  document.head.appendChild(s);
}

Object.assign(window, {
  Icon, Screen, TopBar, LargeTitle,
  PrimaryButton, SecondaryButton, Card, TextInput, Sheet, EmptyState,
});
