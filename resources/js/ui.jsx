import React from 'react';

const paths = {
    home: 'm3 10 9-7 9 7M5 9v12h5v-7h4v7h5V9',
    check: 'M9 3h6m-7 2H5v16h14V5h-3M8 12l3 3 5-6',
    users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
    folder: 'M3 7V5a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z',
    file: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Zm0 0v6h6M8 13h8m-8 4h5',
    settings: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm-2-6h4l.6 3 2.4 1.4 2.9-.9 2 3.5-2.3 2v2l2.3 2-2 3.5-2.9-.9-2.4 1.4-.6 3h-4l-.6-3L7 17.6l-2.9.9-2-3.5 2.3-2v-2L2.1 9l2-3.5 2.9.9L9.4 5Z',
    search: 'm21 21-4.4-4.4M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
    arrow: 'm14 6-6 6 6 6M8 12h13',
    plus: 'M12 5v14M5 12h14',
    download: 'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5',
    upload: 'M12 16V4m-5 5 5-5 5 5M4 16v5h16v-5',
    edit: 'm16 3 5 5-12 12-6 1 1-6ZM14 5l5 5',
    close: 'm6 6 12 12M6 18 18 6',
    clock: 'M12 7v5l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
    sparkles: 'm12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5ZM20 2v4m-2-2h4',
    logout: 'M9 3H4v18h5m5-14 5 5-5 5m-6-5h13',
};

export function Icon({ name = 'file', size = 22, ...props }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d={paths[name] || paths.file} /></svg>;
}

export const number = (value) => new Intl.NumberFormat('ar-SA').format(value ?? 0);
export const normalize = (value) => String(value ?? '').toLowerCase().normalize('NFKD').replace(/[\u064B-\u065F\u0670ـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي');
export const matches = (query, ...values) => normalize(values.join(' ')).includes(normalize(query.trim()));

export function PageHeading({ title, description, icon = 'folder', children, back }) {
    return <header className="page-heading">
        <div className="page-heading-copy">
            {back && <a className="back-link" href={back.href}><Icon name="arrow" size={16} />{back.label}</a>}
            <span className="eyebrow">منصة التميز المدرسي</span>
            <h1>{title}</h1><p>{description}</p>
        </div>
        <div className="heading-actions">{children}<span className="page-heading-icon"><Icon name={icon} size={30} /></span></div>
    </header>;
}

export function CollectionToolbar({ query, onQuery, placeholder = 'بحث...', count, children }) {
    return <div className="collection-toolbar">
        <div className="search-field"><Icon name="search" size={20} /><input type="search" aria-label={placeholder} placeholder={placeholder} value={query} onChange={(event) => onQuery(event.target.value)} /></div>
        {children}<span className="result-count" role="status">{number(count)} نتيجة</span>
    </div>;
}

export function LoadingCard() {
    return <div className="empty-state loading-state" role="status"><span className="loading-spinner" /><strong>جارٍ تحميل البيانات</strong><span>لحظات وتصبح مساحتك جاهزة.</span></div>;
}

export function ErrorCard({ message }) {
    return <div className="alert error" role="alert"><strong>تعذر تحميل البيانات</strong><p>تحققي من الاتصال ثم حاولي مرة أخرى.</p><small>{message}</small><button type="button" className="btn light" onClick={() => window.location.reload()}>إعادة المحاولة</button></div>;
}

export function NoResults({ onReset }) {
    return <div className="empty-state"><span className="empty-icon"><Icon name="search" size={30} /></span><strong>لا توجد نتائج مطابقة</strong><span>جرّبي اسمًا آخر أو غيّري خيارات التصفية.</span><button className="btn light" type="button" onClick={onReset}>مسح البحث والتصفية</button></div>;
}
