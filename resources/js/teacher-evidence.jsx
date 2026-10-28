import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Icon, PageHeading, CollectionToolbar, LoadingCard, ErrorCard, NoResults, matches, number } from './ui';

async function apiGet(url) {
    const response = await fetch(url, {
        headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        credentials: 'same-origin',
    });

    if (!response.ok) throw new Error(`API request failed: ${response.status}`);
    return response.json();
}

function TeacherEvidenceIndexApp() {
    const [state, setState] = useState({ loading: true, error: null, teachers: [] });
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState('all');

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

    const teachers = state.teachers.filter(teacher => matches(query, teacher.name, teacher.username) && (filter === 'all' || (filter === 'uploaded' ? Number(teacher.uploads_count) > 0 : !Number(teacher.uploads_count))));
    return (
        <div className="react-teacher-evidence-index">
            <PageHeading title="متابعة المعلمات" description="اطّلعي على رحلة الإنجاز لكل معلمة. اختاري الاسم لاستعراض معايير التقييم والشواهد المرتبطة بها." icon="users" />

            <section className="card">
                <div className="section-heading"><h2>شواهد فريق المدرسة <span className="section-count">{number(state.teachers.length)}</span></h2></div>
                <CollectionToolbar query={query} onQuery={setQuery} placeholder="ابحثي عن المعلمة..." count={teachers.length}><select aria-label="تصفية المعلمات حسب الملفات" value={filter} onChange={event => setFilter(event.target.value)}><option value="all">جميع المعلمات</option><option value="uploaded">لديهن ملفات</option><option value="empty">لم يرفعن ملفات</option></select></CollectionToolbar>
                {teachers.length ? (
                    <div className="uploads-list">
                        {teachers.map((teacher) => (
                            <div className="upload-card" key={teacher.id}>
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
                                    <a className="btn" href={`/teacher-evidence/${teacher.id}`}>عرض المعايير</a>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : state.teachers.length ? <NoResults onReset={() => { setQuery(''); setFilter('all'); }} /> : (
                    <div className="empty-state">
                        <div className="empty-icon"><Icon name="users" size={30} /></div>
                        <strong>لا توجد معلمات حتى الآن</strong>
                    </div>
                )}
            </section>
        </div>
    );
}

function TeacherCriteriaApp({ teacherId }) {
    const [state, setState] = useState({ loading: true, error: null, teacher: null, items: [] });
    const [query, setQuery] = useState('');

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
            <PageHeading title={state.teacher?.name} description="معايير التقييم وشواهد الإنجاز الخاصة بالمعلمة." icon="check" back={{ href: '/teacher-evidence', label: 'متابعة المعلمات' }} />

            <section className="card">
                <div className="actions" style={{ marginBottom: 14 }}>
                    <a className="btn gray" href="/teacher-evidence">رجوع للمعلمات</a>
                </div>

                <h3>معايير المعلمة</h3>
                <CollectionToolbar query={query} onQuery={setQuery} placeholder="ابحثي عن معيار..." count={state.items.filter(item => matches(query, item.title, item.description)).length} />
                {state.items.filter(item => matches(query, item.title, item.description)).length ? (
                    <div className="uploads-list">
                        {state.items.filter(item => matches(query, item.title, item.description)).map((item) => (
                            <div className="upload-card" key={item.id}>
                                <div className="upload-card-main">
                                    <div className="upload-file-icon"><Icon name="check" /></div>
                                    <div>
                                        <strong>{item.title}</strong>
                                        <div className="muted">{item.description || 'لا يوجد وصف.'}</div>
                                        <div className="teacher-chip">ملفات هذه المعلمة: {number(item.teacher_uploads_count)}</div>
                                    </div>
                                </div>
                                <div className="upload-card-footer">
                                    <span>{item.created_at || ''}</span>
                                    <a className="btn" href={`/teacher-evidence/${state.teacher.id}/evidence/${item.id}`}>عرض ملفات المعلمة</a>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : state.items.length ? <NoResults onReset={() => setQuery('')} /> : (
                    <div className="empty-state">
                        <div className="empty-icon"><Icon name="check" size={30} /></div>
                        <strong>لا توجد معايير تقييم حتى الآن</strong>
                    </div>
                )}
            </section>
        </div>
    );
}

function TeacherUploadsApp({ teacherId, evidenceId }) {
    const [state, setState] = useState({ loading: true, error: null, teacher: null, item: null, uploads: [] });
    const [query, setQuery] = useState('');

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
            <PageHeading title={state.item?.title} description={'شواهد المعلمة: ' + state.teacher?.name} icon="folder" back={{ href: '/teacher-evidence/' + state.teacher.id, label: 'معايير المعلمة' }} />

            <section className="card">
                <div className="actions" style={{ marginBottom: 14 }}>
                    <a className="btn gray" href={`/teacher-evidence/${state.teacher.id}`}>رجوع للمعايير</a>
                    <a className="btn light" href="/teacher-evidence">رجوع للمعلمات</a>
                </div>

                <h3>الشواهد المرفوعة</h3>
                <CollectionToolbar query={query} onQuery={setQuery} placeholder="ابحثي في ملفات المعلمة..." count={state.uploads.filter(upload => matches(query, upload.title, upload.notes)).length} />
                {state.uploads.filter(upload => matches(query, upload.title, upload.notes)).length ? (
                    <div className="uploads-list">
                        {state.uploads.filter(upload => matches(query, upload.title, upload.notes)).map((upload) => (
                            <div className="upload-card" key={upload.id}>
                                <div className="upload-card-main">
                                    <div className="upload-file-icon"><Icon name="file" /></div>
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
                ) : state.uploads.length ? <NoResults onReset={() => setQuery('')} /> : (
                    <div className="empty-state">
                        <div className="empty-icon"><Icon name="folder" size={30} /></div>
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

