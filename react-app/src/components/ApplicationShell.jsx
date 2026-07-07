import { Link, useNavigate } from 'react-router-dom';
import { stepItems } from '../data/mockData';

export function ApplicationShell({
  currentStep,
  title,
  subtitle,
  asideTitle,
  asideText,
  highlights,
  metrics,
  backTo,
  backLabel,
  children,
}) {
  const navigate = useNavigate();
  const stepIndex = stepItems.findIndex((item) => item.key === currentStep);
  const progress = ((stepIndex + 1) / stepItems.length) * 100;

  const handleLogout = () => {
    window.localStorage.removeItem('scholarhub-auth-token');
    window.localStorage.removeItem('token');
    window.localStorage.removeItem('scholarhub-react-state-v1');
    navigate('/login');
  };

  return (
    <div className="application-screen">
      <aside className="application-aside">
        <Link className="brand-lockup brand-lockup--light" to="/dashboard">
          <span className="brand-mark">SH</span>
          <span className="brand-text">
            ScholarHub
            <small>Application flow</small>
          </span>
        </Link>

        <div className="application-aside__body">
          <p className="eyebrow eyebrow--light">Scholarship application</p>
          <h1>{asideTitle}</h1>
          <p className="application-aside__copy">{asideText}</p>

          <div className="step-list">
            {stepItems.map((item, index) => {
              const status =
                index < stepIndex ? 'complete' : index === stepIndex ? 'active' : 'upcoming';
              const itemClassName = `step-list__item step-list__item--${status}${
                index <= stepIndex ? ' step-list__item--selectable' : ''
              }`;
              const content = (
                <>
                  <span className="step-list__count">
                    {status === 'complete' ? 'OK' : index + 1}
                  </span>
                  <div>
                    <strong>{item.label}</strong>
                    <p>{item.description}</p>
                  </div>
                </>
              );

              if (index <= stepIndex) {
                return (
                  <Link
                    aria-current={status === 'active' ? 'step' : undefined}
                    className={itemClassName}
                    key={item.key}
                    to={item.href}
                  >
                    {content}
                  </Link>
                );
              }

              return (
                <div className={itemClassName} key={item.key}>
                  {content}
                </div>
              );
            })}
          </div>

          <div className="aside-note-list">
            {highlights.map((highlight) => (
              <div className="aside-note" key={highlight}>
                <span className="aside-note__dot" />
                <p>{highlight}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="metric-grid">
          {metrics.map((metric) => (
            <div className="metric-grid__item" key={metric.label}>
              <strong>{metric.value}</strong>
              <span>{metric.label}</span>
            </div>
          ))}
        </div>
      </aside>

      <main className="application-panel">
        <div className="application-progress">
          <div className="application-progress__top">
            <div className="application-progress__row">
              <span>
                Step {stepIndex + 1} of {stepItems.length}
              </span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <button
              className="button button--ghost button--small application-progress__logout"
              onClick={handleLogout}
              type="button"
            >
              Logout
            </button>
          </div>
          <div className="progress-track">
            <div className="progress-track__fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="application-panel__header">
          {backTo ? (
            <div className="application-panel__header-actions">
              <Link className="back-link" to={backTo}>
                {backLabel ?? 'Back'}
              </Link>
            </div>
          ) : null}
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>

        <div className="application-panel__body">{children}</div>
      </main>
    </div>
  );
}
