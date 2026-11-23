// Mac Address PPPoE Pada devices berbeda
// 2026-11-21: tambah fallback wildcard WANConnectionDevice/WANPPPConnection
// 2026-11-23: lewati nilai invalid (00:00:...) pada semua kandidat
let m = "";
let w1 = declare("InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANPPPConnection.1.MACAddress", {value: Date.now()});
let w2 = declare("InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANPPPConnection.2.MACAddress", {value: Date.now()});
let w3 = declare("InternetGatewayDevice.WANDevice.1.WANConnectionDevice.2.WANPPPConnection.1.MACAddress", {value: Date.now()});
let w4 = declare("InternetGatewayDevice.WANDevice.1.WANConnectionDevice.2.WANPPPConnection.2.MACAddress", {value: Date.now()});

function pickFirst(params) {
  if (!params || !params.size) return "";
  for (let p of params) {
    if (p && p.value && p.value[0] != null) {
      let v = String(p.value[0]).trim();
      if (v && v !== "N/A" && v !== "00:00:00:00:00:00" && v !== "00:00:00:00:00:00:00") {
        return v;
      }
    }
  }
  return "";
}

// Prioritas sama seperti sebelumnya, tapi nilai invalid tidak dipilih
m = pickFirst(w1) || pickFirst(w2) || pickFirst(w3) || pickFirst(w4);

// Fallback: cari MAC PPP di index WANConnectionDevice/WANPPPConnection lain
// (ONT tertentu memakai .3/.4, mis. C-DATA/CIOT/F663)
if (!m) {
  let wall = declare("InternetGatewayDevice.WANDevice.*.WANConnectionDevice.*.WANPPPConnection.*.MACAddress", {value: Date.now()});
  m = pickFirst(wall);
}

return {writable: false, value: [m, "xsd:string"]};
