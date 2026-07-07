import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { portalNav } from '../data/mockData';
import { useAppContext } from '../context/AppContext';

function getInitials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function PortalTopBar() {
  const navigate = useNavigate();
  const { state, profileCompletion, unreadNotifications } = useAppContext();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleDocumentClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false);
    };
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, []);

  const handleLogout = () => {
    window.localStorage.removeItem('scholarhub-auth-token');
    window.localStorage.removeItem('token');
    window.localStorage.removeItem('scholarhub-react-state-v1');
    navigate('/login');
  };

  return (
    <header className="portal-topbar">
      <Link className="brand-lockup" to="/dashboard">
        <span className="brand-mark">SH</span>
        <span className="brand-text">
          ScholarHub
          <small>React migration</small>
        </span>
      </Link>

      <nav className="portal-nav" aria-label="Main navigation">
        {portalNav.map((item) => (
          <NavLink
            key={item.href}
            className={({ isActive }) => `portal-nav__item${isActive ? ' is-active' : ''}`}
            to={item.href}
          >
            {item.label}
            {item.label === 'Notifications' && unreadNotifications > 0 ? (
              <span className="portal-nav__count">{unreadNotifications}</span>
            ) : null}
          </NavLink>
        ))}
      </nav>

      <div className="portal-meta">
        <span className="meta-pill">{profileCompletion}% profile complete</span>
        <div className="meta-account" ref={menuRef}>
          <button className="meta-chip" onClick={() => setMenuOpen((open) => !open)} type="button">
            <div className="meta-avatar">{getInitials(state.profile.name)}</div>
            <div className="meta-info">
              <span className="meta-name">{state.profile.name || 'Student'}</span>
              {state.profile.role ? <span className="meta-role">{state.profile.role}</span> : null}
            </div>
          </button>
          <div className={`meta-dropdown${menuOpen ? ' meta-dropdown--open' : ''}`}>
            <button className="meta-dropdown__item meta-dropdown__item--danger" onClick={handleLogout} type="button">
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export function PortalPage({ eyebrow, title, subtitle, actions, children, fullWidth = false }) {
  return (
    <div className="portal-screen">
      <PortalTopBar />
      <section className={`portal-page${fullWidth ? ' portal-page--wide' : ''}`}>
        <div className="page-heading">
          <div>
            {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
            <h1>{title}</h1>
            {subtitle ? <p className="page-subtitle">{subtitle}</p> : null}
          </div>
          {actions ? <div className="page-actions">{actions}</div> : null}
        </div>
        {children}
      </section>
    </div>
  );
}

export function SectionCard({ title, subtitle, action, children, className = '' }) {
  return (
    <section className={`surface-card ${className}`.trim()}>
      {(title || action) && (
        <div className="surface-card__head">
          <div>
            {title ? <h2>{title}</h2> : null}
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          {action ? <div>{action}</div> : null}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatusPill({ children, tone = 'neutral' }) {
  return <span className={`status-pill status-pill--${tone}`}>{children}</span>;
}

export function StatTile({ label, value, detail }) {
  return (
    <div className="stat-tile">
      <span className="stat-tile__label">{label}</span>
      <strong className="stat-tile__value">{value}</strong>
      {detail ? <span className="stat-tile__detail">{detail}</span> : null}
    </div>
  );
}
