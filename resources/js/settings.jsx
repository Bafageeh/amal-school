import React, { useEffect, useMemo, useState } from 'react';
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
        { title: 'إدخال المعايير', description: 'إضافة معيار تقييم جديد.', icon: 'plus', tone: 'green', url: '/evidence/create' },
        { title: 'قائمة المعايير', description: 'عرض وتعديل وفتح الملفات.', icon: 'check', tone: 'blue', url: '/evidence' },
    ];

    const settingsItems = [
        { title: 'إدارة المعايير', description: 'إنشاء وتعديل وحذف معايير التقييم.', icon: 'settings', tone: 'blue', url: '/evidence' },
        { title: teachersLink.title || 'إدارة المعلمات', description: 'إضافة وتعديل بيانات المعلمات وإدارتها.', icon: 'users', tone: 'purple', url: teachersLink.url || '/teachers' },
        { title: 'متابعة ملفات المعلمات', description: 'عرض ملفات كل معلمة حسب المعيار.', icon: 'folder', tone: 'amber', url: '/teacher-evidence' },
    ];

    if (state.loading) return <LoadingCard />;
    if (state.error) return <ErrorCard message={state.error} />;

    return (
        <div className="react-settings-native">

            <PageHeading title="إدارة المدرسة" description="كل ما تحتاجينه لتنظيم المعايير، وإدارة الحسابات، ومتابعة الشواهد في مكان واحد." icon="settings" />

            <div className="settings-section-title">إجراءات سريعة</div>
            <section className="quick-settings-grid">
                {quickActions.map((action) => (
                    <a className="quick-settings-card" href={action.url} key={action.title}>
                        <span className={`settings-icon ${action.tone}`}><Icon name={action.icon} /></span>
                        <span>
                            <strong>{action.title}</strong>
                            <span>{action.description}</span>
                        </span>
                    </a>
                ))}
            </section>

            <section className="settings-info-card">
                <span className="settings-pill">فريق واحد، وأثر متكامل</span>
                <h2>إدارة المدرسة</h2>
                <p>رتّبي معايير التقييم، وتابعي شواهد المعلمات، وامنحي كل إنجاز المساحة التي يستحقها.</p>
            </section>

            <div className="settings-section-title">خيارات الإعدادات</div>
            <section className="settings-list">
                {settingsItems.map((item) => (
                    <a className="settings-list-item" href={item.url} key={item.title}>
                        <span className={`settings-icon ${item.tone}`}><Icon name={item.icon} /></span>
                        <span className="settings-list-text">
                            <strong>{item.title}</strong>
                            <span>{item.description}</span>
                        </span>
                        <span className="settings-chevron"><Icon name="arrow" size={19} /></span>
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
        <section className="card teacher-form-panel" id="teacher-form">
            <h3>{editingTeacher ? 'تعديل بيانات المعلمة' : 'إضافة معلمة'}</h3>
            <p className="muted">الرقم السري اختياري، ويجب أن يتكون من ٤ خانات عند إدخاله. عند التعديل، اتركيه فارغًا للإبقاء على الرقم الحالي.</p>

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
                    {onCancel && <button className="btn gray" type="button" onClick={onCancel}>إلغاء</button>}
                </div>
            </form>
        </section>
    );
}

function TeacherCard({ teacher, onEdit, onDelete }) {
    return (
        <div className="upload-card">
            <div className="upload-card-main">
                <div className="upload-file-icon teacher-avatar" aria-hidden="true">{teacher.name?.trim().charAt(0)}</div>
                <div>
                    <strong>{teacher.name}</strong>
                    <div className="muted">اسم المستخدم: {teacher.username}</div>
                    <div className="teacher-chip"><Icon name="folder" size={12} />{number(teacher.uploads_count)} ملف مرفوع</div>
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
    const [showForm, setShowForm] = useState(false);
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState('all');
    const [notice, setNotice] = useState('');

    useEffect(() => {
        if (showForm) document.querySelector('#teacher-form input')?.focus();
    }, [showForm, editingTeacher]);

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
        setShowForm(false);
        setNotice(wasEditing ? 'تم تحديث بيانات المعلمة بنجاح.' : 'تم إنشاء حساب المعلمة بنجاح.');
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

    const teachers = state.teachers.filter(teacher => matches(query, teacher.name, teacher.username) && (filter === 'all' || (filter === 'uploaded' ? Number(teacher.uploads_count) > 0 : !Number(teacher.uploads_count))));
    const cancelForm = () => { setEditingTeacher(null); setShowForm(false); };
    const editTeacher = (teacher) => { setEditingTeacher(teacher); setShowForm(true); };
    return (
        <div className="react-teachers">
            <PageHeading title="إدارة المعلمات" description="فريق يصنع الأثر. أديري حسابات المعلمات وبياناتهن بخطوات واضحة." icon="users" back={{ href: '/settings', label: 'إدارة المدرسة' }}>
                <button className="btn" type="button" onClick={() => { setEditingTeacher(null); setShowForm(true); }}><Icon name="plus" size={16} />إضافة معلمة</button>
            </PageHeading>
            {notice && <div className="alert success" role="status">{notice}</div>}
            {showForm && <TeacherForm editingTeacher={editingTeacher} onCancel={cancelForm} onSaved={handleSaved} />}
            <section className="card">
                <div className="section-heading"><h2>فريق المدرسة <span className="section-count">{number(state.teachers.length)}</span></h2><a className="section-link" href="/teacher-evidence">متابعة الشواهد <Icon name="arrow" size={15} /></a></div>
                <CollectionToolbar query={query} onQuery={setQuery} placeholder="ابحثي باسم المعلمة أو اسم المستخدم..." count={teachers.length}><select aria-label="تصفية المعلمات حسب الملفات" value={filter} onChange={event => setFilter(event.target.value)}><option value="all">جميع المعلمات</option><option value="uploaded">لديهن ملفات</option><option value="empty">لم يرفعن ملفات</option></select></CollectionToolbar>
                {teachers.length ? <div className="uploads-list">{teachers.map(teacher => <TeacherCard key={teacher.id} teacher={teacher} onEdit={editTeacher} onDelete={handleDelete} />)}</div> : state.teachers.length ? <NoResults onReset={() => { setQuery(''); setFilter('all'); }} /> : <div className="empty-state"><span className="empty-icon"><Icon name="users" size={30} /></span><strong>لا توجد معلمات حتى الآن</strong><span>أضيفي أول حساب ليبدأ فريق المدرسة توثيق إنجازاته.</span></div>}
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

