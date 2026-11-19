#!/usr/bin/env node
const fs = require('fs');

function patchFile(path, replacements) {
  let s = fs.readFileSync(path, 'utf8');
  let changed = false;
  for (const { oldStr, newStr, name } of replacements) {
    if (s.includes(newStr)) { console.log('already:', name); continue; }
    if (!s.includes(oldStr)) throw new Error('not found: ' + name + ' in ' + path);
    s = s.split(oldStr).join(newStr);
    changed = true;
    console.log('patched:', name);
  }
  if (changed) fs.writeFileSync(path, s);
  return changed;
}

const jsPath = '/usr/lib/node_modules/genieacs/public/app-FOJWPRV7.js';
const cssPath = '/usr/lib/node_modules/genieacs/public/app-LU66VFYW.css';

patchFile(jsPath, [
  {
    name: 'device page wrapper',
    oldStr: 'return[p("h1",e.attrs.deviceId),r]}});var Ea=',
    newStr: 'return p("div.page-device",[p("h1",e.attrs.deviceId),r])}});var Ea='
  }
]);

let css = fs.readFileSync(cssPath, 'utf8');
const start = '/* GENIEACS_DEVICE_VIEW_START */';
const end = '/* GENIEACS_DEVICE_VIEW_END */';
const block = start + '\n' +
'#content .page-device{padding-bottom:8px}\n' +
'#content .page-device>h1{font-size:1.35rem;font-weight:600;margin:0 0 .75rem;padding:.1rem 0 .45rem;border-bottom:1px solid var(--bs-border-color,#dee2e6);word-break:break-all;overflow-wrap:anywhere;color:var(--color4)}\n' +
'#content .page-device h2{font-size:1.05rem;margin:1rem 0 .4rem;color:var(--color4);font-weight:600}\n' +
'#content .page-device h3{font-size:1rem;margin:.6rem 0 .3rem;color:var(--color5);font-weight:600}\n' +
'#content .page-device h3:empty{display:none;margin:0;padding:0;height:0}\n' +
'#content .page-device table.parameter-list{width:100%;max-width:100%;border-collapse:separate;border-spacing:0;margin:0 0 .85rem;background:#fff;border:1px solid var(--bs-border-color,#dee2e6);border-radius:6px;overflow:hidden}\n' +
'#content .page-device table.parameter-list th{width:240px;min-width:160px;padding:.5em .75em;text-align:left;white-space:nowrap;color:#495057;font-weight:600;background:var(--bs-tertiary-bg,#f8f9fa);border-bottom:1px solid #eef1f3;vertical-align:top;line-height:1.35}\n' +
'#content .page-device table.parameter-list td{padding:.5em .75em;border-bottom:1px solid #eef1f3;vertical-align:top;line-height:1.35;word-break:break-word;overflow-wrap:anywhere}\n' +
'#content .page-device table.parameter-list tr:last-child>th,#content .page-device table.parameter-list tr:last-child>td{border-bottom:none}\n' +
'#content .page-device table.parameter-list tbody>tr:hover>th{background:#f1f3f5}\n' +
'#content .page-device table.parameter-list tbody>tr:hover>td{background:#f8f9fa}\n' +
'#content .page-device table.table{margin:0 0 .85rem;background:#fff;border:1px solid var(--bs-border-color,#dee2e6);border-radius:6px;border-collapse:separate;border-spacing:0}\n' +
'#content .page-device table.table th,#content .page-device table.table td{padding:.45em .6em;vertical-align:top;line-height:1.35}\n' +
'#content .page-device table.table td{white-space:normal;overflow:visible;text-overflow:clip;max-width:none;word-break:break-word;overflow-wrap:anywhere}\n' +
'#content .page-device .tags{margin:.2rem 0 .75rem}\n' +
'#content .page-device span.inform{display:inline-flex;flex-wrap:wrap;align-items:center;gap:.35rem}\n' +
'#content .page-device span.inform>*{margin-right:0}\n' +
'#content .page-device .all-parameters{margin:.5rem 0 .85rem;padding:.6rem .75rem;border:1px solid var(--bs-border-color,#dee2e6);border-radius:6px;background:#fff}\n' +
'#content .page-device .all-parameters>input{max-width:100%;width:100%;box-sizing:border-box;margin-bottom:.45rem}\n' +
'#content .page-device .all-parameters>.parameter-list{height:260px;border:1px solid #eef1f3;border-radius:4px;background:#fff}\n' +
'#content .page-device .container-full-width{margin:.25rem 0 .5rem}\n' +
'#content .page-device .container-right{margin:.25rem 0 .5rem .75rem}\n' +
'#content .page-device .actions-bar{margin:.5rem 0 .75rem}\n' +
end;
const re = /\/\* GENIEACS_DEVICE_VIEW_START \*\/[\s\S]*?\/\* GENIEACS_DEVICE_VIEW_END \*\//;
if (css.includes(start) && css.includes(end)) {
  const replaced = css.replace(re, block);
  if (replaced !== css) { fs.writeFileSync(cssPath, replaced); console.log('patched: device view css'); }
  else console.log('already: device view css');
} else {
  if (!css.endsWith('\n')) css += '\n';
  css += block + '\n';
  fs.writeFileSync(cssPath, css);
  console.log('patched: device view css appended');
}
console.log('done');
