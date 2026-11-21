// Mac Address PPPoE Pada devices berbeda
// 2026-11-21: tambah fallback wildcard WANConnectionDevice/WANPPPConnection
// (ONT tertentu memakai WANConnectionDevice.3/.4, bukan hanya .1/.2)
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

if (w1.size) {
  for (let p of w1) {
    if (p.value[0]) {
      m = p.value[0];
      break;
    }
  }
}
else if (w2.size) {
  for (let p of w2) {
    if (p.value[0]) {
      m = p.value[0];
      break;
    }
  }
}
else if (w3.size) {
  for (let p of w3) {
    if (p.value[0]) {
      m = p.value[0];
      break;
    }
  }
}
else if (w4.size) {
  for (let p of w4) {
    if (p.value[0]) {
      m = p.value[0];
      break;
    }
  }
}

// Fallback: cari MAC PPP di index WANConnectionDevice/WANPPPConnection lain
if (!m) {
  let wall = declare("InternetGatewayDevice.WANDevice.*.WANConnectionDevice.*.WANPPPConnection.*.MACAddress", {value: Date.now()});
  m = pickFirst(wall);
}

return {writable: false, value: [m, "xsd:string"]};
