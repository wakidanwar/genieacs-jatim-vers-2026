// PPPoE Username
// 2026-11-23: iterasi semua instance WANPPPConnection dan lewati Username kosong
// (ONT seperti GM220-S/CIOT punya beberapa instance PPP, yang aktif bisa di index .4)
let user = "";

function pickFirst(params) {
  if (!params) return "";
  try {
    if (!params.size) return "";
    for (let p of params) {
      if (p && p.value && p.value[0] != null) {
        let v = String(p.value[0]).trim();
        if (v && v !== "N/A") return v;
      }
    }
  } catch (e) {}
  return "";
}

if (args[1].value) {
  user = args[1].value[0];
  declare("InternetGatewayDevice.WANDevice.*.WANConnectionDevice.*.WANPPPConnection.*.Username", null, {value: user});
} else {
  let v1 = declare("InternetGatewayDevice.WANDevice.1.WANConnectionDevice.*.WANPPPConnection.1.Username", {value: Date.now()});
  let v2 = declare("InternetGatewayDevice.WANDevice.1.WANConnectionDevice.*.WANPPPConnection.2.Username", {value: Date.now()});
  let v3 = declare("InternetGatewayDevice.WANDevice.1.WANConnectionDevice.*.WANPPPConnection.3.Username", {value: Date.now()});
  let v4 = declare("InternetGatewayDevice.WANDevice.1.WANConnectionDevice.*.WANPPPConnection.4.Username", {value: Date.now()});
  let v5 = declare("InternetGatewayDevice.WANDevice.1.WANConnectionDevice.*.WANPPPConnection.5.Username", {value: Date.now()});
  let vAll = declare("InternetGatewayDevice.WANDevice.*.WANConnectionDevice.*.WANPPPConnection.*.Username", {value: Date.now()});

  user = pickFirst(v1) || pickFirst(v2) || pickFirst(v3) || pickFirst(v4) || pickFirst(v5) || pickFirst(vAll);
}

return {writable: true, value: [user, "xsd:string"]};
