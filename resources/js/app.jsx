import React from 'react';
import { createRoot } from 'react-dom/client';

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
                    <div className="muted">{upload.evidence_title || 'بدون معيار'}</div>
                    {isPrincipal && <div className="teacher-chip">{upload.teacher_name || 'معلمة غير محددة'}</div>}
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

function DashboardApp({ data }) {
    const { user, stats, latestUploads, urls } = data;
    const isPrincipal = user.role === 'principal';

    const actions = [
        {
            title: 'معايير التقييم',
            description: 'عرض ورفع الملفات على المعايير',
            icon: '✅',
            href: urls.evidence,
        },
        ...(isPrincipal ? [
            {
                title: 'متابعة المعلمات',
                description: 'اختيار معلمة ثم معيار ثم الملفات',
                icon: '👩‍🏫',
                href: urls.teacherEvidence,
            },
            {
                title: 'إدارة المعلمات',
                description: 'إضافة وتعديل حسابات المعلمات',
                icon: '👥',
                href: urls.teachers,
            },
        ] : []),
    ];

    return (
        <div className="react-dashboard">
            <section className="hero-card">
                <div>
                    <span className="hero-kicker">تطبيق Amal</span>
                    <h1>مرحبًا {user.name}</h1>
                    <p>{isPrincipal ? 'لوحة متابعة ملفات ومعايير تقييم المعلمات.' : 'لوحة رفع ومتابعة ملفات معايير التقييم الخاصة بك.'}</p>
                </div>
                <div className="hero-badge">{isPrincipal ? 'مديرة' : 'معلمة'}</div>
            </section>

            <div className="app-stats-grid">
                {isPrincipal && <StatCard label="المعلمات" value={stats.teachersCount} icon="👩‍🏫" tone="purple" />}
                <StatCard label="معايير التقييم" value={stats.evidenceCount} icon="✅" tone="blue" />
                <StatCard label={isPrincipal ? 'إجمالي الملفات' : 'ملفاتي'} value={stats.uploadsCount} icon="📁" tone="green" />
            </div>

            <section className="card app-section-card">
                <div className="section-heading">
                    <div>
                        <h3>اختصارات سريعة</h3>
                        <p className="muted">الوصول لأهم شاشات التطبيق بلمسة واحدة.</p>
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

function mountReactApps() {
    document.querySelectorAll('[data-react-app="dashboard"]').forEach((element) => {
        const data = JSON.parse(element.dataset.props || '{}');
        createRoot(element).render(<DashboardApp data={data} />);
    });
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
