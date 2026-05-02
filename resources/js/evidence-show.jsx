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

function previewUrl(upload) {
    return upload.download_url ? upload.download_url.replace(/\/download(\?.*)?$/, '/preview$1') : '#';
}

function canPreview(upload) {
    const type = upload.file_type || '';
    return type.startsWith('image/') || type === 'application/pdf' || type.startsWith('video/') || type.startsWith('audio/') || type.startsWith('text/');
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

function UploadPreviewModal({ upload, onClose }) {
    if (!upload) return null;

    const type = upload.file_type || '';
    const url = previewUrl(upload);
    const previewable = canPreview(upload);

    return (
        <div className="file-preview-backdrop" onClick={onClose}>
            <div className="file-preview-modal" onClick={(event) => event.stopPropagation()}>
                <div className="file-preview-header">
                    <div>
                        <strong>{upload.title}</strong>
                        <span>{upload.notes || 'عرض الملف بدون تحميله على الجوال'}</span>
                    </div>
                    <button type="button" className="file-preview-close" onClick={onClose}>×</button>
                </div>

                <div className="file-preview-body">
                    {previewable && type.startsWith('image/') && <img src={url} alt={upload.title} />}
                    {previewable && type === 'application/pdf' && <iframe title={upload.title} src={url} />}
                    {previewable && type.startsWith('video/') && <video src={url} controls playsInline />}
                    {previewable && type.startsWith('audio/') && <audio src={url} controls />}
                    {previewable && type.startsWith('text/') && <iframe title={upload.title} src={url} />}
                    {!previewable && (
                        <div className="file-preview-empty">
                            <div>📄</div>
                            <strong>لا يمكن عرض هذا النوع داخل المتصفح</strong>
                            <span>يمكنك تحميل الملف إذا رغبت في فتحه من تطبيق آخر.</span>
                        </div>
                    )}
                </div>

                <div className="file-preview-actions">
                    <a className="btn light" href={upload.download_url}>تحميل على الجوال</a>
                    <button className="btn gray" type="button" onClick={onClose}>إغلاق</button>
                </div>
            </div>
        </div>
    );
}

function UploadRow({ upload, isPrincipal, onDelete, onPreview }) {
    return (
        <div className="upload-card previewable-upload-card" role="button" tabIndex="0" onClick={() => onPreview(upload)} onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onPreview(upload);
            }
        }}>
            <div className="upload-card-main">
                <div className="upload-file-icon">📎</div>
                <div>
                    <strong>{upload.title}</strong>
                    <div className="muted">{upload.notes || 'اضغطي على البطاقة لعرض الملف.'}</div>
                    {isPrincipal && <div className="teacher-chip">{upload.uploader?.name || 'معلمة غير محددة'}</div>}
                </div>
            </div>
            <div className="upload-card-footer">
                <span>{upload.created_at}</span>
                <div className="actions" onClick={(event) => event.stopPropagation()}>
                    <button className="btn light" type="button" onClick={() => onPreview(upload)}>عرض</button>
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
    const [previewUpload, setPreviewUpload] = useState(null);
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
            setPreviewUpload(null);
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
            <style>{`
                .previewable-upload-card { cursor: pointer; touch-action: manipulation; }
                .previewable-upload-card:active { transform: scale(.995); }
                .file-preview-backdrop { position: fixed; inset: 0; z-index: 100000; display: flex; align-items: flex-end; justify-content: center; padding: 14px; background: rgba(15,23,42,.55); direction: rtl; }
                .file-preview-modal { width: min(720px, 100%); max-height: min(88vh, 820px); display: flex; flex-direction: column; overflow: hidden; border-radius: 28px; background: #fff; box-shadow: 0 24px 70px rgba(15,23,42,.35); }
                .file-preview-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding: 16px; border-bottom: 1px solid #eef2f7; }
                .file-preview-header strong { display: block; color: #0f172a; font-size: 17px; font-weight: 950; line-height: 1.45; }
                .file-preview-header span { display: block; margin-top: 3px; color: #64748b; font-size: 12px; line-height: 1.5; }
                .file-preview-close { width: 38px; height: 38px; border: 0; border-radius: 999px; background: #f1f5f9; color: #0f172a; font-size: 26px; line-height: 1; cursor: pointer; }
                .file-preview-body { min-height: 360px; max-height: 62vh; display: grid; place-items: center; overflow: auto; background: #f8fafc; }
                .file-preview-body iframe, .file-preview-body video, .file-preview-body img { width: 100%; height: 62vh; max-height: 62vh; border: 0; object-fit: contain; background: #f8fafc; }
                .file-preview-body audio { width: calc(100% - 28px); }
                .file-preview-empty { display: grid; place-items: center; gap: 8px; padding: 28px; text-align: center; color: #64748b; }
                .file-preview-empty div { font-size: 46px; }
                .file-preview-empty strong { color: #0f172a; font-size: 18px; }
                .file-preview-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 12px; border-top: 1px solid #eef2f7; background: #fff; }
                @media (min-width: 981px) { .file-preview-backdrop { align-items: center; } }
            `}</style>
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
                            <UploadRow key={upload.id} upload={upload} isPrincipal={isPrincipal} onDelete={handleDelete} onPreview={setPreviewUpload} />
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <div className="empty-icon">📂</div>
                        <strong>لا توجد ملفات مرفوعة حتى الآن</strong>
                    </div>
                )}
            </section>

            <UploadPreviewModal upload={previewUpload} onClose={() => setPreviewUpload(null)} />
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
