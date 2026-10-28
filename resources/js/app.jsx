import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Icon, PageHeading, CollectionToolbar, LoadingCard, ErrorCard, NoResults, matches, number } from './ui';

async function apiGet(url) {
    const response = await fetch(url, { headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' }, credentials: 'same-origin' });
    if (!response.ok) throw new Error(`تعذر الاتصال بالخادم (${response.status})`);
    return response.json();
}

function StatCard({ label, value, icon, tone = 'purple' }) {
    return <div className={`app-stat app-stat-${tone}`}><span className="app-stat-icon"><Icon name={icon} size={24} /></span><div><div className="app-stat-label">{label}</div><div className="app-stat-value">{number(value)}</div></div></div>;
}

function DashboardApp() {
    const [state, setState] = useState({ loading: true, error: null, user: null, dashboard: null });
    useEffect(() => {
        let cancelled = false;
        Promise.all([apiGet('/api/v1/me'), apiGet('/api/v1/dashboard')])
            .then(([me, dashboard]) => { if (!cancelled) setState({ loading: false, error: null, user: me.user, dashboard }); })
            .catch(error => { if (!cancelled) setState(current => ({ ...current, loading: false, error: error.message })); });
        return () => { cancelled = true; };
    }, []);
    if (state.loading) return <LoadingCard />;
    if (state.error) return <ErrorCard message={state.error} />;
    const isPrincipal = state.user.role === 'principal';
    const { stats, latest_uploads: uploads = [] } = state.dashboard;
    const actions = [
        { title: isPrincipal ? 'معايير التقييم' : 'معايير تقييمي', description: isPrincipal ? 'تصفّحي معايير المدرسة.' : 'ارفعي شاهدًا لكل مؤشر من مؤشرات أدائك.', icon: 'check', href: isPrincipal ? '/evidence' : '/my-assessment' },
        ...(isPrincipal ? [
            { title: 'متابعة المعلمات', description: 'اطّلعي على شواهد كل معلمة.', icon: 'users', href: '/teacher-evidence' },
            { title: 'إدارة المدرسة', description: 'الحسابات، المعايير، والإعدادات.', icon: 'settings', href: '/settings' },
        ] : []),
    ];
    return <div className="react-dashboard">
        <section aria-label="نظرة عامة" className="app-stats-grid">
            {isPrincipal && <StatCard label="المعلمات" value={stats.teachers_count} icon="users" />}
            <StatCard label="معايير التقييم" value={stats.evidence_count} icon="check" tone="blue" />
            {!isPrincipal && <StatCard label="ملفاتي المرفوعة" value={stats.uploads_count} icon="folder" tone="green" />}
        </section>
        <section className="card app-section-card">
            <div className="section-heading"><div><h2>من أين تودّين البدء؟</h2><p>خطوة أقرب إلى إنجازك القادم.</p></div></div>
            <div className="app-actions-grid">{actions.map(action => <a className="app-action-card" href={action.href} key={action.href}><span className="app-action-icon"><Icon name={action.icon} /></span><span className="app-action-text"><strong>{action.title}</strong><small>{action.description}</small></span><Icon name="arrow" size={17} className="action-arrow" /></a>)}</div>
        </section>
        <section className="card app-section-card">
            <div className="section-heading"><div><h2>آخر الشواهد المرفوعة</h2><p>إنجازات موثّقة، وأثر يبقى.</p></div><a className="section-link" href="/evidence">تصفّح المعايير <Icon name="arrow" size={15} /></a></div>
            {uploads.length ? <div className="uploads-list">{uploads.map(upload => <article className="upload-card" key={upload.id}>
                <div className="upload-card-main"><span className="upload-file-icon"><Icon name="file" /></span><div><strong>{upload.title}</strong><p className="muted">{upload.evidence?.title || 'بدون معيار'}</p>{isPrincipal && <span className="teacher-chip">{upload.uploader?.name || 'معلمة غير محددة'}</span>}</div></div>
                <div className="upload-card-footer"><span className="upload-date"><Icon name="clock" size={13} />{upload.created_at}</span><a className="btn light" href={upload.download_url}><Icon name="download" size={14} />تحميل الملف</a></div>
            </article>)}</div> : <div className="empty-state"><span className="empty-icon"><Icon name="folder" size={30} /></span><strong>بانتظار أول إنجاز موثّق</strong><span>ستظهر أحدث الشواهد هنا بعد رفعها على المعايير.</span><a className="btn light" href="/evidence">استعراض المعايير</a></div>}
        </section>
    </div>;
}

function EvidenceIndexApp() {
    const [state, setState] = useState({ loading: true, error: null, user: null, items: [] });
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState('all');
    useEffect(() => {
        let cancelled = false;
        Promise.all([apiGet('/api/v1/me'), apiGet('/api/v1/evidence')])
            .then(([me, evidence]) => { if (!cancelled) setState({ loading: false, error: null, user: me.user, items: evidence.items || [] }); })
            .catch(error => { if (!cancelled) setState(current => ({ ...current, loading: false, error: error.message })); });
        return () => { cancelled = true; };
    }, []);
    if (state.loading) return <LoadingCard />;
    if (state.error) return <ErrorCard message={state.error} />;
    const isPrincipal = state.user?.role === 'principal';
    const items = state.items.filter(item => matches(query, item.title, item.description) && (filter === 'all' || (filter === 'uploaded' ? Number(item.uploads_count) > 0 : !Number(item.uploads_count))));
    const reset = () => { setQuery(''); setFilter('all'); };
    return <div className="react-evidence-index">
        <PageHeading title="معايير التقييم" description="معايير واضحة، وشواهد تعكس إنجازك. اختاري المعيار للاطّلاع على ملفاته أو رفع شواهد جديدة." icon="check">
            {isPrincipal && <a className="btn" href="/evidence/create"><Icon name="plus" size={16} />إضافة معيار</a>}
        </PageHeading>
        <section className="card app-section-card">
            <div className="section-heading"><h2>جميع المعايير <span className="section-count">{number(state.items.length)}</span></h2><span className="muted">من التنظيم إلى التميّز</span></div>
            <CollectionToolbar query={query} onQuery={setQuery} placeholder="ابحثي عن معيار التقييم..." count={items.length}><select aria-label="تصفية حسب الملفات" value={filter} onChange={event => setFilter(event.target.value)}><option value="all">جميع المعايير</option><option value="uploaded">تحتوي على ملفات</option><option value="empty">بانتظار الملفات</option></select></CollectionToolbar>
            {items.length ? <div className="uploads-list">{items.map(item => <a className="upload-card criteria-card" href={`/evidence/${item.id}`} key={item.id}>
                <div className="upload-card-main"><span className="upload-file-icon"><Icon name="check" /></span><div><strong>{item.title}</strong><p className="muted card-description">{item.description || 'أضيفي شواهدك المرتبطة بهذا المعيار.'}</p><span className="teacher-chip"><Icon name="folder" size={12} />{number(item.uploads_count)} ملف مرفوع</span></div></div>
                <div className="upload-card-footer"><span>{item.created_at || ''}</span><span className="section-link">استعراض المعيار <Icon name="arrow" size={15} /></span></div>
            </a>)}</div> : state.items.length ? <NoResults onReset={reset} /> : <div className="empty-state"><span className="empty-icon"><Icon name="check" size={30} /></span><strong>لا توجد معايير تقييم حتى الآن</strong><span>{isPrincipal ? 'ابدئي بإضافة معيار التقييم الأول.' : 'ستظهر المعايير بعد إضافتها من مديرة المدرسة.'}</span>{isPrincipal && <a className="btn" href="/evidence/create">إضافة أول معيار</a>}</div>}
        </section>
    </div>;
}

function mountReactApps() {
    document.querySelectorAll('[data-react-app="dashboard"]').forEach(element => createRoot(element).render(<DashboardApp />));
    document.querySelectorAll('[data-react-app="evidence-index"]').forEach(element => createRoot(element).render(<EvidenceIndexApp />));
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountReactApps);
else mountReactApps();
if ('serviceWorker' in navigator) window.addEventListener('load', () => { navigator.serviceWorker.register('/service-worker.js').catch(() => {}); });
