import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

async function apiGet(url) {
    const response = await fetch(url, {
        headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        credentials: 'same-origin',
    });

    if (!response.ok) throw new Error(`API request failed: ${response.status}`);
    return response.json();
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

function TeacherEvidenceIndexApp() {
    const [state, setState] = useState({ loading: true, error: null, teachers: [] });

    useEffect(() => {
        let cancelled = false;

        async function loadTeachers() {
            try {
                const data = await apiGet('/api/v1/teacher-evidence');
                if (!cancelled) setState({ loading: false, error: null, teachers: data.teachers || [] });
            } catch (error) {
                if (!cancelled) setState({ loading: false, error: error.message, teachers: [] });
            }
        }

        loadTeachers();
        return () => { cancelled = true; };
    }, []);

    if (state.loading) return <LoadingCard />;
    if (state.error) return <ErrorCard message={state.error} />;

    return (
        <div className="react-teacher-evidence-index">
            <section className="hero-card">
                <div>
                    <span className="hero-kicker">React + API</span>
                    <h1>متابعة ملفات المعلمات</h1>
                    <p>اختاري المعلمة لعرض معايير التقييم ثم ملفاتها داخل كل معيار.</p>
                </div>
                <div className="hero-badge">📂</div>
            </section>

            <section className="card">
                <h3>المعلمات</h3>
                {state.teachers.length ? (
                    <div className="uploads-list">
                        {state.teachers.map((teacher) => (
                            <div className="upload-card" key={teacher.id}>
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
                                    <a className="btn" href={`/teacher-evidence/${teacher.id}`}>عرض المعايير</a>
                                </div>
                            </div>
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

function TeacherCriteriaApp({ teacherId }) {
    const [state, setState] = useState({ loading: true, error: null, teacher: null, items: [] });

    useEffect(() => {
        let cancelled = false;

        async function loadCriteria() {
            try {
                const data = await apiGet(`/api/v1/teacher-evidence/${teacherId}`);
                if (!cancelled) setState({ loading: false, error: null, teacher: data.teacher, items: data.items || [] });
            } catch (error) {
                if (!cancelled) setState({ loading: false, error: error.message, teacher: null, items: [] });
            }
        }

        loadCriteria();
        return () => { cancelled = true; };
    }, [teacherId]);

    if (state.loading) return <LoadingCard />;
    if (state.error) return <ErrorCard message={state.error} />;

    return (
        <div className="react-teacher-criteria">
            <section className="hero-card">
                <div>
                    <span className="hero-kicker">React + API</span>
                    <h1>معايير المعلمة</h1>
                    <p>{state.teacher?.name} — اضغطي على أي معيار لعرض ملفات هذه المعلمة فقط.</p>
                </div>
                <div className="hero-badge">✅</div>
            </section>

            <section className="card">
                <div className="actions" style={{ marginBottom: 14 }}>
                    <a className="btn gray" href="/teacher-evidence">رجوع للمعلمات</a>
                </div>

                <h3>المعايير</h3>
                {state.items.length ? (
                    <div className="uploads-list">
                        {state.items.map((item) => (
                            <div className="upload-card" key={item.id}>
                                <div className="upload-card-main">
                                    <div className="upload-file-icon">✅</div>
                                    <div>
                                        <strong>{item.title}</strong>
                                        <div className="muted">{item.description || 'لا يوجد وصف.'}</div>
                                        <div className="teacher-chip">ملفات هذه المعلمة: {item.teacher_uploads_count ?? 0}</div>
                                    </div>
                                </div>
                                <div className="upload-card-footer">
                                    <span>{item.created_at || ''}</span>
                                    <a className="btn" href={`/teacher-evidence/${state.teacher.id}/evidence/${item.id}`}>عرض ملفات المعلمة</a>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <div className="empty-icon">✅</div>
                        <strong>لا توجد معايير تقييم حتى الآن</strong>
                    </div>
                )}
            </section>
        </div>
    );
}

function TeacherUploadsApp({ teacherId, evidenceId }) {
    const [state, setState] = useState({ loading: true, error: null, teacher: null, item: null, uploads: [] });

    useEffect(() => {
        let cancelled = false;

        async function loadUploads() {
            try {
                const data = await apiGet(`/api/v1/teacher-evidence/${teacherId}/evidence/${evidenceId}`);
                if (!cancelled) setState({ loading: false, error: null, teacher: data.teacher, item: data.item, uploads: data.uploads || [] });
            } catch (error) {
                if (!cancelled) setState({ loading: false, error: error.message, teacher: null, item: null, uploads: [] });
            }
        }

        loadUploads();
        return () => { cancelled = true; };
    }, [teacherId, evidenceId]);

    if (state.loading) return <LoadingCard />;
    if (state.error) return <ErrorCard message={state.error} />;

    return (
        <div className="react-teacher-uploads">
            <section className="hero-card">
                <div>
                    <span className="hero-kicker">React + API</span>
                    <h1>ملفات المعلمة</h1>
                    <p>{state.teacher?.name} — المعيار: {state.item?.title}</p>
                </div>
                <div className="hero-badge">📎</div>
            </section>

            <section className="card">
                <div className="actions" style={{ marginBottom: 14 }}>
                    <a className="btn gray" href={`/teacher-evidence/${state.teacher.id}`}>رجوع للمعايير</a>
                    <a className="btn light" href="/teacher-evidence">رجوع للمعلمات</a>
                </div>

                <h3>الملفات المرفوعة في هذا المعيار لهذه المعلمة فقط</h3>
                {state.uploads.length ? (
                    <div className="uploads-list">
                        {state.uploads.map((upload) => (
                            <div className="upload-card" key={upload.id}>
                                <div className="upload-card-main">
                                    <div className="upload-file-icon">📎</div>
                                    <div>
                                        <strong>{upload.title}</strong>
                                        <div className="muted">{upload.notes || 'لا توجد ملاحظات.'}</div>
                                        <div className="teacher-chip">{upload.file_type || 'ملف'}</div>
                                    </div>
                                </div>
                                <div className="upload-card-footer">
                                    <span>{upload.created_at}</span>
                                    <a className="btn light" href={upload.download_url}>تحميل</a>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <div className="empty-icon">📂</div>
                        <strong>لا توجد ملفات مرفوعة من هذه المعلمة على هذا المعيار</strong>
                    </div>
                )}
            </section>
        </div>
    );
}

function mountTeacherEvidenceScreens() {
    document.querySelectorAll('[data-react-app="teacher-evidence-index"]').forEach((element) => {
        createRoot(element).render(<TeacherEvidenceIndexApp />);
    });

    document.querySelectorAll('[data-react-app="teacher-evidence-criteria"]').forEach((element) => {
        const teacherId = element.dataset.teacherId;
        if (teacherId) createRoot(element).render(<TeacherCriteriaApp teacherId={teacherId} />);
    });

    document.querySelectorAll('[data-react-app="teacher-evidence-uploads"]').forEach((element) => {
        const teacherId = element.dataset.teacherId;
        const evidenceId = element.dataset.evidenceId;
        if (teacherId && evidenceId) createRoot(element).render(<TeacherUploadsApp teacherId={teacherId} evidenceId={evidenceId} />);
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountTeacherEvidenceScreens);
} else {
    mountTeacherEvidenceScreens();
}
