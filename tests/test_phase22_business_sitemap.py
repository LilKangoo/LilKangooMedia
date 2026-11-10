import tempfile
import subprocess
import sys
from pathlib import Path
from xml.etree import ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]
with tempfile.TemporaryDirectory() as temp:
    root=Path(temp)
    (root/'assets/lkm-v3').mkdir(parents=True)
    (root/'assets/lkm-v3/articles-index.json').write_text('{"posts":[]}')
    for name in ['index.html','portfolio.html','blog.html','case-studies.html','business-solutions.html','business-restaurants.html','business-hotels.html','business-retail.html','business-brands.html','admin.html']:
        (root/name).write_text('<!doctype html><html><head><title>Test</title></head><body>Test</body></html>')
    result=subprocess.run([sys.executable,str(ROOT/'scripts/phase20_rebuild_sitemap.py'),'--root',str(root)],capture_output=True,text=True)
    assert result.returncode==0,result.stderr
    urls={e.text for e in ET.parse(root/'sitemap.xml').iter() if e.tag.endswith('loc')}
    for name in ['business-solutions.html','business-restaurants.html','business-hotels.html','business-retail.html','business-brands.html','case-studies.html']:
        assert 'https://lilkangoomedia.com/'+name in urls,name
    assert not any('/admin' in url for url in urls),urls
    print('PASS: sitemap builder includes new real public HTML pages; excludes admin')
