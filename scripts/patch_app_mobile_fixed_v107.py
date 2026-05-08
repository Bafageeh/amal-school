from pathlib import Path

p = Path('mobile/AppMobileFixed.js')
if not p.exists():
    raise SystemExit('mobile/AppMobileFixed.js not found')

text = p.read_text()

old_follow = '<ActionRow icon="folder-open-outline" title="متابعة ملفات المعلمات" subtitle="استعراض ملفات كل معلمة حسب المعيار" accent={C.gold} onPress={onOpenTeacherFiles} noBorder />'
text = text.replace(old_follow, '')

old_criteria = '<ActionRow icon="checkmark-done-circle-outline" title="إدارة المعايير" subtitle="إنشاء وتعديل وحذف معايير التقييم" accent={C.teal} onPress={onOpenCriteria} />'
new_criteria = '''<TouchableOpacity style={styles.actionRow} onPress={onOpenCriteria} activeOpacity={0.78}>
              <Ionicons name="chevron-back" size={16} color={C.border} />
              <View style={styles.actionRowText} pointerEvents="none">
                <Text style={[styles.actionRowTitle, { writingDirection: 'rtl' }]}>إدارة المعايير</Text>
                <Text style={[styles.actionRowSub, { writingDirection: 'rtl' }]}>إنشاء وتعديل وحذف معايير التقييم</Text>
              </View>
              <View pointerEvents="none" style={[styles.actionRowIcon, { backgroundColor: `${C.teal}18` }]}>
                <Ionicons name="checkmark-done-circle-outline" size={20} color={C.teal} />
              </View>
            </TouchableOpacity>'''
if old_criteria not in text:
    raise SystemExit('criteria ActionRow not found')
text = text.replace(old_criteria, new_criteria)

text = text.replace('1.0.6', '1.0.7').replace('1.0.5', '1.0.7')

required = [
    'إدارة المعلمات',
    'إدارة المعايير',
    '1.0.7',
    'person-add-outline',
    'trash-outline',
    'create-outline',
    'writingDirection',
]
for item in required:
    if item not in text:
        raise SystemExit('missing required text: ' + item)

if 'title="متابعة ملفات المعلمات"' in text:
    raise SystemExit('settings follow-up link still present')

p.write_text(text)
print('Applied v1.0.7 settings title/follow-link patch')
