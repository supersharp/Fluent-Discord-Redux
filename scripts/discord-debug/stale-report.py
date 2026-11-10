import os, re, json, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, 'src')
LIVE = os.path.expandvars(r'%TEMP%\discord-live.css')

live = set(re.findall(r'\.([A-Za-z_][A-Za-z0-9_-]*)', open(LIVE, encoding='utf-8', errors='ignore').read()))
import glob, json
for dom_file in glob.glob(os.path.join(os.path.dirname(LIVE), 'discord-dom-classes*.json')):
    live |= set(json.load(open(dom_file, encoding='utf-8')))
TOKEN = re.compile(r'(?<![-\w])([A-Za-z][A-Za-z0-9]*(?:__[a-z0-9]{4,8}|_[a-f0-9]{6}|_[A-Za-z0-9-]{5,8}))(?![-\w])')

def is_hash(c):
    s = c.rsplit('_', 1)[-1]
    return len(s) >= 5 and (any(ch.isdigit() for ch in s) or any(ch.isupper() for ch in s))

def strip_comments(text):
    # Replace comments with spaces of equal length to keep offsets.
    out = list(text)
    i = 0
    while i < len(text):
        if text.startswith('//', i):
            j = text.find('\n', i)
            if j < 0: j = len(text)
            for k in range(i, j): out[k] = ' '
            i = j
        elif text.startswith('/*', i):
            j = text.find('*/', i + 2)
            if j < 0: j = len(text)
            else: j += 2
            for k in range(i, j): out[k] = ' '
            i = j
        else:
            i += 1
    return ''.join(out)

def selector_start(text, brace):
    i = brace - 1
    while i >= 0:
        ch = text[i]
        if ch in ';{}':
            break
        i -= 1
    start = i + 1
    while start < brace and text[start].isspace(): start += 1
    return start

def nodes(text):
    clean = strip_comments(text)
    stack = []
    result = []
    for i, ch in enumerate(clean):
        if ch == '{':
            s = selector_start(clean, i)
            stack.append((s, i))
        elif ch == '}':
            if not stack: continue
            s, b = stack.pop()
            result.append((s, b, i))
    return result

stale = set()
for root, _, files in os.walk(SRC):
    for f in files:
        if not f.endswith('.scss'): continue
        p = os.path.join(root, f)
        text = open(p, encoding='utf-8').read()
        for tok in TOKEN.findall(text):
            if is_hash(tok) and tok not in live:
                stale.add(tok)

report = {}
for root, _, files in os.walk(SRC):
    for f in files:
        if not f.endswith('.scss'): continue
        p = os.path.join(root, f)
        text = open(p, encoding='utf-8').read()
        ns = nodes(text)
        hits = []
        for s, b, e in ns:
            sel = text[s:b].strip()
            found = sorted({t for t in stale if re.search(r'(?<![-\w])\.' + re.escape(t) + r'(?![-\w])', sel)})
            if found:
                hits.append((s, b, e, sel.replace('\n', ' ')[:180], found))
        if hits:
            report[os.path.relpath(p, ROOT)] = hits

print('files with stale selectors:', len(report), 'stale tokens:', len(stale))
for path, hits in sorted(report.items(), key=lambda kv: -len(kv[1]))[:25]:
    print(f'\n### {path} ({len(hits)} rules)')
    for s, b, e, sel, found in hits[:12]:
        print(f'  {sel}    [{", ".join(found[:6])}]')
