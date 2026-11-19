#!/usr/bin/env node
const fs = require('fs');
const jsPath = '/usr/lib/node_modules/genieacs/public/app-FOJWPRV7.js';
const cssPath = '/usr/lib/node_modules/genieacs/public/app-LU66VFYW.css';
let js = fs.readFileSync(jsPath, 'utf8');
const oldJs = 'var Lu=()=>({view:e=>{document.title="Overview - GenieACS";let t=[];for(let n of Object.values(fa)){n.label&&t.push(p("h1",G(n.label,null)));let r=[];for(let s of Object.values(n.charts)){let i=e.attrs.charts[s],o=[];i.label&&o.push(p("h2",G(i.label,null)));let a={};a.chart=i,o.push(p(ca,a)),r.push(p(".overview-chart",o))}t.push(p(".overview-chart-group",r))}return t}});';
const newJs = 'var Lu=()=>({view:e=>{document.title="Overview - GenieACS";let t=[];for(let n of Object.values(fa)){n.label&&t.push(p("h1",G(n.label,null)));let r=[];for(let s of Object.values(n.charts)){let i=e.attrs.charts[s],o=[];i.label&&o.push(p("h2",G(i.label,null)));let a={};a.chart=i,o.push(p(ca,a)),r.push(p(".overview-chart",o))}t.push(p(".overview-chart-group",r))}return p(".page-overview",t)}});';
if (js.includes(newJs)) console.log('js already');
else if (js.includes(oldJs)) { js = js.split(oldJs).join(newJs); fs.writeFileSync(jsPath, js); console.log('js patched'); }
else throw new Error('overview Lu not found');
let css = fs.readFileSync(cssPath, 'utf8');
const start = '/* GENIEACS_OVERVIEW_TIDY_START */';
const end = '/* GENIEACS_OVERVIEW_TIDY_END */';
const block = start + '\n' +
'#content.page-overview,#content .page-overview{padding:4px 8px 16px}\n' +
'#content.page-overview h1,#content .page-overview h1{text-align:left;font-size:1.1rem;font-weight:600;color:var(--color4);margin:1.25rem 0 .5rem;padding:0 0 .4rem;border-bottom:1px solid var(--bs-border-color);letter-spacing:.01em}\n' +
'#content.page-overview h1:first-child,#content .page-overview h1:first-child{margin-top:.25rem}\n' +
'#content.page-overview .overview-chart-group,#content .page-overview .overview-chart-group{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:1rem;align-items:stretch;justify-content:stretch;margin:0 0 .75rem}\n' +
'#content.page-overview .overview-chart,#content .page-overview .overview-chart{display:flex;flex-direction:column;min-width:0;margin:0;padding:1rem 1rem .75rem;background:#fff;border:1px solid var(--bs-border-color);border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,.06)}\n' +
'#content.page-overview .overview-chart>h2,#content .page-overview .overview-chart>h2{margin:0 0 .25rem;padding-bottom:.35rem;font-size:1rem;font-weight:600;color:#334155;text-align:center;border-bottom:1px solid #f1f3f5}\n' +
'#content.page-overview .pie-chart,#content .page-overview .pie-chart{margin:.25rem auto 0;width:100%;max-width:320px}\n' +
'#content.page-overview .pie-chart>svg,#content .page-overview .pie-chart>svg{display:block;margin:0 auto;max-width:100%;height:auto}\n' +
'#content.page-overview .pie-chart>.legend,#content .page-overview .pie-chart>.legend{margin:.5rem 0 0;padding-top:.5rem;border-top:1px solid #eef1f3;font-size:.92rem;text-align:left}\n' +
'#content.page-overview .pie-chart>.legend>.legend-line,#content .page-overview .pie-chart>.legend>.legend-line{display:flex;align-items:center;flex-wrap:wrap;gap:2px 4px;padding:3px 0;line-height:1.4}\n' +
'#content.page-overview .pie-chart>.legend>.legend-line>.color,#content .page-overview .pie-chart>.legend>.legend-line>.color{width:10px;height:10px;border-radius:2px;margin-right:4px;flex:0 0 auto;border:1px solid rgba(0,0,0,.12)}\n' +
'#content.page-overview .pie-chart>.legend>.legend-line>a,#content .page-overview .pie-chart>.legend>.legend-line>a{font-weight:600}\n' +
'#content.page-overview .pie-chart>.legend>.legend-total,#content .page-overview .pie-chart>.legend>.legend-total{display:block;margin-top:.4rem;padding-top:.4rem;border-top:1px dashed #e5e7eb;font-weight:600;color:#334155;text-align:right}\n' +
end;
const re = /\/\* GENIEACS_OVERVIEW_TIDY_START \*\/[\s\S]*?\/\* GENIEACS_OVERVIEW_TIDY_END \*\//;
if (css.includes(start) && css.includes(end)) {
  const replaced = css.replace(re, block);
  if (replaced !== css) { fs.writeFileSync(cssPath, replaced); console.log('css replaced'); } else console.log('css already');
} else {
  if (!css.endsWith('\n')) css += '\n';
  css += block + '\n';
  fs.writeFileSync(cssPath, css);
  console.log('css appended');
}
console.log('done');
