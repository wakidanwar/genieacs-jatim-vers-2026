// === TOTOLINK compat (2026-11-18): serial bukan hex PON, kembalikan nilai apa adanya ===
const __merkInfo = declare('DeviceID.Manufacturer', {value: 1});
const __merk = (__merkInfo && __merkInfo.value && __merkInfo.value[0]) || '';
const __tipeInfo = declare('DeviceID.ProductClass', {value: 1});
const __tipe = (__tipeInfo && __tipeInfo.value && __tipeInfo.value[0]) || '';
const __isTotolink = __tipe.indexOf('TOTOLINK') >= 0 || __merk === 'TOTOLINK';
if (__isTotolink) {
  const __snInfo = declare('DeviceID.SerialNumber', {value: 1});
  return {writable: false, value: (__snInfo && __snInfo.value && __snInfo.value[0]) || ''};
}


let serialNumber = "";
let sn = "";
let hexPart = "";

// Hex To Text
let hexToText = (hex) => {
  let text = "";
  for (let i = 0; i < hex.length; i += 2) {
    let hexCode = hex.substr(i, 2);
    let charCode = parseInt(hexCode, 16);
    // === Custom 2026-11-18: only decode printable ASCII (0x20-0x7E).
    // If any byte is a control character or non-ASCII, keep the original hex
    // so the UI does not render replacement boxes. ===
    if (charCode < 32 || charCode > 126) return hex;
    text += String.fromCharCode(charCode);
  }
  return text;
};
// Check Hex Or String
let isHexadecimal = (str) => {
  return /^[0-9A-Fa-f]+$/.test(str);
};
let ponmode = "";
let pon = declare("VirtualParameters.getponmode", {value: Date.now()});
  if (pon.size) {
    ponmode = pon.value[0];
  }
if (args[1].value) {
  serialNumber = args[1].value[0];
  if (!isHexadecimal(serialNumber)) {
    sn = serialNumber;
  } else if (serialNumber.includes("40ee15")) {
    sn = serialNumber;
  } else if (ponmode.includes("EPON")) {
    sn = serialNumber;
  } else {
    hexPart = serialNumber.substr(0, 8);
    let textPart = hexToText(hexPart);
    sn = textPart + serialNumber.substr(8);
  }
  declare("DeviceID.SerialNumber", null, {value: serialNumber});
}
else {
  let snvalue = declare("DeviceID.SerialNumber", {value: Date.now()});
  serialNumber = snvalue.value[0];
  if (!isHexadecimal(serialNumber)) {
    sn = serialNumber;
  } else if (serialNumber.includes("40ee15")) {
    sn = serialNumber;
  } else if (ponmode.includes("EPON")) {
    sn = serialNumber;
  } else {
    hexPart = serialNumber.substr(0, 8);
    let textPart = hexToText(hexPart);
    sn = textPart + serialNumber.substr(8);
  }
}

return {writable: false, value: sn};

