import React, { useEffect, useMemo, useState, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { Icon, PageHeading, CollectionToolbar, LoadingCard, ErrorCard, NoResults, matches, number } from './ui';

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

function UploadPreviewModal({ upload, onClose, onDelete }) {
    const modalRef = useRef(null);
    const closeRef = useRef(onClose);
    closeRef.current = onClose;
    useEffect(() => {
        if (!upload) return;
        const opener = document.activeElement;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        modalRef.current?.querySelector('button')?.focus();
        function onKey(event) {
            if (event.key === 'Escape') closeRef.current();
            if (event.key !== 'Tab') return;
            const controls = modalRef.current?.querySelectorAll('button:not([disabled]), a[href], iframe, video[controls], audio[controls]');
            if (!controls?.length) return;
            const first = controls[0], last = controls[controls.length - 1];
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        }
        document.addEventListener('keydown', onKey);
        return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', onKey); opener?.focus(); };
    }, [upload]);
    if (!upload) return null;

    const type = upload.file_type || '';
    const url = previewUrl(upload);
    const kind = fileKind(upload);
    const previewable = canPreview(upload);

    return (
        <div className="file-preview-backdrop" onClick={onClose}>
            <div className="file-preview-modal" role="dialog" aria-modal="true" aria-label={"معاينة الملف: " + upload.title} ref={modalRef} onClick={(event) => event.stopPropagation()}>
                <div className="file-preview-grabber" />
                <div className="file-preview-header">
                    <button type="button" className="file-preview-close" aria-label="إغلاق المعاينة" onClick={onClose}>×</button>
                    <strong>عرض الملف</strong>
                    <a className="file-preview-more" href={upload.download_url} aria-label="تحميل الملف"><Icon name="download" size={18} /></a>
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
            <h3>أضيفي شاهدًا جديدًا</h3><p className="muted">اختاري ملفاتك وأضيفي عنوانًا أو ملاحظات لتسهيل الرجوع إليها.</p>
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
                    <small className="muted">يمكن اختيار أكثر من ملف دفعة واحدة.</small>{files.length > 0 && <p className="form-note" role="status">تم اختيار {number(files.length)} ملف: {files.map(file => file.name).join("، ")}</p>}
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
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState('all');
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
    const filteredUploads = state.uploads.filter(upload => {
        const tone = fileKind(upload).tone;
        const correctType = filter === 'all' || (filter === 'other' ? !['pdf', 'image', 'doc'].includes(tone) : tone === filter);
        return correctType && matches(query, upload.title, upload.notes, upload.uploader?.name);
    });

    return (
        <div className="react-evidence-show">

            <PageHeading title={state.item.title} description={state.item.description || 'وثّقي إنجازك برفع الملفات والشواهد المرتبطة بهذا المعيار.'} icon="check" back={{ href: '/evidence', label: 'معايير التقييم' }}>
                {isPrincipal && <a className="btn light" href={'/evidence/' + state.item.id + '/edit'}><Icon name="edit" size={16} />تعديل المعيار</a>}
            </PageHeading>

            <EvidenceUploadForm evidenceId={state.item.id} onUploaded={handleUploaded} />

            <section className="card">
                <h3>{isPrincipal ? 'الملفات المرفوعة' : 'ملفاتي على معيار التقييم هذا'}</h3>
                <CollectionToolbar query={query} onQuery={setQuery} placeholder="ابحثي في الملفات أو اسم المعلمة..." count={filteredUploads.length}><select aria-label="نوع الملف" value={filter} onChange={event => setFilter(event.target.value)}><option value="all">جميع الملفات</option><option value="pdf">PDF</option><option value="image">صور</option><option value="doc">مستندات</option><option value="other">أنواع أخرى</option></select></CollectionToolbar>
                {filteredUploads.length ? (
                    <div className="uploads-list">
                        {filteredUploads.map((upload) => (
                            <UploadRow key={upload.id} upload={upload} isPrincipal={isPrincipal} onPreview={setPreviewUpload} />
                        ))}
                    </div>
                ) : state.uploads.length ? <NoResults onReset={() => { setQuery(''); setFilter('all'); }} /> : (
                    <div className="empty-state">
                        <div className="empty-icon"><Icon name="folder" size={30} /></div>
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

