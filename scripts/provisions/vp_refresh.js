// Refresh virtual parameter saja (aman: tidak menulis konfigurasi perangkat)
// Dibuat 2026-11-23 karena provision "default" dinonaktifkan (return;), sehingga
// nilai VP lama/stale pada banyak ONT tidak pernah diperbarui saat inform.
// Preset "vp_refresh" menjalankan provision ini pada channel default setiap inform.

const daily = Date.now(86400000);
const weekly = Date.now(604800000);
const hourly = Date.now(3590000);
const update = Date.now(60000);
const minutes = Date.now(60000);

function deviceIdValue(name) {
  try {
    let d = declare(name, {value: 1});
    return (d && d.value && d.value[0]) || "";
  } catch (e) {
    return "";
  }
}

const merk = deviceIdValue("DeviceID.Manufacturer");
const tipe = deviceIdValue("DeviceID.ProductClass");
const isTotolink = String(tipe).indexOf("TOTOLINK") >= 0 || merk === "ZIONCOM" || merk === "TOTOLINK";

// ZIONCOM/TOTOLINK sengaja tidak mengambil VP optik/TR069 (path tidak didukung)
if (!isTotolink) {
  declare("VirtualParameters.IPTR069", {path: hourly, value: hourly});
  declare("VirtualParameters.RXPower", {path: update, value: update});
  declare("VirtualParameters.gettemp", {path: minutes, value: minutes});
  declare("VirtualParameters.activedevices", {path: update, value: update});
}

declare("VirtualParameters.Vendor", {path: daily, value: daily});
declare("VirtualParameters.WlanPassword", {path: hourly, value: hourly});
declare("VirtualParameters.getponmode", {path: daily, value: daily});
declare("VirtualParameters.pppoeMac", {path: hourly, value: hourly});
declare("VirtualParameters.pppoePassword", {path: hourly, value: hourly});
declare("VirtualParameters.pppoeUsername", {path: hourly, value: hourly});
declare("VirtualParameters.pppoeUsername2", {path: hourly, value: hourly});
declare("VirtualParameters.PonMac", {path: daily, value: daily});
declare("VirtualParameters.getSerialNumber", {path: daily, value: daily});
declare("VirtualParameters.pppoeIP", {path: minutes, value: minutes});
declare("VirtualParameters.getdeviceuptime", {path: minutes, value: minutes});
declare("VirtualParameters.getpppuptime", {path: minutes, value: minutes});

// Admin Web: refresh baca dari device. Provision "useradmin" tetap menangani
// penulisan kredensial saat BOOTSTRAP (tidak diubah agar tidak menimpa password device).
declare("VirtualParameters.userAdmin", {path: daily, value: daily});
declare("VirtualParameters.userPassword", {path: daily, value: daily});
declare("VirtualParameters.superAdmin", {path: daily, value: daily});
declare("VirtualParameters.superPassword", {path: daily, value: daily});

// 2026-11-25: refresh STRUKTUR subtree WANDevice.1 agar object optik
// (mis. X_CT-COM_EponInterfaceConfig) ikut ter-discover di cache GenieACS.
// Tanpa ini, wildcard di VP RXPower/gettemp tidak punya path saat tree belum lengkap.
// Router (TOTOLINK/ZIONCOM, TP-Link/Archer, MikroTik, RAISECOM) dilewati.
// 2026-11-25: frekuensi diturunkan daily -> weekly untuk hemat CPU;
// device dengan tree belum lengkap tetap di-heal watchdog harian 03:00 WIB.
const routerRe = /TOTOLINK|ZIONCOM|TP-LINK|TP-Link|Archer|MikroTik|RAISECOM|Raisecom/i;
if (!routerRe.test(String(merk)) && !routerRe.test(String(tipe))) {
  try { declare("InternetGatewayDevice.WANDevice.1.", {path: weekly}); } catch (e) {}
}
