#!/usr/bin/env python3
"""Add the independent service bundle to existing LilKangooMedia HTML pages.

Run from a checked-out GitHub branch, after copying ZIP contents into the repository root.
Does NOT alter site.js, prices, contact form code, or any Supabase table.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent
ASSETS = ROOT / 'assets' / 'lkm-v3'
FILES = ['index.html', 'home.html']
CSS = '<link rel="stylesheet" href="/assets/lkm-v3/service-bundle.css">'
JS = '<script src="/assets/lkm-v3/service-bundle.js" defer></script>'


def main():
    missing = [name for name in ('service-bundle.css', 'service-bundle.js') if not (ASSETS / name).is_file()]
    if missing:
        raise SystemExit('Brak nowych plikow w assets/lkm-v3: ' + ', '.join(missing))
    updates = []
    for name in FILES:
        path = ROOT / name
        if not path.is_file():
            raise SystemExit(f'Nie znaleziono {name} w katalogu repozytorium: {ROOT}')
        content = path.read_text('utf-8')
        if '</head>' not in content or 'site.js' not in content or 'id="main"' not in content:
            raise SystemExit(f'Nieoczekiwana struktura {name}; nie zmieniono zadnych plikow.')
        needed = [tag for tag in (CSS, JS) if tag not in content]
        if needed:
            content = content.replace('</head>', '\n' + '\n'.join(needed) + '\n</head>', 1)
        updates.append((path, content, len(needed)))
    for path, content, changed in updates:
        if changed:
            path.write_text(content, 'utf-8')
            print(f'{path.name}: dodano {changed} element(y)')
        else:
            print(f'{path.name}: juz skonfigurowany')
    print('Gotowe. Commit na galezi testowej, nastepnie Netlify Deploy Preview.')

if __name__ == '__main__':
    main()
