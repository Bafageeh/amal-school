from pathlib import Path
import os
import re

project = os.environ.get('PROJECT_PATH')
candidate_dirs = []
if project:
    candidate_dirs.append(Path(project) / 'mobile')
candidate_dirs += [
    Path('mobile'),
    Path('/mnt/home-storage/home/pmsa/apps/amal-school/amal-school-api/mobile'),
    Path('/home/pmsa/apps/amal-school/amal-school-api/mobile'),
]

app_paths = []
seen = set()
for base in candidate_dirs:
    for name in ('AppMobileFixed.js', 'App.js'):
        p = base / name
        key = str(p)
        if key not in seen:
            app_paths.append(p)
            seen.add(key)

existing = [p for p in app_paths if p.exists()]
if not existing:
    raise SystemExit('No mobile App.js/AppMobileFixed.js found')


def add_header_spacer_style(text: str) -> str:
    if 'headerSideSpacer:' in text:
        return text
    idx = text.rfind('\n});')
    if idx == -1:
        return text
    style = "\n  headerSideSpacer: { width: 46, height: 46 },"
    return text[:idx] + style + text[idx:]


def replace_header_avatar(text: str) -> str:
    replacement = '\n      <View style={styles.headerSideSpacer} />'
    needle = '\n      <View style={styles.headerAvatarWrap}>'
    end_marker = '\n    </View>\n  );\n}'
    start = text.find(needle)
    if start != -1:
        end = text.find(end_marker, start)
        if end != -1:
            return text[:start] + replacement + text[end:]

    # Fallback for slightly different formatting.
    pattern = r"\n\s*<View style=\{styles\.headerAvatarWrap\}>[\s\S]*?\n\s*</View>\s*(?=\n\s*</View>\s*\);\s*\n\})"
    new_text, count = re.subn(pattern, replacement + '\n', text, count=1)
    return new_text if count else text


def fix_settings_labels(text: str) -> str:
    replacements = {
        'title="إدارة" subtitle="إنشاء وتعديل وحذف"': 'title="إدارة المعايير" subtitle="إنشاء وتعديل وحذف المعايير"',
        "title='إدارة' subtitle='إنشاء وتعديل وحذف'": "title='إدارة المعايير' subtitle='إنشاء وتعديل وحذف المعايير'",
        'AdminBackHeader title="إدارة"': 'AdminBackHeader title="إدارة المعايير"',
        "AdminBackHeader title='إدارة'": "AdminBackHeader title='إدارة المعايير'",
        '<Text style={styles.pageTitle}>إدارة</Text>': '<Text style={styles.pageTitle}>إدارة المعايير</Text>',
        '<Text style={styles.pageSubtitle}>إنشاء وتعديل وحذف</Text>': '<Text style={styles.pageSubtitle}>إنشاء وتعديل وحذف المعايير</Text>',
    }
    for old, new in replacements.items():
        text = text.replace(old, new)

    # Normalize any ActionRow for the criteria manager that still has the short title.
    text = re.sub(
        r'(ActionRow[^\n]*icon="(?:list|folder-open)-outline"[^\n]*title=")إدارة("[^\n]*subtitle=")إنشاء وتعديل وحذف("[^\n]*onPress=\{onOpenCriteria\})',
        r'\1إدارة المعايير\2إنشاء وتعديل وحذف المعايير\3',
        text,
    )
    return text

patched = []
for p in existing:
    text = p.read_text()
    original = text
    text = fix_settings_labels(text)
    text = replace_header_avatar(text)
    text = add_header_spacer_style(text)
    if text != original:
        p.write_text(text)
        patched.append(str(p))

if patched:
    print('Applied requested mobile settings fixes in: ' + ', '.join(patched))
else:
    print('Requested mobile settings fixes were already applied')
