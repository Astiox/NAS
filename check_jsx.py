import pathlib
import re
import sys

root = pathlib.Path('.')
tags = ['View','ScrollView','Text','TouchableOpacity','Button','TextInput','SafeAreaView','Image','Pressable','FlatList','KeyboardAvoidingView','Modal']
issues = []

for f in root.rglob('*.js'):
    if 'node_modules' in str(f):
        continue
    if not any(p in str(f) for p in ['screens', 'App.js', 'index.js']):
        continue
    text = f.read_text(encoding='utf-8')
    stack = []
    pattern = re.compile(r'<(/?)([A-Za-z0-9_]+)([^>]*)>')
    for m in pattern.finditer(text):
        slash, tag, rest = m.group(1), m.group(2), m.group(3)
        if rest.strip().endswith('/'):
            continue
        if slash == '':
            if tag in tags:
                stack.append(tag)
        else:
            if tag in tags:
                if stack and stack[-1] == tag:
                    stack.pop()
                else:
                    expected = stack[-1] if stack else 'none'
                    issues.append((str(f), m.start(), f"mismatch close {tag} expects {expected}"))
    if stack:
        issues.append((str(f), -1, 'unclosed:' + ','.join(stack)))

if issues:
    print('issues found')
    for i in issues:
        print(i)
    sys.exit(1)
else:
    print('no tag balance issues found')
