@props(['title', 'description' => '', 'icon' => 'check'])
<header class="page-heading"><div class="page-heading-copy"><span class="eyebrow">منصة التميز المدرسي</span><h1>{{ $title }}</h1><p>{{ $description }}</p></div><span class="page-heading-icon"><x-ui-icon :name="$icon" size="30" /></span></header>
