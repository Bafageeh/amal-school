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

    if (!response.ok) throw new Error(`API request failed: ${response.status}`);
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

function fileKind(upload) {
    const type = upload.file_type || '';
    if (type === 'application/pdf') return { label: 'PDF', icon: 'PDF', tone: 'pdf' };
    if (type.startsWith('image/')) return { label: 'صورة', icon: 'IMG', tone: 'image' };
    if (type.startsWith('video/')) return { label: 'فيديو', icon: '▶', tone: 'video' };
    if (type.startsWith('audio/')) return { label: 'صوت', icon: '♪', tone: 'audio' };
    if (type.includes('word') || type.includes('document')) return { label: 'مستند', icon: 'DOC', tone: 'doc' };
    if (type.includes('excel') || type.includes('spreadsheet')) return { label: 'جدول', icon: 'XLS', tone: 'sheet' };
    if (type.includes('presentation') || type.includes('powerpoint')) return { label: 'عرض', icon: 'PPT', tone: 'slide' };
    return { label: 'ملف', icon: 'FILE', tone: 'file' };
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

function UploadPreviewModal({ upload, onClose, onDelete }) {
    if (!upload) return null;

    const type = upload.file_type || '';
    const url = previewUrl(upload);
    const kind = fileKind(upload);
    const previewable = canPreview(upload);

    return (
        <div className="file-preview-backdrop" onClick={onClose}>
            <div className="file-preview-modal" onClick={(event) => event.stopPropagation()}>
                <div className="file-preview-grabber" />
                <div className="file-preview-header">
                    <button type="button" className="file-preview-close" onClick={onClose}>×</button>
                    <strong>عرض الملف</strong>
                    <a className="file-preview-more" href={upload.download_url}>⬇</a>
                </div>

                <div className="file-preview-file-row">
                    <div className={`native-file-icon ${kind.tone}`}>{kind.icon}</div>
                    <div>
                        <strong>{upload.title}</strong>
                        <span>{kind.label} • عرض بدون تحميل</span>
                    </div>
                </div>

                <div className="file-preview-body">
                    {previewable && type.startsWith('image/') && <img src={url} alt={upload.title} />}
                    {previewable && type === 'application/pdf' && <iframe title={upload.title} src={url} />}
                    {previewable && type.startsWith('video/') && <video src={url} controls playsInline />}
                    {previewable && type.startsWith('audio/') && <audio src={url} controls />}
                    {previewable && type.startsWith('text/') && <iframe title={upload.title} src={url} />}
                    {!previewable && (
                        <div className="file-preview-empty">
                            <div className={`native-file-icon ${kind.tone}`}>{kind.icon}</div>
                            <strong>لا يمكن عرض هذا النوع داخل المتصفح</strong>
                            <span>يمكنك تحميل الملف إذا رغبت في فتحه من تطبيق آخر.</span>
                        </div>
                    )}
                </div>

                <div className="file-preview-actions">
                    <a className="btn light" href={upload.download_url}>تحميل على الجوال</a>
                    <button className="btn red" type="button" onClick={() => onDelete(upload)}>حذف الملف</button>
                </div>
            </div>
        </div>
    );
}

function UploadRow({ upload, isPrincipal, onPreview }) {
    const kind = fileKind(upload);

    return (
        <div className="upload-card native-upload-card" role="button" tabIndex="0" onClick={() => onPreview(upload)} onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onPreview(upload);
            }
        }}>
            <div className="upload-card-main native-upload-main">
                <div className={`native-file-icon ${kind.tone}`}>{kind.icon}</div>
                <div className="native-upload-info">
                    <strong>{upload.title}</strong>
                    <div className="muted">{kind.label}{upload.notes ? ` • ${upload.notes}` : ' • اضغطي لعرض الملف'}</div>
                    {isPrincipal && <div className="teacher-chip">{upload.uploader?.name || 'معلمة غير محددة'}</div>}
                </div>
            </div>
            <div className="upload-card-footer native-upload-footer">
                <span>{upload.created_at}</span>
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
                @media (max-width: 980px) {
                    .react-evidence-show .uploads-list { gap: 12px !important; }
                    .react-evidence-show .native-upload-card { min-height: auto !important; padding: 16px !important; border-radius: 24px !important; background: #fff !important; border: 1px solid #e5e7eb !important; box-shadow: 0 10px 22px rgba(15,23,42,.06) !important; cursor: pointer; touch-action: manipulation; }
                    .react-evidence-show .native-upload-card:active { transform: scale(.992); }
                    .react-evidence-show .native-upload-main { display: flex !important; flex-direction: row !important; align-items: flex-start !important; gap: 14px !important; direction: ltr !important; }
                    .native-upload-info { width: 100%; min-width: 0; text-align: right; direction: rtl; }
                    .react-evidence-show .native-upload-info strong { display: block !important; color: #0f172a !important; font-size: 19px !important; line-height: 1.35 !important; font-weight: 950 !important; text-align: right !important; }
                    .react-evidence-show .native-upload-info .muted { margin-top: 5px !important; color: #64748b !important; font-size: 13px !important; line-height: 1.5 !important; text-align: right !important; }
                    .react-evidence-show .native-upload-footer { margin-top: 12px !important; padding-top: 10px !important; border-top: 1px solid #eef2f7 !important; display: flex !important; justify-content: flex-end !important; }
                    .react-evidence-show .native-upload-footer span { color: #64748b !important; font-size: 12.5px !important; font-weight: 700 !important; direction: ltr !important; }
                    .react-evidence-show .native-upload-footer span::after { content: ' ◷'; color: #94a3b8; }
                }
                .native-file-icon { width: 62px; height: 62px; min-width: 62px; display: grid; place-items: center; border-radius: 20px; font-weight: 950; font-size: 15px; letter-spacing: -.5px; }
                .native-file-icon.pdf { background: #fee2e2; color: #dc2626; }
                .native-file-icon.image { background: #eaf7ee; color: #22a66f; }
                .native-file-icon.video { background: #f1edff; color: #5b45ce; font-size: 24px; }
                .native-file-icon.audio { background: #fff7ed; color: #ea580c; font-size: 24px; }
                .native-file-icon.doc, .native-file-icon.file { background: #eef4ff; color: #2563eb; }
                .native-file-icon.sheet { background: #ecfdf5; color: #16a34a; }
                .native-file-icon.slide { background: #fef3c7; color: #d97706; }
                .file-preview-backdrop { position: fixed; inset: 0; z-index: 100000; display: flex; align-items: flex-end; justify-content: center; background: rgba(15,23,42,.55); direction: rtl; }
                .file-preview-modal { width: 100%; max-width: 720px; max-height: 90vh; display: flex; flex-direction: column; overflow: hidden; border-radius: 30px 30px 0 0; background: #fff; box-shadow: 0 -22px 70px rgba(15,23,42,.32); }
                .file-preview-grabber { width: 52px; height: 6px; margin: 10px auto 0; border-radius: 999px; background: #d1d5db; }
                .file-preview-header { display: grid; grid-template-columns: 44px 1fr 44px; align-items: center; gap: 10px; padding: 12px 16px; }
                .file-preview-header strong { text-align: center; color: #0f172a; font-size: 20px; font-weight: 950; }
                .file-preview-close, .file-preview-more { width: 42px; height: 42px; display: grid; place-items: center; border: 0; border-radius: 999px; background: #f1f5f9; color: #0f172a; font-size: 26px; line-height: 1; cursor: pointer; text-decoration: none; }
                .file-preview-more { font-size: 19px; color: #2563eb; }
                .file-preview-file-row { margin: 0 16px 12px; padding: 12px; display: flex; gap: 12px; align-items: center; flex-direction: row-reverse; border: 1px solid #e5e7eb; border-radius: 18px; background: #fff; }
                .file-preview-file-row > div:last-child { min-width: 0; width: 100%; text-align: right; }
                .file-preview-file-row strong { display: block; color: #0f172a; font-size: 16px; line-height: 1.35; font-weight: 950; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                .file-preview-file-row span { display: block; margin-top: 4px; color: #64748b; font-size: 12px; }
                .file-preview-body { min-height: 350px; max-height: 58vh; display: grid; place-items: center; overflow: auto; background: #f8fafc; border-top: 1px solid #eef2f7; border-bottom: 1px solid #eef2f7; }
                .file-preview-body iframe, .file-preview-body video, .file-preview-body img { width: 100%; height: 58vh; max-height: 58vh; border: 0; object-fit: contain; background: #f8fafc; }
                .file-preview-body audio { width: calc(100% - 28px); }
                .file-preview-empty { display: grid; place-items: center; gap: 10px; padding: 28px; text-align: center; color: #64748b; }
                .file-preview-empty strong { color: #0f172a; font-size: 18px; }
                .file-preview-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 12px 16px 18px; background: #fff; }
                @media (min-width: 981px) { .file-preview-backdrop { align-items: center; padding: 18px; } .file-preview-modal { border-radius: 30px; } }
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
                            <UploadRow key={upload.id} upload={upload} isPrincipal={isPrincipal} onPreview={setPreviewUpload} />
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <div className="empty-icon">📂</div>
                        <strong>لا توجد ملفات مرفوعة حتى الآن</strong>
                    </div>
                )}
            </section>

            <UploadPreviewModal upload={previewUpload} onClose={() => setPreviewUpload(null)} onDelete={handleDelete} />
        </div>
    );
}

function mountEvidenceShow() {
    document.querySelectorAll('[data-react-app="evidence-show"]').forEach((element) => {
        const evidenceId = element.dataset.evidenceId;
        if (evidenceId) createRoot(element).render(<EvidenceShowApp evidenceId={evidenceId} />);
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountEvidenceShow);
} else {
    mountEvidenceShow();
}
