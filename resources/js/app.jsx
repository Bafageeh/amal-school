import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

const ROUTES = {
    dashboard: '/dashboard',
    evidence: '/evidence',
    settings: '/settings',
};

async function apiGet(url) {
    const response = await fetch(url, {
        headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'same-origin',
    });

    if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
    }

    return response.json();
}

function StatCard({ label, value, icon, tone = 'blue' }) {
    return (
        <div className={`app-stat app-stat-${tone}`}>
            <div className="app-stat-icon">{icon}</div>
            <div>
                <div className="app-stat-label">{label}</div>
                <div className="app-stat-value">{value}</div>
            </div>
        </div>
    );
}

function QuickActions({ actions }) {
    return (
        <div className="app-actions-grid">
            {actions.map((action) => (
                <a key={action.href} className="app-action-card" href={action.href}>
                    <span className="app-action-icon">{action.icon}</span>
                    <span className="app-action-text">
                        <strong>{action.title}</strong>
                        <small>{action.description}</small>
                    </span>
                </a>
            ))}
        </div>
    );
}

function UploadCard({ upload, isPrincipal }) {
    return (
        <div className="upload-card">
            <div className="upload-card-main">
                <div className="upload-file-icon">📎</div>
                <div>
                    <strong>{upload.title}</strong>
                    <div className="muted">{upload.evidence?.title || 'بدون معيار'}</div>
                    {isPrincipal && <div className="teacher-chip">{upload.uploader?.name || 'معلمة غير محددة'}</div>}
                </div>
            </div>
            <div className="upload-card-footer">
                <span>{upload.created_at}</span>
                <a className="btn light" href={upload.download_url}>تحميل</a>
            </div>
        </div>
    );
}

function LatestUploads({ uploads, isPrincipal }) {
    if (!uploads.length) {
        return (
            <div className="empty-state">
                <div className="empty-icon">📂</div>
                <strong>لا توجد ملفات مرفوعة حتى الآن</strong>
                <span>ستظهر آخر الملفات هنا عند رفعها من المعلمات.</span>
            </div>
        );
    }

    return (
        <div className="uploads-list">
            {uploads.map((upload) => (
                <UploadCard key={upload.id} upload={upload} isPrincipal={isPrincipal} />
            ))}
        </div>
    );
}

function LoadingCard() {
    return (
        <div className="card empty-state">
            <div className="empty-icon">⏳</div>
            <strong>جاري تحميل البيانات</strong>
            <span>يتم الآن جلب بيانات الشاشة من API.</span>
        </div>
    );
}

function ErrorCard({ message }) {
    return (
        <div className="alert error">
            <strong>تعذر تحميل بيانات React من API.</strong>
            <div>{message}</div>
        </div>
    );
}

function DashboardContent({ user, stats, latestUploads }) {
    const isPrincipal = user.role === 'principal';

    const actions = [
        {
            title: 'معايير التقييم',
            description: 'عرض ورفع الملفات على المعايير',
            icon: '✅',
            href: ROUTES.evidence,
        },
        ...(isPrincipal ? [
            {
                title: 'الإعدادات',
                description: 'إدارة المعلمات ومتابعة ملفاتهن',
                icon: '⚙️',
                href: ROUTES.settings,
            },
        ] : []),
    ];

    return (
        <div className="react-dashboard">
            <section className="hero-card">
                <div>
                    <span className="hero-kicker">React + API</span>
                    <h1>مرحبًا {user.name}</h1>
                    <p>{isPrincipal ? 'لوحة متابعة ملفات ومعايير تقييم المعلمات.' : 'لوحة رفع ومتابعة ملفات معايير التقييم الخاصة بك.'}</p>
                </div>
                <div className="hero-badge">{isPrincipal ? 'مديرة' : 'معلمة'}</div>
            </section>

            <div className="app-stats-grid">
                {isPrincipal && <StatCard label="المعلمات" value={stats.teachers_count} icon="👩‍🏫" tone="purple" />}
                <StatCard label="معايير التقييم" value={stats.evidence_count} icon="✅" tone="blue" />
                <StatCard label={isPrincipal ? 'إجمالي الملفات' : 'ملفاتي'} value={stats.uploads_count} icon="📁" tone="green" />
            </div>

            <section className="card app-section-card">
                <div className="section-heading">
                    <div>
                        <h3>اختصارات سريعة</h3>
                        <p className="muted">هذه الشاشة تقرأ بياناتها الآن من Laravel API.</p>
                    </div>
                </div>
                <QuickActions actions={actions} />
            </section>

            <section className="card app-section-card">
                <div className="section-heading">
                    <div>
                        <h3>آخر الملفات المرفوعة</h3>
                        <p className="muted">أحدث الملفات حسب الصلاحية الحالية.</p>
                    </div>
                </div>
                <LatestUploads uploads={latestUploads} isPrincipal={isPrincipal} />
            </section>
        </div>
    );
}

function DashboardApp() {
    const [state, setState] = useState({ loading: true, error: null, user: null, dashboard: null });

    useEffect(() => {
        let cancelled = false;

        async function loadDashboard() {
            try {
                const [me, dashboard] = await Promise.all([
                    apiGet('/api/v1/me'),
                    apiGet('/api/v1/dashboard'),
                ]);

                if (!cancelled) {
                    setState({ loading: false, error: null, user: me.user, dashboard });
                }
            } catch (error) {
                if (!cancelled) {
                    setState({ loading: false, error: error.message, user: null, dashboard: null });
                }
            }
        }

        loadDashboard();

        return () => {
            cancelled = true;
        };
    }, []);

    if (state.loading) {
        return <LoadingCard />;
    }

    if (state.error) {
        return <ErrorCard message={state.error} />;
    }

    return (
        <DashboardContent
            user={state.user}
            stats={state.dashboard.stats}
            latestUploads={state.dashboard.latest_uploads || []}
        />
    );
}

function normalizePrincipalSidebar() {
    const nav = document.querySelector('.sidebar .nav');
    if (!nav) return;

    const teacherLinks = Array.from(nav.querySelectorAll('a')).filter((link) => {
        const href = link.getAttribute('href') || '';
        return href.includes('/teachers') || href.includes('/teacher-evidence');
    });

    if (!teacherLinks.length) return;

    const hasSettings = Array.from(nav.querySelectorAll('a')).some((link) => (link.getAttribute('href') || '').includes('/settings'));

    if (!hasSettings) {
        const settings = document.createElement('a');
        settings.href = '/settings';
        settings.textContent = 'الإعدادات';
        teacherLinks[0].before(settings);
    }

    teacherLinks.forEach((link) => link.remove());
}

function getIconForTab(label, href) {
    if (href.includes('settings') || label.includes('الإعدادات')) return '⚙️';
    if (href.includes('teacher-evidence')) return '📂';
    if (href.includes('teachers')) return '👥';
    if (href.includes('evidence')) return '✅';
    if (href.includes('dashboard')) return '🏠';
    if (label.includes('الرئيسية')) return '🏠';
    if (label.includes('المعلمات')) return '👥';
    if (label.includes('ملفات')) return '📂';
    if (label.includes('معايير')) return '✅';
    return '•';
}

function isActiveTab(href) {
    const currentPath = window.location.pathname.replace(/\/$/, '') || '/';
    const linkPath = new URL(href, window.location.origin).pathname.replace(/\/$/, '') || '/';

    if (linkPath === '/dashboard') {
        return currentPath === '/dashboard' || currentPath === '/';
    }

    return currentPath === linkPath || currentPath.startsWith(`${linkPath}/`);
}

function readTabsFromSidebar() {
    normalizePrincipalSidebar();

    return Array.from(document.querySelectorAll('.sidebar .nav a'))
        .map((link) => ({
            label: link.textContent.trim(),
            href: link.href,
            icon: getIconForTab(link.textContent.trim(), link.href),
            active: isActiveTab(link.href),
        }))
        .filter((tab) => tab.label && tab.href)
        .slice(0, 4);
}

function BottomTabs({ tabs }) {
    if (!tabs.length) return null;

    return (
        <nav className="react-bottom-tabs" aria-label="تبويب التنقل السفلي">
            {tabs.map((tab) => (
                <a key={tab.href} className={`react-bottom-tab ${tab.active ? 'active' : ''}`} href={tab.href}>
                    <span className="react-bottom-tab-icon">{tab.icon}</span>
                    <span className="react-bottom-tab-label">{tab.label}</span>
                </a>
            ))}
        </nav>
    );
}

function injectBottomTabsStyle() {
    if (document.getElementById('react-bottom-tabs-style')) return;

    const style = document.createElement('style');
    style.id = 'react-bottom-tabs-style';
    style.textContent = `
        .react-bottom-tabs {
            position: fixed;
            left: 50%;
            bottom: max(12px, env(safe-area-inset-bottom));
            transform: translateX(-50%);
            z-index: 9999;
            width: min(560px, calc(100% - 24px));
            min-height: 72px;
            padding: 8px;
            display: grid;
            grid-template-columns: repeat(var(--tabs-count, 4), minmax(0, 1fr));
            gap: 6px;
            background: rgba(15, 23, 42, .88);
            border: 1px solid rgba(255, 255, 255, .14);
            border-radius: 26px;
            box-shadow: 0 18px 45px rgba(15, 23, 42, .24);
            backdrop-filter: blur(18px);
            direction: rtl;
        }
        .react-bottom-tab {
            min-width: 0;
            display: grid;
            place-items: center;
            gap: 4px;
            padding: 8px 6px;
            border-radius: 20px;
            color: #cbd5e1;
            text-decoration: none;
            font-family: Tahoma, Arial, sans-serif;
            font-size: 11px;
            line-height: 1.2;
            transition: .18s ease;
        }
        .react-bottom-tab:hover,
        .react-bottom-tab.active {
            background: #ffffff;
            color: #0f172a;
            transform: translateY(-2px);
        }
        .react-bottom-tab-icon {
            font-size: 21px;
            line-height: 1;
        }
        .react-bottom-tab-label {
            width: 100%;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            text-align: center;
            font-weight: 800;
        }
        body { padding-bottom: 94px; }
        @media (min-width: 981px) {
            .react-bottom-tabs { display: none; }
            body { padding-bottom: 0; }
        }
    `;
    document.head.appendChild(style);
}

function mountBottomTabs() {
    const tabs = readTabsFromSidebar();
    if (!tabs.length || document.getElementById('react-bottom-tabs-root')) return;

    injectBottomTabsStyle();

    const rootElement = document.createElement('div');
    rootElement.id = 'react-bottom-tabs-root';
    rootElement.style.setProperty('--tabs-count', String(tabs.length));
    document.body.appendChild(rootElement);
    createRoot(rootElement).render(<BottomTabs tabs={tabs} />);
}

function mountReactApps() {
    normalizePrincipalSidebar();

    document.querySelectorAll('[data-react-app="dashboard"]').forEach((element) => {
        createRoot(element).render(<DashboardApp />);
    });

    mountBottomTabs();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountReactApps);
} else {
    mountReactApps();
}

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js').catch(() => {});
    });
}
