import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAdminUsers } from '../hooks/useAdminUsers';
import './AdminDashboardPage.css';

const ROLE_CHIPS = [
  { value: 'all', label: 'All' },
  { value: 'Admin', label: 'Admin' },
  { value: 'User', label: 'User' },
];

const DATE_CHIPS = [
  { value: 'all', label: 'All time' },
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
];

const ICONS = {
  mail: (
    <svg fill="none" height="14" viewBox="0 0 15 15" width="14">
      <rect height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4" width="12" x="1.5" y="3" />
      <path d="M2 4l5.5 4L13 4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
    </svg>
  ),
  phone: (
    <svg fill="none" height="14" viewBox="0 0 15 15" width="14">
      <path
        d="M3 2.5h2l1 3-1.5 1.2a8 8 0 004.8 4.8L10.5 10l3 1v2c0 .8-.7 1.5-1.5 1.4C6 14 1 9 .6 3.5 .5 2.7 1.2 2 2 2h1Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.3"
      />
    </svg>
  ),
  building: (
    <svg fill="none" height="14" viewBox="0 0 15 15" width="14">
      <rect height="11" rx="1" stroke="currentColor" strokeWidth="1.4" width="9" x="3" y="2" />
      <path
        d="M5.5 5h1M8.5 5h1M5.5 7.5h1M8.5 7.5h1M5.5 10h1M8.5 10h1"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.3"
      />
    </svg>
  ),
  calendar: (
    <svg fill="none" height="15" viewBox="0 0 16 16" width="15">
      <rect height="12" rx="1.5" stroke="currentColor" strokeWidth="1.4" width="10" x="3" y="2" />
      <path d="M3 6.5h10M5.5 2v2.5M10.5 2v2.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
    </svg>
  ),
  applications: (
    <svg fill="none" height="15" viewBox="0 0 16 16" width="15">
      <rect height="12" rx="1.5" stroke="currentColor" strokeWidth="1.4" width="10" x="3" y="2" />
      <path d="M5.5 5.5h5M5.5 8h5M5.5 10.5h3" stroke="currentColor" strokeLinecap="round" strokeWidth="1.3" />
    </svg>
  ),
  academic: (
    <svg fill="none" height="15" viewBox="0 0 16 16" width="15">
      <path d="M8 2.5L14.5 6 8 9.5 1.5 6 8 2.5Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.4" />
      <path d="M4.5 7.5v3c0 1.7 1.6 3 3.5 3s3.5-1.3 3.5-3v-3" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  ),
  gender: (
    <svg fill="none" height="15" viewBox="0 0 16 16" width="15">
      <circle cx="6.5" cy="8.5" r="3.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M9 6l4-4M9.5 2h3.5v3.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
    </svg>
  ),
  financial: (
    <svg fill="none" height="15" viewBox="0 0 16 16" width="15">
      <circle cx="8" cy="8" r="6.3" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M8 4.5v7M10 6c0-1-.9-1.7-2-1.7S6 5 6 6s.9 1.4 2 1.7 2 .7 2 1.7-.9 1.6-2 1.6-2-.6-2-1.6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.3"
      />
    </svg>
  ),
  tag: (
    <svg fill="none" height="14" viewBox="0 0 15 15" width="14">
      <path d="M2 2h5l6 6-5 5-6-6V2Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.4" />
      <circle cx="5" cy="5" fill="currentColor" r="1" />
    </svg>
  ),
  shield: (
    <svg fill="none" height="14" viewBox="0 0 15 15" width="14">
      <path
        d="M7.5 1.5l5 1.8v3.8c0 3.5-2.2 5.7-5 6.4-2.8-.7-5-2.9-5-6.4V3.3l5-1.8Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.4"
      />
    </svg>
  ),
  user: (
    <svg fill="none" height="14" viewBox="0 0 15 15" width="14">
      <circle cx="7.5" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2.5 13c0-2.8 2.2-4.5 5-4.5s5 1.7 5 4.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
    </svg>
  ),
};

const TABS = [
  { key: 'overview', label: 'Overview', icon: ICONS.tag },
  { key: 'personal', label: 'Personal Details', icon: ICONS.user },
];

function formatRegisteredOn(dateObj) {
  if (!dateObj || dateObj.getTime() === 0) return 'N/A';
  return dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AdminUserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { users, statusMessage } = useAdminUsers();
  const [activeTab, setActiveTab] = useState('overview');
  const [search, setSearch] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [pendingRole, setPendingRole] = useState('all');
  const [pendingDateRange, setPendingDateRange] = useState('all');
  const filtersRef = useRef(null);
  const adminMenuRef = useRef(null);

  const user = users.find((candidate) => candidate.id === id) || null;

  useEffect(() => {
    if (!toastMessage) return undefined;
    const timeoutId = window.setTimeout(() => setToastMessage(''), 2400);
    return () => window.clearTimeout(timeoutId);
  }, [toastMessage]);

  useEffect(() => {
    const handleDocumentClick = (event) => {
      if (filtersRef.current && !filtersRef.current.contains(event.target)) setFiltersOpen(false);
      if (adminMenuRef.current && !adminMenuRef.current.contains(event.target)) setAdminMenuOpen(false);
    };
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, []);

  const goToDashboardSearch = () => {
    const trimmed = search.trim();
    navigate(trimmed ? `/admin?q=${encodeURIComponent(trimmed)}` : '/admin');
  };

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (pendingRole !== 'all') params.set('role', pendingRole);
    if (pendingDateRange !== 'all') params.set('dateRange', pendingDateRange);
    setFiltersOpen(false);
    navigate(params.toString() ? `/admin?${params.toString()}` : '/admin');
  };

  const handleLogout = () => {
    window.localStorage.removeItem('scholarhub-auth-token');
    window.localStorage.removeItem('token');
    window.localStorage.removeItem('scholarhub-react-state-v1');
    navigate('/login');
  };

  return (
    <main className="admin-dashboard-shell">
      <div className="admin-dashboard-page">
        {/* ══════════ TOPBAR ══════════ */}
        <div className="topbar">
          <div className="search-wrap">
            <span className="search-icon">
              <svg fill="none" height="17" viewBox="0 0 17 17" width="17">
                <circle cx="7.5" cy="7.5" r="5.2" stroke="currentColor" strokeWidth="1.6" />
                <path d="M11.7 11.7L15 15" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
              </svg>
            </span>
            <input
              className="search-input"
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') goToDashboardSearch();
              }}
              placeholder="Search by name, email, mobile or user ID..."
              type="text"
              value={search}
            />
          </div>

          <div ref={filtersRef} style={{ position: 'relative' }}>
            <button
              className="filter-btn"
              onClick={() => {
                setPendingRole('all');
                setPendingDateRange('all');
                setFiltersOpen((open) => !open);
              }}
              type="button"
            >
              <svg fill="none" height="16" viewBox="0 0 16 16" width="16">
                <path d="M2 3h12l-4.5 5.5V13L7 11.5V8.5L2 3Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" />
              </svg>
              Filters
            </button>

            <div className={`filters-panel${filtersOpen ? ' open' : ''}`}>
              <div className="filters-panel-title">Status</div>
              <div className="filter-chip-row">
                {ROLE_CHIPS.map((chip) => (
                  <button
                    className={`filter-chip${pendingRole === chip.value ? ' selected' : ''}`}
                    key={chip.value}
                    onClick={() => setPendingRole(chip.value)}
                    type="button"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
              <div className="filters-panel-title">Registered</div>
              <div className="filter-chip-row">
                {DATE_CHIPS.map((chip) => (
                  <button
                    className={`filter-chip${pendingDateRange === chip.value ? ' selected' : ''}`}
                    key={chip.value}
                    onClick={() => setPendingDateRange(chip.value)}
                    type="button"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
              <button className="filters-apply" onClick={applyFilters} type="button">
                Apply Filters
              </button>
            </div>
          </div>

          <div className="topbar-right">
            <button className="bell-btn" onClick={() => setToastMessage('You have 5 new notifications')} type="button">
              <svg fill="none" height="21" viewBox="0 0 21 21" width="21">
                <path
                  d="M10.5 2.5c-2.5 0-4.5 2-4.5 4.5v3l-1.8 3h12.6l-1.8-3v-3c0-2.5-2-4.5-4.5-4.5Z"
                  stroke="currentColor"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                />
                <path d="M8.7 16c.3 1 1 1.5 1.8 1.5s1.5-.5 1.8-1.5" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              <span className="bell-badge">5</span>
            </button>

            <div ref={adminMenuRef} style={{ position: 'relative' }}>
              <div className="admin-chip" onClick={() => setAdminMenuOpen((open) => !open)}>
                <div className="admin-avatar">A</div>
                <div className="admin-info">
                  <span className="admin-name">Admin</span>
                  <span className="admin-role">Super Admin</span>
                </div>
                <svg fill="none" height="14" viewBox="0 0 14 14" width="14">
                  <path
                    d="M3.5 5.5L7 9l3.5-3.5"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.6"
                  />
                </svg>
              </div>
              <div className={`admin-dropdown${adminMenuOpen ? ' open' : ''}`}>
                <button className="dd-item" type="button">
                  My Profile
                </button>
                <button className="dd-item" type="button">
                  Account Settings
                </button>
                <button className="dd-item" type="button">
                  Notification Prefs
                </button>
                <button className="dd-item danger" onClick={handleLogout} type="button">
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="ud-breadcrumb">
          <button aria-label="Go back" className="icon-btn" onClick={() => navigate(-1)} type="button">
            <svg fill="none" height="14" viewBox="0 0 14 14" width="14">
              <path d="M9 11L5 7l4-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
            </svg>
          </button>
          <span className="ud-crumb" onClick={() => navigate('/admin')}>
            Users
          </span>
          <svg fill="none" height="13" viewBox="0 0 13 13" width="13">
            <path
              d="M5 3l4 3.5L5 10"
              stroke="#9498B3"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.6"
            />
          </svg>
          <span className="ud-crumb">User Details</span>
          <svg fill="none" height="13" viewBox="0 0 13 13" width="13">
            <path
              d="M5 3l4 3.5L5 10"
              stroke="#9498B3"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.6"
            />
          </svg>
          <span className="ud-crumb current">{user ? user.name : 'User'}</span>
        </div>

        {statusMessage ? (
          <div className="admin-guard-message">{statusMessage}</div>
        ) : !user ? (
          <div className="ud-not-found">
            User not found. It may have been removed, or the link is out of date.
          </div>
        ) : (
          <>
            <div className="ud-profile-card">
              <div className="ud-profile-avatar" style={{ background: user.color }}>
                {user.initials}
              </div>
              <div className="ud-profile-info">
                <div className="ud-profile-name-line">
                  <span className="ud-profile-name">{user.name}</span>
                  <span className={`status-pill ${user.roleClass || 'neutral'}`}>{user.role}</span>
                </div>
                <div className="ud-profile-id">User ID: {user.id}</div>
                <div className="ud-profile-reg">Registered On: {formatRegisteredOn(user.dateObj)}</div>
                <div className="ud-contact-row">
                  <span className="ud-contact-item">
                    {ICONS.mail} {user.email}
                  </span>
                  <span className="ud-contact-item">
                    {ICONS.phone} {user.mobile}
                  </span>
                  <span className="ud-contact-item">
                    {ICONS.building} {user.collegeName}
                  </span>
                </div>
              </div>
            </div>

            <div className="ud-tabs">
              {TABS.map((tab) => (
                <button
                  className={`ud-tab${activeTab === tab.key ? ' active' : ''}`}
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  type="button"
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            <div className="ud-body">
              {activeTab === 'overview' ? (
                <div className="ud-overview-grid">
                  <div className="ud-overview-mini">
                    <div className="ud-overview-mini-icon">{ICONS.academic}</div>
                    <div>
                      <div className="ud-overview-mini-label">Student Type</div>
                      <div className="ud-overview-mini-value">{user.studentType}</div>
                    </div>
                  </div>
                  <div className="ud-overview-mini">
                    <div className="ud-overview-mini-icon">{ICONS.applications}</div>
                    <div>
                      <div className="ud-overview-mini-label">Education Level</div>
                      <div className="ud-overview-mini-value">{user.educationLevel}</div>
                    </div>
                  </div>
                  <div className="ud-overview-mini">
                    <div className="ud-overview-mini-icon">{ICONS.gender}</div>
                    <div>
                      <div className="ud-overview-mini-label">Gender</div>
                      <div className="ud-overview-mini-value">{user.gender}</div>
                    </div>
                  </div>
                  <div className="ud-overview-mini">
                    <div className="ud-overview-mini-icon">{ICONS.financial}</div>
                    <div>
                      <div className="ud-overview-mini-label">CGPA</div>
                      <div className="ud-overview-mini-value">{user.cgpa}</div>
                    </div>
                  </div>
                  <div className="ud-overview-mini">
                    <div className="ud-overview-mini-icon">{ICONS.tag}</div>
                    <div>
                      <div className="ud-overview-mini-label">Category</div>
                      <div className="ud-overview-mini-value">{user.category}</div>
                    </div>
                  </div>
                  <div className="ud-overview-mini">
                    <div className="ud-overview-mini-icon">{ICONS.shield}</div>
                    <div>
                      <div className="ud-overview-mini-label">Role</div>
                      <div className="ud-overview-mini-value">{user.role}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="ud-info-grid">
                  <div className="ud-info-item">
                    <div className="ud-info-icon">{ICONS.user}</div>
                    <div>
                      <div className="ud-info-label">Full Name</div>
                      <div className="ud-info-value">{user.name}</div>
                    </div>
                  </div>
                  <div className="ud-info-item">
                    <div className="ud-info-icon">{ICONS.mail}</div>
                    <div>
                      <div className="ud-info-label">Email Address</div>
                      <div className="ud-info-value">{user.email}</div>
                    </div>
                  </div>
                  <div className="ud-info-item">
                    <div className="ud-info-icon">{ICONS.phone}</div>
                    <div>
                      <div className="ud-info-label">Mobile Number</div>
                      <div className="ud-info-value">{user.mobile}</div>
                    </div>
                  </div>
                  <div className="ud-info-item">
                    <div className="ud-info-icon">{ICONS.academic}</div>
                    <div>
                      <div className="ud-info-label">Student Type</div>
                      <div className="ud-info-value">{user.studentType}</div>
                    </div>
                  </div>
                  <div className="ud-info-item">
                    <div className="ud-info-icon">{ICONS.applications}</div>
                    <div>
                      <div className="ud-info-label">Education Level</div>
                      <div className="ud-info-value">{user.educationLevel}</div>
                    </div>
                  </div>
                  <div className="ud-info-item">
                    <div className="ud-info-icon">{ICONS.gender}</div>
                    <div>
                      <div className="ud-info-label">Gender</div>
                      <div className="ud-info-value">{user.gender}</div>
                    </div>
                  </div>
                  <div className="ud-info-item">
                    <div className="ud-info-icon">{ICONS.building}</div>
                    <div>
                      <div className="ud-info-label">College Name</div>
                      <div className="ud-info-value">{user.collegeName}</div>
                    </div>
                  </div>
                  <div className="ud-info-item">
                    <div className="ud-info-icon">{ICONS.financial}</div>
                    <div>
                      <div className="ud-info-label">CGPA</div>
                      <div className="ud-info-value">{user.cgpa}</div>
                    </div>
                  </div>
                  <div className="ud-info-item">
                    <div className="ud-info-icon">{ICONS.tag}</div>
                    <div>
                      <div className="ud-info-label">Category</div>
                      <div className="ud-info-value">{user.category}</div>
                    </div>
                  </div>
                  <div className="ud-info-item">
                    <div className="ud-info-icon">{ICONS.shield}</div>
                    <div>
                      <div className="ud-info-label">Role</div>
                      <div className="ud-info-value">{user.role}</div>
                    </div>
                  </div>
                  <div className="ud-info-item">
                    <div className="ud-info-icon">{ICONS.tag}</div>
                    <div>
                      <div className="ud-info-label">User ID</div>
                      <div className="ud-info-value">{user.id}</div>
                    </div>
                  </div>
                  <div className="ud-info-item">
                    <div className="ud-info-icon">{ICONS.calendar}</div>
                    <div>
                      <div className="ud-info-label">Registered On</div>
                      <div className="ud-info-value">{formatRegisteredOn(user.dateObj)}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className={`toast${toastMessage ? ' show' : ''}`}>{toastMessage}</div>
    </main>
  );
}
