// Mac Address PON (improved 2026-11-18): fallback to LAN/PPP MAC, keep TOTOLINK/X_CU guard
let m = "";

const __merkInfo = declare('DeviceID.Manufacturer', {value: 1});
const __merk = (__merkInfo && __merkInfo.value && __merkInfo.value[0]) || '';
const __tipeInfo = declare('DeviceID.ProductClass', {value: 1});
const __tipe = (__tipeInfo && __tipeInfo.value && __tipeInfo.value[0]) || '';
const __isTotolink = String(__tipe).indexOf('TOTOLINK') >= 0 || __merk === 'ZIONCOM' || __merk === 'TOTOLINK';

function pickFirst(params) {
  if (!params) return "";
  try {
    if (!params.size) return "";
    for (let p of params) {
      if (p && p.value && p.value[0] != null) {
        let v = String(p.value[0]).trim();
        if (v && v !== "N/A" && v !== "00:00:00:00:00:00" && v !== "00:00:00:00:00:00:00") {
          return v;
        }
      }
    }
  } catch (e) {}
  return "";
}

let xcu = __isTotolink ? [] : declare("InternetGatewayDevice.DeviceInfo.X_CU_SerialNumber", {value: Date.now()});
let lan = declare("InternetGatewayDevice.LANDevice.1.LANHostConfigManagement.MACAddress", {value: Date.now()});
let w11 = declare("InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANPPPConnection.1.MACAddress", {value: Date.now()});
let w12 = declare("InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANPPPConnection.2.MACAddress", {value: Date.now()});
let w21 = declare("InternetGatewayDevice.WANDevice.1.WANConnectionDevice.2.WANPPPConnection.1.MACAddress", {value: Date.now()});
let w22 = declare("InternetGatewayDevice.WANDevice.1.WANConnectionDevice.2.WANPPPConnection.2.MACAddress", {value: Date.now()});

if (!__isTotolink) {
  m = pickFirst(xcu) || pickFirst(lan) || pickFirst(w11) || pickFirst(w12) || pickFirst(w21) || pickFirst(w22);
} else {
  // TOTOLINK/ZIONCOM: avoid X_CU path; prefer PPP/LAN MAC
  m = pickFirst(w11) || pickFirst(w12) || pickFirst(w21) || pickFirst(w22) || pickFirst(lan);
}

// final fallback: try other common PPP path reads if still empty (already attempted above)
// normalize? keep as-is

return {writable: false, value: [m, "xsd:string"]};
