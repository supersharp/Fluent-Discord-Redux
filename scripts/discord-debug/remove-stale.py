import os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, 'src')
LIVE = os.path.expandvars(r'%TEMP%\discord-live.css')
DOM = os.path.expandvars(r'%TEMP%\discord-dom-classes.json')

live = set(re.findall(r'\.([A-Za-z_][A-Za-z0-9_-]*)', open(LIVE, encoding='utf-8', errors='ignore').read()))
import glob, json
for dom_file in glob.glob(os.path.join(os.path.dirname(DOM), 'discord-dom-classes*.json')):
    live |= set(json.load(open(dom_file, encoding='utf-8')))
TOKEN = re.compile(r'(?<![-\w])([A-Za-z][A-Za-z0-9]*(?:__[a-z0-9]{4,8}|_[a-f0-9]{6}|_[A-Za-z0-9-]{5,8}))(?![-\w])')

def is_hash(c):
    s = c.rsplit('_', 1)[-1]
    return len(s) >= 5 and (any(ch.isdigit() for ch in s) or any(ch.isupper() for ch in s))

def strip_comments(text):
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
        if text[i] in ';{}': break
        i -= 1
    start = i + 1
    while start < brace and text[start].isspace(): start += 1
    return start

def block_spans(clean):
    stack = []
    spans = []
    for i, ch in enumerate(clean):
        if ch == '{':
            s = selector_start(clean, i)
            stack.append((s, i))
        elif ch == '}':
            if not stack: continue
            s, b = stack.pop()
            spans.append((s, b, i))
    return spans

def split_top_level(selector, sep=','):
    parts = []
    start = 0
    depth = 0
    quote = None
    for i, ch in enumerate(selector):
        if quote:
            if ch == quote and selector[i - 1] != '\\': quote = None
            continue
        if ch in '"\'':
            quote = ch
        elif ch in '([':
            depth += 1
        elif ch in ')]':
            depth = max(0, depth - 1)
        elif ch == sep and depth == 0:
            parts.append(selector[start:i])
            start = i + 1
    parts.append(selector[start:])
    return parts

def uses_stale(selector, stale):
    for token in stale:
        # Match normal selectors, escaped class names (text-sm\\/medium_cf4812)
        # and [class*="..."] fallbacks.
        if token in selector:
            return token
    return None

def transform(path, stale, apply=False):
    text = open(path, encoding='utf-8').read()
    clean = strip_comments(text)
    spans = block_spans(clean)
    spans.sort(key=lambda s: (s[0], -s[2]))
    deletions = []
    edits = []
    for s, b, e in spans:
        if any(s >= ds and e <= de for ds, de in deletions):
            continue
        sel = text[s:b]
        parts = split_top_level(sel)
        kept = [p for p in parts if uses_stale(p, stale) is None]
        if not kept:
            start = s
            # consume indentation/newline before the rule
            line_start = text.rfind('\n', 0, s) + 1
            if text[line_start:s].strip() == '':
                start = line_start
            end = e + 1
            if end < len(text) and text[end] == '\n': end += 1
            deletions.append((start, end))
        elif len(kept) != len(parts):
            indent = re.match(r'[ \t]*', text[s:]).group(0)
            joined = (',\n' + indent).join(p.strip() for p in kept)
            edits.append((s, b, joined))
    # Apply from the end; deletions are sorted outer-first but non-overlapping.
    changes = [(s, e, None) for s, e in deletions] + [(s, e, new) for s, e, new in edits]
    for s, e, new in sorted(changes, key=lambda c: c[0], reverse=True):
        text = text[:s] + (new if new is not None else '') + text[e:]
    if apply:
        open(path, 'w', encoding='utf-8', newline='\n').write(text)
    return len(deletions), len(edits), text != open(path, encoding='utf-8').read() if not apply else True

stale = set()
for root, _, files in os.walk(SRC):
    for f in files:
        if f.endswith('.scss'):
            for tok in TOKEN.findall(open(os.path.join(root, f), encoding='utf-8').read()):
                if is_hash(tok) and tok not in live:
                    stale.add(tok)

print('stale tokens', len(stale))
only = None
if '--only' in sys.argv:
    only = os.path.normpath(os.path.join(ROOT, sys.argv[sys.argv.index('--only') + 1]))
total_del = total_edit = 0
for root, _, files in os.walk(SRC):
    for f in files:
        if not f.endswith('.scss'): continue
        p = os.path.join(root, f)
        if only and os.path.normpath(p) != only:
            continue
        d, e, changed = transform(p, stale, apply='--apply' in sys.argv)
        if d or e:
            total_del += d; total_edit += e
            print(f'{os.path.relpath(p, ROOT)}: removed {d} rules, trimmed {e} selectors')
print('TOTAL removed', total_del, 'trimmed', total_edit)
