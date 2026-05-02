import React, { useEffect, useState } from 'react';
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

    if (state.loading) return <LoadingCard />;
    if (state.error) return <ErrorCard message={state.error} />;

    return (
        <div className="react-settings">
            <section className="hero-card">
                <div>
                    <span className="hero-kicker">React + API</span>
                    <h1>الإعدادات</h1>
                    <p>كل روابط الإدارة الخاصة بالمديرة من شاشة واحدة.</p>
                </div>
                <div className="hero-badge">⚙️</div>
            </section>

            {state.sections.map((section) => (
                <section className="card" key={section.title}>
                    <h3>{section.title}</h3>
                    <p className="muted">تم جلب هذه الروابط من API.</p>
                    <div className="app-actions-grid">
                        {(section.items || []).map((item) => (
                            <a className="app-action-card" href={item.url} key={item.title}>
                                <span className="app-action-icon">{item.title.includes('متابعة') ? '📂' : '👥'}</span>
                                <span className="app-action-text">
                                    <strong>{item.title}</strong>
                                    <small>{item.title.includes('متابعة') ? 'عرض ملفات كل معلمة حسب المعيار.' : 'إضافة وتعديل وحذف حسابات المعلمات.'}</small>
                                </span>
                            </a>
                        ))}
                    </div>
                </section>
            ))}
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

            <TeacherForm
                editingTeacher={editingTeacher}
                onCancel={() => setEditingTeacher(null)}
                onSaved={handleSaved}
            />

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
