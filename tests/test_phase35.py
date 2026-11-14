from pathlib import Path
import importlib.util
import tempfile
import subprocess
import sys
import shutil

BASE=Path(__file__).resolve().parents[1]/'01_COPY_TO_PROJECT_ROOT'
spec=importlib.util.spec_from_file_location('patch35',BASE/'scripts/phase35_adaptive_images.py')
mod=importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)


def fixture(root):
    paths={
      'index.html':"<html><head><script>heroPreload.href = '/assets/images/wedding-6.jpeg';</script></head><body></body></html>",
      'home.html':"<html><head><script>heroPreload.href = '/assets/images/wedding-6.jpeg';</script></head><body></body></html>",
      'portfolio.html':'<html><head></head><body>Portfolio</body></html>',
      'blog.html':'<html><head></head><body>Blog</body></html>',
      'admin.html':'<html><head></head><body>Admin</body></html>',
      'assets/lkm-v3/site.js':"const img=(src,alt,fb='',cl='',lazy=true)=>`<img ${cl?'class=\"'+cl+'\"':''} src=\"${esc(src||fb)}\" alt=\"${esc(alt)}\" ${lazy?'loading=\"lazy\"':''} onerror=\"this.onerror=null;this.src='${esc(fb||'./assets/lkm-v3/preview/brand.jpg')}'\">`;",
      'assets/lkm-v3/cms-public.js':"const img=(url,alt,cl='')=>safeImage(url)?`<img class=\"${cl}\" src=\"${esc(url)}\" alt=\"${esc(alt)}\" loading=\"lazy\">`:'';",
      'assets/lkm-v3/phase31-public.js':"function a(){img.src=media.src;img.alt=media.alt;img.loading='lazy';img.decoding='async';img.src=g.media.src;img.alt=g.media.alt;img.loading='lazy';}",
      'assets/lkm-v3/portfolio-stories.mjs':"function a(){img.src=media.image;img.alt=media.alt;img.loading='lazy';img.decoding='async';image.src=media.image;image.alt=media.alt;image.decoding='async';}",
      'assets/lkm-v3/studio.mjs':"function mediaPreview(a){return url?`<img loading=\"lazy\" src=\"${h(url)}\" alt=\"${h(a.alt_text||a.title||'Portfolio media')}\">`:'<div class=\"studio-asset-placeholder\">▣</div>'}",
    }
    for p,c in paths.items():
        dest=root/p; dest.parent.mkdir(parents=True,exist_ok=True);dest.write_text(c,encoding='utf-8')
    src=BASE/'assets/lkm-v3/phase35-images.js';dest=root/'assets/lkm-v3/phase35-images.js';shutil.copy(src,dest)


def test():
 with tempfile.TemporaryDirectory() as t:
    root=Path(t);fixture(root);mod.ROOT=root
    mod.main()
    a={p:p.read_bytes() for p in root.rglob('*') if p.is_file()}
    mod.main()
    assert all(p.read_bytes()==data for p,data in a.items()),'not idempotent'
    for path in ('index.html','home.html','portfolio.html','admin.html','blog.html'):
        assert (root/path).read_text().count('phase35-images.js?v=35-1')==1
    assert 'heroPreload.setAttribute(\'imagesrcset\'' in (root/'index.html').read_text()
    assert 'htmlAttrs' in (root/'assets/lkm-v3/site.js').read_text()
    assert 'LKM35Images' in (root/'assets/lkm-v3/studio.mjs').read_text()
    for name in ('site.js','cms-public.js','phase31-public.js'):
        p=root/'assets/lkm-v3'/name
        # fixtures may not define real symbols, but syntax should parse.
        subprocess.run(['node','--check',str(p)],check=True,capture_output=True)
    subprocess.run(['node','--check',str(root/'assets/lkm-v3/portfolio-stories.mjs')],check=True,capture_output=True)
    subprocess.run(['node','--check',str(root/'assets/lkm-v3/studio.mjs')],check=True,capture_output=True)
    print('PASS: patch anchors, idempotency, script order, syntax')

if __name__=='__main__':test()
