#!/usr/bin/env node
const fs = require('fs');
const { execSync } = require('child_process');

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

// 1) Summon icon button: blue class, remove inline view (view moved to Status column)
const oldMu = 'var mu=()=>({view:e=>{let t=e.attrs.device,d=t["DeviceID.ID"].value[0];return p("span",{class:"row-inline-actions"},[p("button.icon-action-btn",{title:"Summon: initiate session and refresh basic parameters","aria-label":"Summon",onclick:n=>{let b=n.currentTarget;b.disabled=!0;let s={name:"getParameterValues",parameterNames:Object.values(e.attrs.parameters).map(i=>!Array.isArray(i)||i[0]!=="PARAM"?null:G(i[1],t)).filter(i=>!!i),device:d};On([s],(i,o,a,l)=>{if(o){I("error",`${i}: ${o.message}`);return}for(let f of l)f.status==="stale"&&Tn(f);a!=="OK"?I("error",`${i}: ${a}`):l[0].status==="stale"?I("error",`${i}: No contact from device`):l[0].status==="fault"?I("error",`${i}: Refresh faulted`):I("success",`${i}: Summoned`)}).then(()=>{b.disabled=!1,j(Date.now())}).catch(i=>{b.disabled=!1,I("error",i.message)})}},ve("refresh")),p("a",{href:`#!/devices/${encodeURIComponent(d)}`,class:"icon-action-btn",title:"View device","aria-label":"View device"},ve("view"))])}}),Go=mu;';
const newMu = 'var mu=()=>({view:e=>{let t=e.attrs.device,d=t["DeviceID.ID"].value[0];return p("span",{class:"row-inline-actions"},p("button.icon-action-btn summon-btn",{title:"Summon: initiate session and refresh basic parameters","aria-label":"Summon",onclick:n=>{let b=n.currentTarget;b.disabled=!0;let s={name:"getParameterValues",parameterNames:Object.values(e.attrs.parameters).map(i=>!Array.isArray(i)||i[0]!=="PARAM"?null:G(i[1],t)).filter(i=>!!i),device:d};On([s],(i,o,a,l)=>{if(o){I("error",`${i}: ${o.message}`);return}for(let f of l)f.status==="stale"&&Tn(f);a!=="OK"?I("error",`${i}: ${a}`):l[0].status==="stale"?I("error",`${i}: No contact from device`):l[0].status==="fault"?I("error",`${i}: Refresh faulted`):I("success",`${i}: Summoned`)}).then(()=>{b.disabled=!1,j(Date.now())}).catch(i=>{b.disabled=!1,I("error",i.message)})}},ve("refresh")))}}),Go=mu;';

// 2) device-link: support icon-only preview link
const oldSa = 'var Su=()=>({view:e=>{let t,n=e.attrs.device;n&&(t=n["DeviceID.ID"].value[0]);let r=Object.values(e.attrs.components).map(s=>{if(Array.isArray(s)&&(s=G(s,n||{})),typeof s!="object")return`${s}`;let i=G(s.type,n||{});if(!i)return null;let o=Object.assign({},e.attrs,s);return p(i,o)});return t?p("a",{href:`#!/devices/${encodeURIComponent(t)}`},r):r}}),sa=Su;';
const newSa = 'var Su=()=>({view:e=>{let t,n=e.attrs.device;n&&(t=n["DeviceID.ID"].value[0]);if(e.attrs.icon){let ic=G(e.attrs.icon,n||{}),cl=G(e.attrs.class,n||{})||"",ti=G(e.attrs.title,n||{})||"View device";return t?p("a",{href:`#!/devices/${encodeURIComponent(t)}`,class:("icon-action-btn"+(cl?" "+cl:"")),title:ti,"aria-label":ti},ve(ic)):null}let r=Object.values(e.attrs.components||{}).map(s=>{if(Array.isArray(s)&&(s=G(s,n||{})),typeof s!="object")return`${s}`;let i=G(s.type,n||{});if(!i)return null;let o=Object.assign({},e.attrs,s);return p(i,o)});return t?p("a",{href:`#!/devices/${encodeURIComponent(t)}`},r):r}}),sa=Su;';

// 3) Tags: compact markup
const oldTags = 'var Eu=()=>({view:e=>{let t=e.attrs.device,n=!0;"writable"in e.attrs&&(n=!!G(e.attrs.writable,t));let r=[];for(let s of Object.keys(t))s.startsWith("Tags.")&&r.push(Kr(s.slice(5)));return r.sort(),n?p(".tags",r.map(s=>p("span.tag",s,p("button",{onclick:i=>{i.target.disabled=!0;let o=t["DeviceID.ID"].value[0];yr(o,{[s]:!1}).then(()=>{i.target.disabled=!1,I("success",`${o}: Tags updated`),j(Date.now())}).catch(a=>{i.target.disabled=!1,I("error",`${o}: ${a.message}`)})}},ve("remove")))),p("span.tag.writable",p.trust("&nbsp;"),p("button",{onclick:s=>{s.target.disabled=!0;let i=t["DeviceID.ID"].value[0],o=prompt("Enter tag to assign to device:");if(!o){s.target.disabled=!1;return}yr(i,{[o]:!0}).then(()=>{s.target.disabled=!1,I("success",`${i}: Tags updated`),j(Date.now())}).catch(a=>{s.target.disabled=!1,I("error",`${i}: ${a.message}`)})}},ve("add")))):p(".tags",r.map(s=>p("span.tag",s)))}}),';
const newTags = 'var Eu=()=>({view:e=>{let t=e.attrs.device,n=!0;"writable"in e.attrs&&(n=!!G(e.attrs.writable,t));let r=[];for(let s of Object.keys(t))s.startsWith("Tags.")&&r.push(Kr(s.slice(5)));return r.sort(),n?p(".tags",r.map(s=>p("span.tag",p("span",s),p("button",{title:"Remove tag",onclick:i=>{i.target.disabled=!0;let o=t["DeviceID.ID"].value[0];yr(o,{[s]:!1}).then(()=>{i.target.disabled=!1,I("success",`${o}: Tags updated`),j(Date.now())}).catch(a=>{i.target.disabled=!1,I("error",`${o}: ${a.message}`)})}},ve("remove")))),p("span.tag.tag-add",p("button",{title:"Add tag",onclick:s=>{s.target.disabled=!0;let i=t["DeviceID.ID"].value[0],o=prompt("Enter tag to assign to device:");if(!o){s.target.disabled=!1;return}yr(i,{[o]:!0}).then(()=>{s.target.disabled=!1,I("success",`${i}: Tags updated`),j(Date.now())}).catch(a=>{s.target.disabled=!1,I("error",`${i}: ${a.message}`)})}},ve("add")))):p(".tags",r.map(s=>p("span.tag",p("span",s))))}}),';

patchFile(jsPath, [
  { name: 'summon button blue/moved-view', oldStr: oldMu, newStr: newMu },
  { name: 'device-link icon-only support', oldStr: oldSa, newStr: newSa },
  { name: 'tags compact markup', oldStr: oldTags, newStr: newTags },
]);

// 4) CSS block
let css = fs.readFileSync(cssPath, 'utf8');
const start = '/* GENIEACS_DEVICES_UI_TWEAK_START */';
const end = '/* GENIEACS_DEVICES_UI_TWEAK_END */';
const block = start + '\n' +
'#content .row-inline-actions button.icon-action-btn.summon-btn{background:#0d6efd !important;border-color:#0d6efd !important;color:#fff !important}\n' +
'#content .row-inline-actions button.icon-action-btn.summon-btn:hover{background:#0b5ed7 !important;border-color:#0a58ca !important;color:#fff !important}\n' +
'#content .row-inline-actions button.icon-action-btn.summon-btn:disabled{background:#6ea8fe !important;border-color:#6ea8fe !important;color:#fff !important;opacity:.85}\n' +
'#content td span.inform{display:inline-flex;align-items:center;gap:4px}\n' +
'#content td span.inform .overview-dot{display:inline-flex;align-items:center}\n' +
'#content a.icon-action-btn.status-preview-btn{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;padding:0;border:1px solid #ced4da;border-radius:4px;background:#fff;color:#495057;text-decoration:none;line-height:1;cursor:pointer;box-sizing:border-box;vertical-align:middle;margin-left:4px;flex:0 0 auto}\n' +
'#content a.icon-action-btn.status-preview-btn:hover{background:#e9ecef;color:#212529;text-decoration:none}\n' +
'#content a.icon-action-btn.status-preview-btn svg.icon{width:16px;height:16px;display:block;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}\n' +
'#content .tags{display:inline-flex;flex-wrap:wrap;gap:4px;align-items:center;margin:0}\n' +
'#content .tags .tag{background-image:none!important;background:#e9ecef;border:1px solid #ced4da;border-radius:999px;padding:1px 7px 1px 8px;font-size:12px;line-height:1.5;display:inline-flex;align-items:center;gap:4px;margin:0!important;color:#495057;white-space:nowrap}\n' +
'#content .tags .tag button{padding:0;margin:0;border:0;background:transparent!important;color:inherit;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;line-height:1;min-width:0;width:auto;height:auto}\n' +
'#content .tags .tag button .icon{width:12px;height:12px;display:block}\n' +
'#content .tags .tag button:hover{color:#dc3545}\n' +
'#content .tags .tag.tag-add{padding:1px 5px}\n' +
'#content .tags .tag.tag-add button:hover{color:#0d6efd}\n' +
end;
const re = /\/\* GENIEACS_DEVICES_UI_TWEAK_START \*\/[\s\S]*?\/\* GENIEACS_DEVICES_UI_TWEAK_END \*\//;
if (css.includes(start) && css.includes(end)) {
  const replaced = css.replace(re, block);
  if (replaced !== css) { fs.writeFileSync(cssPath, replaced); console.log('patched: ui tweak css'); }
  else console.log('already: ui tweak css');
} else {
  if (!css.endsWith('\n')) css += '\n';
  css += block + '\n';
  fs.writeFileSync(cssPath, css);
  console.log('patched: ui tweak css appended');
}

// 5) Move preview to right of Status column (ui.index.2.components.2 = device-link icon)
const mongo = `
var c2 = db.config.findOne({_id:"ui.index.2.components.2.type"});
if (!c2 || c2.value !== "'device-link'") {
  db.config.updateOne({_id:"ui.index.2.components.2.type"}, {$set:{value:"'device-link'"}}, {upsert:true});
  db.config.updateOne({_id:"ui.index.2.components.2.icon"}, {$set:{value:"'view'"}}, {upsert:true});
  db.config.updateOne({_id:"ui.index.2.components.2.class"}, {$set:{value:"'status-preview-btn'"}}, {upsert:true});
  db.config.updateOne({_id:"ui.index.2.components.2.title"}, {$set:{value:"'View device'"}}, {upsert:true});
  print("patched: status preview component");
} else {
  // ensure fields
  db.config.updateOne({_id:"ui.index.2.components.2.icon"}, {$set:{value:"'view'"}}, {upsert:true});
  db.config.updateOne({_id:"ui.index.2.components.2.class"}, {$set:{value:"'status-preview-btn'"}}, {upsert:true});
  db.config.updateOne({_id:"ui.index.2.components.2.title"}, {$set:{value:"'View device'"}}, {upsert:true});
  print("already: status preview component");
}
`;
try {
  const out = execSync('mongosh genieacs --quiet', { input: mongo, encoding: 'utf8' });
  process.stdout.write(out);
} catch (e) {
  console.error('mongo update failed');
  if (e.stdout) process.stdout.write(e.stdout);
  if (e.stderr) process.stderr.write(e.stderr);
  process.exit(1);
}

console.log('done');
