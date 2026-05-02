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
        headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        credentials: 'same-origin',
    });

    if (!response.ok) throw new Error(`API request failed: ${response.status}`);
    return response.json();
}

async function apiJson(url, method, payload = {}) {
    const response = await fetch(url, {
        method,
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            ...csrfHeaders(),
        },
        credentials: 'same-origin',
        body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        const firstError = data.errors ? Object.values(data.errors).flat()[0] : null;
        throw new Error(firstError || data.message || `API request failed: ${response.status}`);
    }

    return data;
}

async function apiDelete(url) {
    const response = await fetch(url, {
        method: 'DELETE',
        headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest', ...csrfHeaders() },
        credentials: 'same-origin',
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || `API request failed: ${response.status}`);
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
            <strong>تعذر تحميل البيانات من API.</strong>
            <div>{message}</div>
        </div>
    );
}

const settingsStyles = `
@media (max-width: 980px) {
    body { background: #f6f8fc !important; }
    .page { background: linear-gradient(180deg, #f7fbff 0%, #eef5ff 44%, #f8fbff 100%) !important; padding: 18px 18px 128px !important; }
    .content { max-width: 560px !important; }
    .react-settings-native { display: grid; gap: 18px; direction: rtl; }
    .react-settings-native .settings-hero { padding: 10px 2px 2px; text-align: right; }
    .react-settings-native .settings-hero h1 { margin: 0; color: #0f172a; font-size: 38px; line-height: 1.2; font-weight: 950; letter-spacing: -1px; }
    .react-settings-native .settings-hero p { margin: 10px 0 0; color: #64748b; font-size: 15px; line-height: 1.8; }
    .settings-section-title { margin: 6px 2px 0; color: #0f172a; font-size: 20px; font-weight: 950; text-align: right; }
    .quick-settings-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .quick-settings-card { min-height: 126px; padding: 17px; display: flex; flex-direction: row-reverse; align-items: center; gap: 13px; border-radius: 26px; background: rgba(255,255,255,.96); border: 1px solid #e5eaf2; box-shadow: 0 14px 30px rgba(15,23,42,.06); color: inherit; text-decoration: none; }
    .quick-settings-card:active, .settings-list-item:active { transform: scale(.992); }
    .settings-icon { width: 58px; height: 58px; min-width: 58px; display: grid; place-items: center; border-radius: 19px; background: #eef4ff; color: #2563eb; font-size: 26px; font-weight: 950; }
    .settings-icon.green { background: #edf8e9; color: #2f9e44; }
    .settings-icon.purple { background: #f1edff; color: #5b45ce; }
    .settings-icon.amber { background: #fff7ed; color: #d97706; }
    .quick-settings-card strong { display: block; color: #0f172a; font-size: 18px; line-height: 1.4; font-weight: 950; text-align: right; }
    .quick-settings-card span, .settings-list-text span { display: block; margin-top: 5px; color: #64748b; font-size: 12.5px; line-height: 1.55; text-align: right; }
    .settings-list { display: grid; gap: 10px; }
    .settings-list-item { min-height: 86px; padding: 14px 15px; display: flex; flex-direction: row-reverse; align-items: center; gap: 13px; border-radius: 24px; background: rgba(255,255,255,.96); border: 1px solid #e5eaf2; box-shadow: 0 12px 26px rgba(15,23,42,.05); color: inherit; text-decoration: none; }
    .settings-list-text { flex: 1; min-width: 0; text-align: right; }
    .settings-list-text strong { display: block; color: #0f172a; font-size: 18px; line-height: 1.35; font-weight: 950; }
    .settings-chevron { width: 34px; height: 34px; min-width: 34px; display: grid; place-items: center; border-radius: 999px; color: #94a3b8; font-size: 30px; line-height: 1; }
    .settings-info-card { position: relative; overflow: hidden; min-height: 150px; padding: 22px; border-radius: 30px; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 44%, #101827 100%); color: #fff; box-shadow: 0 18px 38px rgba(37,99,235,.22); }
    .settings-info-card::before { content: ''; position: absolute; width: 180px; height: 180px; left: -70px; bottom: -80px; border-radius: 999px; background: rgba(255,255,255,.10); }
    .settings-info-card::after { content: ''; position: absolute; width: 160px; height: 160px; right: -60px; top: -70px; border-radius: 999px; background: rgba(255,255,255,.12); }
    .settings-info-card > * { position: relative; z-index: 1; }
    .settings-info-card .settings-pill { display: inline-flex; padding: 8px 13px; border-radius: 999px; background: rgba(255,255,255,.16); color: #eaf2ff; font-size: 12px; font-weight: 950; }
    .settings-info-card h2 { margin: 18px 0 8px; color: #fff; font-size: 30px; line-height: 1.25; font-weight: 950; }
    .settings-info-card p { margin: 0; color: #dbeafe; font-size: 14px; line-height: 1.8; }
    .settings-empty-note { padding: 16px; border-radius: 22px; background: #fff; color: #64748b; border: 1px dashed #cbd5e1; text-align: center; }
}
@media (min-width: 981px) {
    .react-settings-native { display: grid; gap: 18px; }
    .quick-settings-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
    .settings-list { display: grid; gap: 10px; }
    .quick-settings-card, .settings-list-item { display: flex; align-items: center; gap: 14px; padding: 18px; border-radius: 22px; background: #fff; border: 1px solid #e5e7eb; color: inherit; text-decoration: none; }
    .settings-icon { width: 52px; height: 52px; display: grid; place-items: center; border-radius: 18px; background: #eef4ff; font-size: 24px; }
    .settings-chevron { margin-inline-start: auto; color: #94a3b8; font-size: 26px; }
}
`;

function SettingsApp() {
    const [state, setState] = useState({ loading: true, error: null, sections: [] });

    useEffect(() => {
        let cancelled = false;

        async function loadSettings() {
            try {
                const data = await apiGet('/api/v1/settings');
                if (!cancelled) setState({ loading: false, error: null, sections: data.sections || [] });
            } catch (error) {
                if (!cancelled) setState({ loading: false, error: error.message, sections: [] });
            }
        }

        loadSettings();
        return () => { cancelled = true; };
    }, []);

    const apiItems = useMemo(() => state.sections.flatMap((section) => section.items || []), [state.sections]);
    const teachersLink = apiItems.find((item) => item.url?.includes('/teachers')) || { title: 'إدارة المعلمات', url: '/teachers' };

    const quickActions = [
        { title: 'إدخال المعايير', description: 'إضافة معيار تقييم جديد.', icon: '✅', tone: 'green', url: '/evidence/create' },
        { title: 'قائمة المعايير', description: 'عرض وتعديل وفتح الملفات.', icon: '📋', tone: 'blue', url: '/evidence' },
    ];

    const settingsItems = [
        { title: 'إدارة المعايير', description: 'إنشاء وتعديل وحذف معايير التقييم.', icon: '⚙️', tone: 'blue', url: '/evidence' },
        { title: teachersLink.title || 'إدارة المعلمات', description: 'إضافة وتعديل بيانات المعلمات وإدارتها.', icon: '👥', tone: 'purple', url: teachersLink.url || '/teachers' },
        { title: 'متابعة ملفات المعلمات', description: 'عرض ملفات كل معلمة حسب المعيار.', icon: '📂', tone: 'amber', url: '/teacher-evidence' },
    ];

    if (state.loading) return <LoadingCard />;
    if (state.error) return <ErrorCard message={state.error} />;

    return (
        <div className="react-settings-native">
            <style>{settingsStyles}</style>

            <section className="settings-hero">
                <h1>الإعدادات</h1>
                <p>مركز التحكم لإدارة إعدادات المدرسة وروابط المديرة بسهولة.</p>
            </section>

            <div className="settings-section-title">إجراءات سريعة</div>
            <section className="quick-settings-grid">
                {quickActions.map((action) => (
                    <a className="quick-settings-card" href={action.url} key={action.title}>
                        <span className={`settings-icon ${action.tone}`}>{action.icon}</span>
                        <span>
                            <strong>{action.title}</strong>
                            <span>{action.description}</span>
                        </span>
                    </a>
                ))}
            </section>

            <section className="settings-info-card">
                <span className="settings-pill">Native Experience</span>
                <h2>إدارة المدرسة</h2>
                <p>كل ما تحتاجه المديرة لإدارة المعايير، المعلمات، ومتابعة الملفات من مكان واحد.</p>
            </section>

            <div className="settings-section-title">خيارات الإعدادات</div>
            <section className="settings-list">
                {settingsItems.map((item) => (
                    <a className="settings-list-item" href={item.url} key={item.title}>
                        <span className={`settings-icon ${item.tone}`}>{item.icon}</span>
                        <span className="settings-list-text">
                            <strong>{item.title}</strong>
                            <span>{item.description}</span>
                        </span>
                        <span className="settings-chevron">‹</span>
                    </a>
                ))}
            </section>
        </div>
    );
}

const emptyForm = { name: '', username: '', password: '' };

function TeacherForm({ editingTeacher, onCancel, onSaved }) {
    const [form, setForm] = useState(editingTeacher ? {
        name: editingTeacher.name || '',
        username: editingTeacher.username || '',
        password: '',
    } : emptyForm);
    const [status, setStatus] = useState({ loading: false, error: null, success: null });

    useEffect(() => {
        setForm(editingTeacher ? {
            name: editingTeacher.name || '',
            username: editingTeacher.username || '',
            password: '',
        } : emptyForm);
        setStatus({ loading: false, error: null, success: null });
    }, [editingTeacher]);

    function updateField(field, value) {
        setForm((current) => ({ ...current, [field]: value }));
    }

    async function submit(event) {
        event.preventDefault();
        setStatus({ loading: true, error: null, success: null });

        const payload = {
            name: form.name.trim(),
            username: form.username.trim(),
        };

        if (form.password.trim()) payload.password = form.password.trim();

        try {
            const data = editingTeacher
                ? await apiJson(`/api/v1/teachers/${editingTeacher.id}`, 'PUT', payload)
                : await apiJson('/api/v1/teachers', 'POST', payload);

            setStatus({ loading: false, error: null, success: data.message || 'تم الحفظ بنجاح' });
            setForm(emptyForm);
            onSaved(data.teacher, Boolean(editingTeacher));
        } catch (error) {
            setStatus({ loading: false, error: error.message, success: null });
        }
    }

    return (
        <section className="card">
            <h3>{editingTeacher ? 'تعديل بيانات المعلمة' : 'إضافة معلمة'}</h3>
            <p className="muted">يمكن ترك الرقم السري فارغًا. عند أول دخول بدون رقم سري سيطلب النظام تعيين رقم سري جديد من 4 خانات.</p>

            {status.error && <div className="alert error">{status.error}</div>}
            {status.success && <div className="alert success">{status.success}</div>}

            <form onSubmit={submit}>
                <div className="grid">
                    <label>
                        اسم المعلمة
                        <input value={form.name} onChange={(event) => updateField('name', event.target.value)} required />
                    </label>
                    <label>
                        اسم المستخدم
                        <input value={form.username} onChange={(event) => updateField('username', event.target.value)} required />
                    </label>
                    <label>
                        الرقم السري - اختياري
                        <input value={form.password} onChange={(event) => updateField('password', event.target.value)} minLength="4" maxLength="4" inputMode="numeric" placeholder="اتركيه فارغًا لأول دخول" />
                    </label>
                </div>

                <div className="actions">
                    <button className="btn green" type="submit" disabled={status.loading}>
                        {status.loading ? 'جاري الحفظ...' : editingTeacher ? 'حفظ التعديل' : 'إنشاء الحساب'}
                    </button>
                    {editingTeacher && <button className="btn gray" type="button" onClick={onCancel}>إلغاء التعديل</button>}
                </div>
            </form>
        </section>
    );
}

function TeacherCard({ teacher, onEdit, onDelete }) {
    return (
        <div className="upload-card">
            <div className="upload-card-main">
                <div className="upload-file-icon">👩‍🏫</div>
                <div>
                    <strong>{teacher.name}</strong>
                    <div className="muted">اسم المستخدم: {teacher.username}</div>
                    <div className="teacher-chip">عدد الملفات: {teacher.uploads_count ?? 0}</div>
                </div>
            </div>
            <div className="upload-card-footer">
                <span>{teacher.created_at || ''}</span>
                <div className="actions">
                    <button className="btn light" type="button" onClick={() => onEdit(teacher)}>تعديل</button>
                    <button className="btn red" type="button" onClick={() => onDelete(teacher)}>حذف</button>
                </div>
            </div>
        </div>
    );
}

function TeachersApp() {
    const [state, setState] = useState({ loading: true, error: null, teachers: [] });
    const [editingTeacher, setEditingTeacher] = useState(null);

    async function loadTeachers() {
        try {
            const data = await apiGet('/api/v1/teachers');
            setState({ loading: false, error: null, teachers: data.teachers || [] });
        } catch (error) {
            setState({ loading: false, error: error.message, teachers: [] });
        }
    }

    useEffect(() => {
        loadTeachers();
    }, []);

    function handleSaved(teacher, wasEditing) {
        setState((current) => ({
            ...current,
            teachers: wasEditing
                ? current.teachers.map((item) => item.id === teacher.id ? teacher : item)
                : [teacher, ...current.teachers],
        }));
        setEditingTeacher(null);
    }

    async function handleDelete(teacher) {
        if (!confirm('حذف حساب المعلمة؟')) return;

        try {
            await apiDelete(`/api/v1/teachers/${teacher.id}`);
            setState((current) => ({
                ...current,
                teachers: current.teachers.filter((item) => item.id !== teacher.id),
            }));
        } catch (error) {
            alert(error.message);
        }
    }

    if (state.loading) return <LoadingCard />;
    if (state.error) return <ErrorCard message={state.error} />;

    return (
        <div className="react-teachers">
            <section className="hero-card">
                <div>
                    <span className="hero-kicker">React + API</span>
                    <h1>المعلمات</h1>
                    <p>إدارة حسابات المعلمات مباشرة من React عبر Laravel API.</p>
                </div>
                <div className="hero-badge">👥</div>
            </section>

            <TeacherForm editingTeacher={editingTeacher} onCancel={() => setEditingTeacher(null)} onSaved={handleSaved} />

            <section className="card">
                <h3>قائمة المعلمات</h3>
                {state.teachers.length ? (
                    <div className="uploads-list">
                        {state.teachers.map((teacher) => (
                            <TeacherCard key={teacher.id} teacher={teacher} onEdit={setEditingTeacher} onDelete={handleDelete} />
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <div className="empty-icon">👥</div>
                        <strong>لا توجد معلمات حتى الآن</strong>
                    </div>
                )}
            </section>
        </div>
    );
}

function mountReactSettingsScreens() {
    document.querySelectorAll('[data-react-app="settings-index"]').forEach((element) => {
        createRoot(element).render(<SettingsApp />);
    });

    document.querySelectorAll('[data-react-app="teachers-index"]').forEach((element) => {
        createRoot(element).render(<TeachersApp />);
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountReactSettingsScreens);
} else {
    mountReactSettingsScreens();
}
