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
        --native-progress: 83%;
        --native-percent: '83%';
        position: relative !important;
        display: block !important;
        overflow: hidden !important;
        min-height: 248px !important;
        margin: 0 !important;
        padding: 22px 22px 84px !important;
        border-radius: 28px !important;
        background: #ffffff !important;
        border: 1px solid rgba(224, 229, 235, .95) !important;
        box-shadow: 0 12px 26px rgba(15, 23, 42, .07) !important;
    }

    .react-evidence-index .upload-card:nth-child(3n + 1) {
        --native-accent: #25a875;
        --native-soft: #eaf7ee;
        --native-text: #16724f;
        --native-progress: 83%;
        --native-percent: '83%';
    }

    .react-evidence-index .upload-card:nth-child(3n + 2) {
        --native-accent: #2f6be8;
        --native-soft: #eef4ff;
        --native-text: #1d4ed8;
        --native-progress: 67%;
        --native-percent: '67%';
    }

    .react-evidence-index .upload-card:nth-child(3n) {
        --native-accent: #6551cf;
        --native-soft: #f1edff;
        --native-text: #5740b6;
        --native-progress: 47%;
        --native-percent: '47%';
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
        flex-direction: column !important;
        align-items: stretch !important;
        gap: 12px !important;
        min-height: auto !important;
        margin: 18px 0 0 !important;
        padding: 15px 0 0 !important;
        border-top: 1px solid #eef0f3 !important;
    }

    .react-evidence-index .upload-card::before {
        content: var(--native-percent) !important;
        position: absolute !important;
        left: 22px !important;
        bottom: 70px !important;
        color: #111827 !important;
        font-size: 20px !important;
        font-weight: 950 !important;
        z-index: 2 !important;
    }

    .react-evidence-index .upload-card::after {
        content: '' !important;
        position: absolute !important;
        left: 22px !important;
        right: 22px !important;
        bottom: 58px !important;
        height: 8px !important;
        border-radius: 999px !important;
        background: #ebe8e1 !important;
        z-index: 1 !important;
    }

    .react-evidence-index .upload-card-footer::before {
        content: '' !important;
        position: absolute !important;
        left: 22px !important;
        bottom: 58px !important;
        width: var(--native-progress) !important;
        height: 8px !important;
        border-radius: 999px !important;
        background: var(--native-accent) !important;
        z-index: 2 !important;
    }

    .react-evidence-index .upload-card-footer span {
        position: absolute !important;
        right: 22px !important;
        bottom: 84px !important;
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
        position: absolute !important;
        left: 22px !important;
        right: 22px !important;
        bottom: 17px !important;
        width: auto !important;
        min-height: 44px !important;
        padding: 0 16px !important;
        border-radius: 16px !important;
        background: #ffffff !important;
        border: 1.5px solid var(--native-accent) !important;
        color: var(--native-text) !important;
        box-shadow: none !important;
        font-size: 15px !important;
        font-weight: 950 !important;
    }

    .react-evidence-index .upload-card-footer .btn::after {
        content: '↗';
        margin-right: 8px;
        font-size: 17px;
        line-height: 1;
    }
}
</style>
<div data-react-app='evidence-index'></div>
@endsection
