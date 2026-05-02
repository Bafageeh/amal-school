@extends('layouts.app')

@section('title', 'معايير التقييم')

@section('content')
<style>
@media (max-width: 980px) {
    body {
        background: #f6f7f9 !important;
    }

    .page {
        padding: 14px 14px 128px !important;
        background: #f6f7f9 !important;
    }

    .content {
        max-width: 520px !important;
    }

    .react-evidence-index {
        display: block !important;
        padding: 0 !important;
        margin: 0 !important;
    }

    .react-evidence-index > .hero-card,
    .react-evidence-index .section-heading {
        display: none !important;
    }

    .react-evidence-index .app-section-card {
        display: block !important;
        padding: 0 !important;
        margin: 0 !important;
        background: transparent !important;
        border: 0 !important;
        box-shadow: none !important;
    }

    .react-evidence-index .uploads-list {
        display: grid !important;
        gap: 16px !important;
        margin: 0 !important;
    }

    .react-evidence-index .upload-card {
        --native-accent: #25a875;
        --native-soft: #eaf7ee;
        --native-text: #16724f;
        position: relative !important;
        display: block !important;
        overflow: hidden !important;
        min-height: auto !important;
        margin: 0 !important;
        padding: 22px !important;
        border-radius: 28px !important;
        background: #ffffff !important;
        border: 1px solid rgba(224, 229, 235, .95) !important;
        box-shadow: 0 12px 26px rgba(15, 23, 42, .07) !important;
        cursor: pointer !important;
        touch-action: manipulation !important;
        transition: transform .12s ease, box-shadow .12s ease !important;
    }

    .react-evidence-index .upload-card:active {
        transform: scale(.992) !important;
        box-shadow: 0 8px 18px rgba(15, 23, 42, .06) !important;
    }

    .react-evidence-index .upload-card:nth-child(3n + 1) {
        --native-accent: #25a875;
        --native-soft: #eaf7ee;
        --native-text: #16724f;
    }

    .react-evidence-index .upload-card:nth-child(3n + 2) {
        --native-accent: #2f6be8;
        --native-soft: #eef4ff;
        --native-text: #1d4ed8;
    }

    .react-evidence-index .upload-card:nth-child(3n) {
        --native-accent: #6551cf;
        --native-soft: #f1edff;
        --native-text: #5740b6;
    }

    .react-evidence-index .upload-card::before,
    .react-evidence-index .upload-card::after,
    .react-evidence-index .upload-card-footer::before {
        display: none !important;
        content: none !important;
    }

    .react-evidence-index .upload-card-main {
        display: flex !important;
        flex-direction: row !important;
        align-items: flex-start !important;
        gap: 14px !important;
        direction: ltr !important;
    }

    .react-evidence-index .upload-file-icon {
        position: relative !important;
        width: 70px !important;
        height: 70px !important;
        min-width: 70px !important;
        margin: 0 !important;
        border-radius: 24px !important;
        background: var(--native-soft) !important;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, .7) !important;
        font-size: 0 !important;
    }

    .react-evidence-index .upload-file-icon::before {
        content: '✓';
        width: 38px;
        height: 38px;
        display: grid;
        place-items: center;
        border: 3px solid var(--native-accent);
        border-radius: 10px;
        color: var(--native-accent);
        font-size: 28px;
        font-weight: 950;
        line-height: 1;
    }

    .react-evidence-index .upload-card-main > div:last-child {
        width: 100% !important;
        min-width: 0 !important;
        display: flex !important;
        flex-wrap: wrap !important;
        align-items: center !important;
        justify-content: flex-end !important;
        gap: 8px 10px !important;
        direction: rtl !important;
        text-align: right !important;
    }

    .react-evidence-index .upload-card strong {
        width: 100% !important;
        margin: 2px 0 0 !important;
        color: #111827 !important;
        font-size: 21px !important;
        line-height: 1.35 !important;
        font-weight: 950 !important;
        letter-spacing: -.35px !important;
        text-align: right !important;
    }

    .react-evidence-index .upload-card .muted {
        width: 100% !important;
        color: #6b7280 !important;
        font-size: 14px !important;
        line-height: 1.55 !important;
        text-align: right !important;
    }

    .react-evidence-index .teacher-chip {
        order: 3 !important;
        min-height: 36px !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 6px !important;
        margin: 2px 0 0 !important;
        padding: 7px 14px !important;
        border-radius: 999px !important;
        background: #eef2ff !important;
        color: #3730a3 !important;
        font-size: 13px !important;
        font-weight: 950 !important;
        box-shadow: none !important;
    }

    .react-evidence-index .teacher-chip::before {
        content: '▣';
        color: #4f46e5;
        font-size: 13px;
        line-height: 1;
    }

    .react-evidence-index .upload-card-main > div:last-child::after {
        content: 'نشط';
        order: 4;
        min-height: 36px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 7px 16px;
        border-radius: 999px;
        background: var(--native-soft);
        color: var(--native-text);
        font-size: 13px;
        font-weight: 950;
    }

    .react-evidence-index .upload-card-footer {
        display: flex !important;
        justify-content: flex-end !important;
        align-items: center !important;
        gap: 8px !important;
        min-height: auto !important;
        margin: 16px 0 0 !important;
        padding: 14px 0 0 !important;
        border-top: 1px solid #eef0f3 !important;
    }

    .react-evidence-index .upload-card-footer span {
        position: static !important;
        display: inline-flex !important;
        align-items: center !important;
        gap: 6px !important;
        color: #707987 !important;
        font-size: 13px !important;
        font-weight: 700 !important;
        direction: ltr !important;
    }

    .react-evidence-index .upload-card-footer span::after {
        content: '◷';
        color: #8a94a3;
        font-size: 16px;
        line-height: 1;
    }

    .react-evidence-index .upload-card-footer .btn {
        display: none !important;
    }
}
</style>

<div data-react-app="evidence-index"></div>

<script>
(function () {
    function bindEvidenceCards() {
        document.querySelectorAll('.react-evidence-index .upload-card').forEach(function (card) {
            if (card.dataset.tapBound === '1') return;
            var link = card.querySelector('.upload-card-footer .btn');
            if (!link || !link.href) return;

            card.dataset.tapBound = '1';
            card.setAttribute('role', 'link');
            card.setAttribute('tabindex', '0');
            card.setAttribute('aria-label', 'فتح المعيار');

            card.addEventListener('click', function (event) {
                if (event.target.closest('a, button, input, textarea, select')) return;
                window.location.href = link.href;
            });

            card.addEventListener('keydown', function (event) {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    window.location.href = link.href;
                }
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bindEvidenceCards);
    } else {
        bindEvidenceCards();
    }

    new MutationObserver(bindEvidenceCards).observe(document.documentElement, { childList: true, subtree: true });
})();
</script>
@endsection
