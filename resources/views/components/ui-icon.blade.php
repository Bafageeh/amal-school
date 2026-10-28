@props(['name' => 'home', 'size' => 22])
@php
$paths = [
'home' => 'm3 10 9-7 9 7M5 9v12h5v-7h4v7h5V9',
'check' => 'M9 3h6m-7 2H5v16h14V5h-3M8 12l3 3 5-6',
'users' => 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
'folder' => 'M3 7V5a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z',
'settings' => 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm-2-6h4l.6 3 2.4 1.4 2.9-.9 2 3.5-2.3 2v2l2.3 2-2 3.5-2.9-.9-2.4 1.4-.6 3h-4l-.6-3L7 17.6l-2.9.9-2-3.5 2.3-2v-2L2.1 9l2-3.5 2.9.9L9.4 5Z',
'logout' => 'M9 3H4v18h5m5-14 5 5-5 5m-6-5h13',
'arrow' => 'm14 6-6 6 6 6M8 12h13',
'sparkles' => 'm12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5ZM20 2v4m-2-2h4',
];
@endphp
<svg width="{{ $size }}" height="{{ $size }}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" {{ $attributes }}><path d="{{ $paths[$name] ?? $paths['home'] }}"/></svg>
