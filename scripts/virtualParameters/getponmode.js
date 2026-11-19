// === TOTOLINK compat (2026-11-18): hindari fault CWMP 9003 pada path vendor/root yang tak didukung ===
const __merkInfo = declare('DeviceID.Manufacturer', {value: 1});
const __merk = (__merkInfo && __merkInfo.value && __merkInfo.value[0]) || '';
const __tipeInfo = declare('DeviceID.ProductClass', {value: 1});
const __tipe = (__tipeInfo && __tipeInfo.value && __tipeInfo.value[0]) || '';
const __isTotolink = __tipe.indexOf('TOTOLINK') >= 0 || __merk === 'TOTOLINK';
if (__isTotolink) {
  return {writable: false, value: ['Ethernet', 'xsd:string']};
}

// Mendapatkan informasi PON
let pon = "";
if (args[1].value) {
  pon = args[1].value[0];
  declare("InternetGatewayDevice.DeviceInfo.X_HW_UpPortMode", {value: Date.now()});
  
}
else {
  
  let v1 = declare("InternetGatewayDevice.WANDevice.*.WANCommonInterfaceConfig.WANAccessType", {value: Date.now()});

  if (v1.size) {
    pon = v1.value[0];
  }
}

pon = pon.toUpperCase();

const brand = declare('DeviceID.Manufacturer', {value: Date.now(86400000)}).value[0];
if (brand === 'RAISECOM' || brand === 'Raisecom' ) {
  pon = "GPON";
} else if (pon.includes("EPON")) {
  pon = "EPON";
} else if (pon.includes("GPON")) {
  pon = "GPON";
} else if (pon.includes("PON")) {
  pon = "GPON";
} else {
  pon = "Ethernet";
}


return {writable: false, value: [pon, "xsd:string"]};