import test from 'node:test';import assert from 'node:assert/strict';
import {slugOK,uuidOK,youtubeID,imageURL,clean,esc,safeSearch,tagsFromInput,parseCount,previewURL,isShownInPortfolio,isStoryPublished,galleryKind} from '../assets/lkm-v3/studio-model.mjs';
test('YouTube watch and shorts URLs resolve to one canonical ID',()=>{
 assert.equal(youtubeID('https://www.youtube.com/shorts/kU3ACgDkxDo?feature=share'),'kU3ACgDkxDo');
 assert.equal(youtubeID('https://youtu.be/y1CB22Z-Qm4?si=xx'),'y1CB22Z-Qm4');
 assert.equal(youtubeID('https://youtube.com/watch?v=y1CB22Z-Qm4'),'y1CB22Z-Qm4');
 assert.equal(youtubeID('https://evil.example/shorts/kU3ACgDkxDo'),'');
 assert.equal(youtubeID('invalid!!'),'');
});
test('image URLs reject local traversal, untrusted and markup schemes',()=>{
 assert.equal(imageURL('/assets/images/elea/photo.webp'),'/assets/images/elea/photo.webp');
 assert.equal(imageURL('https://lilkangoomedia.com/assets/golf.jpg'),'https://lilkangoomedia.com/assets/golf.jpg');
 for(const x of ['javascript:alert(1)','//evil.example/abc','/assets/../secret','http://example.com/photo','https://example.com/a"onerror=alert(1)'])assert.equal(imageURL(x),'');
});
test('slugs and uuids guard URL/data references',()=>{
 assert.equal(slugOK('elea-golf-club'),true);assert.equal(slugOK('Eléa Golf Club'),false);
 assert.equal(uuidOK('3a592d00-9556-423d-a12e-9c58b58ee557'),true);
 assert.equal(uuidOK('3a592d00'),false)
});
test('display visibility is separate from published story',()=>{
 const g={id:'g',visibility:'public',show_in_portfolio:false};
 assert.equal(isShownInPortfolio(g),false);assert.equal(isStoryPublished({is_published:true, gallery_id:'g'},g),true);
 assert.equal(isShownInPortfolio({visibility:'public'}),true);
 assert.equal(isStoryPublished({is_published:true},{visibility:'private'}),false);
});
test('no injections in rendering helpers',()=>{
 assert.equal(esc('<img src=x onerror="1">'),'&lt;img src=x onerror=&quot;1&quot;&gt;');
 assert.equal(safeSearch('Golf & (Paphos).*'),'Golf  Paphos');
 assert.deepEqual(tagsFromInput('golf, aerial,golf, sunset'),['golf','aerial','sunset']);
});
test('counts, media preview, kinds and limits',()=>{
 assert.equal(parseCount('0-35/8921'),8921);assert.equal(parseCount('*/*'),null);
 assert.equal(previewURL({media_type:'youtube',youtube_id:'y1CB22Z-Qm4'}),'https://i.ytimg.com/vi/y1CB22Z-Qm4/hqdefault.jpg');
 assert.equal(galleryKind('project'),'project');assert.equal(galleryKind('other'),'collection');
 assert.equal(clean(' abc ',2),'ab');
});
