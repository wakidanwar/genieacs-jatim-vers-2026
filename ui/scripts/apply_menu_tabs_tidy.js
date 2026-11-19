#!/usr/bin/env node
const fs = require('fs');
const cssPath = '/usr/lib/node_modules/genieacs/public/app-LU66VFYW.css';
let css = fs.readFileSync(cssPath, 'utf8');
const start = '/* GENIEACS_MENU_TABS_TIDY_START */';
const end = '/* GENIEACS_MENU_TABS_TIDY_END */';
const block = start + '\n' +
/* Top navigation tabs */
'#header{background:#f8f9fa;border-bottom:1px solid var(--bs-border-color,#dee2e6)}\n' +
'#header>nav{bottom:0}\n' +
'#header>nav>ul{display:flex;align-items:flex-end;gap:4px;margin:0 12px;padding:0;list-style:none;font-weight:600}\n' +
'#header>nav>ul>li{margin:0;background:transparent;border:1px solid transparent;border-bottom:none;border-top-left-radius:8px;border-top-right-radius:8px;transition:background-color .15s ease,color .15s ease,border-color .15s ease}\n' +
'#header>nav>ul>li>a,#header>nav>ul>li>a:visited,#header>nav>ul>li>a:hover{display:block;min-width:108px;padding:9px 16px 8px;text-align:center;color:#495057;text-decoration:none;background:transparent !important;line-height:1.2}\n' +
'#header>nav>ul>li:hover{background:#e9ecef;border-color:#e9ecef #e9ecef transparent}\n' +
'#header>nav>ul>li:hover>a,#header>nav>ul>li:hover>a:visited,#header>nav>ul>li:hover>a:hover{color:#212529}\n' +
'#header>nav>ul>li.active{background:#fff;border-color:var(--bs-border-color,#dee2e6);border-bottom-color:#fff;margin-bottom:-1px;position:relative;z-index:1}\n' +
'#header>nav>ul>li.active>a,#header>nav>ul>li.active>a:visited,#header>nav>ul>li.active>a:hover{color:var(--color4,#046380);font-weight:700;padding-bottom:9px;background:#fff !important}\n' +
/* Side menu (admin) tidy */
'#side-menu{width:200px;min-width:200px;padding-top:6px}\n' +
'#side-menu>ul{margin:0;padding:0 8px 0 0;list-style:none}\n' +
'#side-menu>ul>li{margin:2px 0}\n' +
'#side-menu>ul>li>a,#side-menu>ul>li>a:visited{display:block;text-decoration:none;margin:0;padding:9px 12px;border-radius:0 8px 8px 0;background:transparent;color:#495057;font-weight:500;transition:background-color .15s ease,color .15s ease,border-color .15s ease}\n' +
'#side-menu>ul>li>a:hover{background:#e9ecef;color:#212529}\n' +
'#side-menu>ul>li.active>a,#side-menu>ul>li.active>a:visited{background:#e7f1f4;color:var(--color4,#046380);font-weight:600;border-left:3px solid var(--color4,#046380);padding-left:9px}\n' +
end;
const re = /\/\* GENIEACS_MENU_TABS_TIDY_START \*\/[\s\S]*?\/\* GENIEACS_MENU_TABS_TIDY_END \*\//;
if (css.includes(start) && css.includes(end)) {
  const replaced = css.replace(re, block);
  if (replaced !== css) { fs.writeFileSync(cssPath, replaced); console.log('css replaced'); }
  else console.log('css already');
} else {
  if (!css.endsWith('\n')) css += '\n';
  css += block + '\n';
  fs.writeFileSync(cssPath, css);
  console.log('css appended');
}
console.log('done');
