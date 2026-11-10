/* LilKangooMedia 24.3 — safe file metadata helpers shared by client/admin UI. */
export const BUCKET = 'lkm-client-deliverables';
export const MAX_FILE_BYTES = 45 * 1024 * 1024;
export const TYPES = Object.freeze(['photo','video','document','archive']);
export const MIME_BY_EXTENSION = Object.freeze({
  jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp',
  heic:'image/heic',heif:'image/heif',mp4:'video/mp4',mov:'video/quicktime',
  pdf:'application/pdf',zip:'application/zip'
});
export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const pathRE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(?:jpg|jpeg|png|webp|heic|heif|mp4|mov|pdf|zip)$/;
export const fileExtension = file => String(file?.name||'').split('.').pop().toLowerCase();
export function validateUpload(file) {
  if(!file || !Number.isSafeInteger(file.size) || file.size<1 || file.size>MAX_FILE_BYTES)
    throw Error('Choose a non-empty file of at most 45 MB. For larger files use an external delivery link.');
  const ext=fileExtension(file),mime=MIME_BY_EXTENSION[ext];
  if(!mime)throw Error('Allowed formats: JPG, PNG, WebP, HEIC, MP4, MOV, PDF or ZIP.');
  if(file.type && file.type!==mime && !(ext==='zip'&&file.type==='application/x-zip-compressed'))
    throw Error('File format does not match the extension.');
  return {extension:ext,mime,kind:ext==='zip'?'archive':ext==='pdf'?'document':['mp4','mov'].includes(ext)?'video':'photo'};
}
export function privatePath(projectId,fileId,extension){
  const a=String(projectId||'').toLowerCase(),b=String(fileId||'').toLowerCase();
  if(!UUID_RE.test(a)||!UUID_RE.test(b)||!Object.hasOwn(MIME_BY_EXTENSION,extension))throw Error('Invalid private file identifier.');
  return `${a}/${b}.${extension}`;
}
export const validPath=path=>pathRE.test(String(path||''));
export function validHttps(raw){
  if(typeof raw!=='string'||raw.length>2000||/[\s<>"']/.test(raw))return '';
  try{const url=new URL(raw);return url.protocol==='https:'&&!url.username&&!url.password&&url.hostname?url.href:''}catch{return ''}
}
export function cleanFileRecords(response){
  if(!response||response.ok!==true||!Array.isArray(response.files))throw Error('Shared files could not be loaded.');
  return response.files.slice(0,300).filter(x=>UUID_RE.test(x?.id||'')&&UUID_RE.test(x?.project_id||'')&&TYPES.includes(x?.media_type)&&
    (x?.delivery_mode==='storage'&&validPath(x.storage_path)||x?.delivery_mode==='link'&&Boolean(validHttps(x.external_url))))
    .map(x=>({
      id:x.id,projectId:x.project_id,projectTitle:String(x.project_title||'Client project').slice(0,160),
      title:String(x.title||'File').slice(0,150),description:String(x.description||'').slice(0,900),
      kind:x.media_type,mode:x.delivery_mode,filename:String(x.filename||'File').slice(0,200),
      path:x.delivery_mode==='storage'?x.storage_path:'',url:x.delivery_mode==='link'?validHttps(x.external_url):'',
      mime:String(x.mime_type||'').slice(0,100),size:Number.isFinite(Number(x.size_bytes))?Number(x.size_bytes):0,
      created:String(x.created_at||'').slice(0,40)
    }));
}
export function formatBytes(n){if(!Number.isFinite(n)||n<1)return '';return n<1024*1024?`${Math.max(1,Math.round(n/1024))} KB`:`${(n/1024/1024).toFixed(1)} MB`;}
export function browserPreviewable(row){return row?.mode==='storage' && ['image/jpeg','image/png','image/webp','video/mp4','video/quicktime'].includes(row.mime);}
