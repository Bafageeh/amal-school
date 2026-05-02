import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';

function getCookie(name) {
    return document.cookie
        .split('; ')
        .find((row) => row.startsWith(`${name}=`))
        ?.split('=')[1];
}

function csrfHeaders() {
    const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    const xsrf = getCookie('XSRF-TOKEN');

    return {
        ...(token ? { 'X-CSRF-TOKEN': token } : {}),
        ...(xsrf ? { 'X-XSRF-TOKEN': decodeURIComponent(xsrf) } : {}),
    };
}

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

async function apiDelete(url) {
    const response = await fetch(url, {
        method: 'DELETE',
        headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            ...csrfHeaders(),
        },
        credentials: 'same-origin',
    });

    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || `API request failed: ${response.status}`);
    }

    return response.json();
}

async function apiPostForm(url, formData) {
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            ...csrfHeaders(),
        },
        credentials: 'same-origin',
        body: formData,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        const firstError = data.errors ? Object.values(data.errors).flat()[0] : null;
        throw new Error(firstError || data.message || `API request failed: ${response.status}`);
    }

    return data;
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

function UploadRow({ upload, isPrincipal, onDelete }) {
    return (
        <div className="upload-card">
            <div className="upload-card-main">
                <div className="upload-file-icon">📎</div>
                <div>
                    <strong>{upload.title}</strong>
                    <div className="muted">{upload.notes || 'لا توجد ملاحظات.'}</div>
                    {isPrincipal && <div className="teacher-chip">{upload.uploader?.name || 'معلمة غير محددة'}</div>}
                </div>
            </div>
            <div className="upload-card-footer">
                <span>{upload.created_at}</span>
                <div className="actions">
                    <a className="btn light" href={upload.download_url}>تحميل</a>
                    <button className="btn red" type="button" onClick={() => onDelete(upload)}>حذف</button>
                </div>
            </div>
        </div>
    );
}

function EvidenceUploadForm({ evidenceId, onUploaded }) {
    const [title, setTitle] = useState('');
    const [notes, setNotes] = useState('');
    const [files, setFiles] = useState([]);
    const [status, setStatus] = useState({ loading: false, error: null, success: null });

    async function submit(event) {
        event.preventDefault();

        if (!files.length) {
            setStatus({ loading: false, error: 'يرجى اختيار ملف واحد على الأقل.', success: null });
            return;
        }

        const formData = new FormData();
        if (title.trim()) formData.append('title', title.trim());
        if (notes.trim()) formData.append('notes', notes.trim());
        files.forEach((file) => formData.append('files[]', file));

        setStatus({ loading: true, error: null, success: null });

        try {
            const data = await apiPostForm(`/api/v1/evidence/${evidenceId}/uploads`, formData);
            setTitle('');
            setNotes('');
            setFiles([]);
            event.target.reset();
            setStatus({ loading: false, error: null, success: data.message || 'تم رفع الملفات بنجاح' });
            onUploaded(data.uploads || []);
        } catch (error) {
            setStatus({ loading: false, error: error.message, success: null });
        }
    }

    return (
        <section className="card">
            <h3>رفع ملفات على معيار التقييم هذا</h3>
            {status.error && <div className="alert error">{status.error}</div>}
            {status.success && <div className="alert success">{status.success}</div>}

            <form onSubmit={submit}>
                <label>
                    عنوان الملفات
                    <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="اختياري" />
                </label>

                <label>
                    ملاحظات
                    <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows="3" placeholder="اختياري" />
                </label>

                <label>
                    الملفات
                    <input type="file" multiple required onChange={(event) => setFiles(Array.from(event.target.files || []))} />
                    <small className="muted">يمكن اختيار أكثر من ملف دفعة واحدة.</small>
                </label>

                <div className="actions">
                    <button className="btn green" type="submit" disabled={status.loading}>
                        {status.loading ? 'جاري الرفع...' : 'رفع الملفات'}
                    </button>
                    <a className="btn gray" href="/evidence">رجوع</a>
                </div>
            </form>
        </section>
    );
}

function EvidenceShowApp({ evidenceId }) {
    const [state, setState] = useState({ loading: true, error: null, user: null, item: null, uploads: [] });
    const isPrincipal = useMemo(() => state.user?.role === 'principal', [state.user]);

    async function load() {
        try {
            const [me, evidence] = await Promise.all([
                apiGet('/api/v1/me'),
                apiGet(`/api/v1/evidence/${evidenceId}`),
            ]);

            setState({ loading: false, error: null, user: me.user, item: evidence.item, uploads: evidence.uploads || [] });
        } catch (error) {
            setState({ loading: false, error: error.message, user: null, item: null, uploads: [] });
        }
    }

    useEffect(() => {
        load();
    }, [evidenceId]);

    function handleUploaded(newUploads) {
        setState((current) => ({ ...current, uploads: [...newUploads, ...current.uploads] }));
    }

    async function handleDelete(upload) {
        if (!confirm('حذف الملف؟')) return;

        try {
            await apiDelete(`/api/v1/uploads/${upload.id}`);
            setState((current) => ({
                ...current,
                uploads: current.uploads.filter((item) => item.id !== upload.id),
            }));
        } catch (error) {
            alert(error.message);
        }
    }

    if (state.loading) return <LoadingCard />;
    if (state.error) return <ErrorCard message={state.error} />;

    return (
        <div className="react-evidence-show">
            <section className="hero-card">
                <div>
                    <span className="hero-kicker">React + API</span>
                    <h1>{state.item.title}</h1>
                    <p>{state.item.description || 'لا يوجد وصف لهذا المعيار.'}</p>
                </div>
                <div className="hero-badge">✅</div>
            </section>

            <EvidenceUploadForm evidenceId={state.item.id} onUploaded={handleUploaded} />

            <section className="card">
                <h3>{isPrincipal ? 'الملفات المرفوعة' : 'ملفاتي على معيار التقييم هذا'}</h3>
                {state.uploads.length ? (
                    <div className="uploads-list">
                        {state.uploads.map((upload) => (
                            <UploadRow key={upload.id} upload={upload} isPrincipal={isPrincipal} onDelete={handleDelete} />
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <div className="empty-icon">📂</div>
                        <strong>لا توجد ملفات مرفوعة حتى الآن</strong>
                    </div>
                )}
            </section>
        </div>
    );
}

function mountEvidenceShow() {
    document.querySelectorAll('[data-react-app="evidence-show"]').forEach((element) => {
        const evidenceId = element.dataset.evidenceId;
        if (evidenceId) {
            createRoot(element).render(<EvidenceShowApp evidenceId={evidenceId} />);
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountEvidenceShow);
} else {
    mountEvidenceShow();
}
