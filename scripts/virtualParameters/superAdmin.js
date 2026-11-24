// 2026-11-24: superAdmin = USERNAME super admin (BUKAN password)
// Script lama adalah salinan superPassword.js sehingga kolom "Super Admin" di UI
// menampilkan password device (superoem, bumin3t@2020, dll).
// Sesuai keputusan: baca path username super admin per vendor, fallback "N/A".
// === TOTOLINK compat: hindari fault CWMP 9003 pada path vendor/root yang tak didukung ===
const __merkInfo = declare('DeviceID.Manufacturer', {value: 1});
const __merk = (__merkInfo && __merkInfo.value && __merkInfo.value[0]) || '';
const __tipeInfo = declare('DeviceID.ProductClass', {value: 1});
const __tipe = (__tipeInfo && __tipeInfo.value && __tipeInfo.value[0]) || '';
const __isTotolink = String(__tipe).indexOf('TOTOLINK') >= 0 || __merk === 'ZIONCOM' || __merk === 'TOTOLINK';
if (__isTotolink) {
  return {writable: false, value: ['N/A', 'xsd:string']};
}

// Path username super admin per vendor (bukan username admin biasa)
const paths = [
  'InternetGatewayDevice.DeviceInfo.X_FH_Account.X_FH_WebUserInfo.WebSuperUsername',
  'InternetGatewayDevice.UserInterface.X_ZTE-COM_WebUserInfo.AdminUserName',
  'InternetGatewayDevice.X_ZTE-COM_UserInterface.X_ZTE-COM_WebUserInfo.AdminUserName',
  'InternetGatewayDevice.UserInterface.X_HW_WebUserInfo.2.UserName',
  'InternetGatewayDevice.DeviceInfo.X_CT-COM_TeleComAccount.UserName'
];

function pickFirst(params) {
  if (!params) return '';
  try {
    if (!params.size) return '';
    for (let p of params) {
      if (p && p.value && p.value[0] != null) {
        let v = String(p.value[0]).trim();
        if (v && v !== 'N/A') return v;
      }
    }
  } catch (e) {}
  return '';
}

let m = '';

if (args[1].value) {
  // Mode tulis (summon dari UI): tulis ke path username super admin
  m = String(args[1].value[0] || '');
  paths.forEach(function(p) {
    try { declare(p, null, {value: m}); } catch (e) {}
  });
} else {
  // Mode baca: cari username super admin yang benar-benar ada di device
  for (let p of paths) {
    let d = declare(p, {value: Date.now()});
    m = pickFirst(d);
    if (m) break;
  }
}

return {writable: true, value: [m || 'N/A', 'xsd:string']};
