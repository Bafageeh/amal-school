import React from 'react';
import { createRoot } from 'react-dom/client';

function StatCard({ label, value }) {
    return (
        <div className="stat">
            <div>{label}</div>
            <div className="num">{value}</div>
        </div>
    );
}

function LatestUploads({ uploads, isPrincipal }) {
    if (!uploads.length) {
        return <p className="muted">لا توجد ملفات مرفوعة حتى الآن.</p>;
    }

    return (
        <table>
            <thead>
                <tr>
                    <th>الملف</th>
                    <th>معيار التقييم</th>
                    {isPrincipal && <th>المعلمة</th>}
                    <th>التاريخ</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                {uploads.map((upload) => (
                    <tr key={upload.id}>
                        <td>{upload.title}</td>
                        <td>{upload.evidence_title || '-'}</td>
                        {isPrincipal && <td>{upload.teacher_name || '-'}</td>}
                        <td>{upload.created_at}</td>
                        <td>
                            <a className="btn light" href={upload.download_url}>تحميل</a>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

function DashboardApp({ data }) {
    const { user, stats, latestUploads } = data;
    const isPrincipal = user.role === 'principal';

    return (
        <>
            <div className="grid">
                {isPrincipal && <StatCard label="عدد المعلمات" value={stats.teachersCount} />}
                <StatCard label="عدد معايير التقييم" value={stats.evidenceCount} />
                <StatCard label={isPrincipal ? 'إجمالي الملفات المرفوعة' : 'ملفاتي المرفوعة'} value={stats.uploadsCount} />
            </div>

            <div className="card">
                <h3>آخر الملفات المرفوعة</h3>
                <LatestUploads uploads={latestUploads} isPrincipal={isPrincipal} />
            </div>
        </>
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
