// === TOTOLINK compat (2026-11-18): hindari fault CWMP 9003 pada path vendor/root yang tak didukung ===
const __merkInfo = declare('DeviceID.Manufacturer', {value: 1});
const __merk = (__merkInfo && __merkInfo.value && __merkInfo.value[0]) || '';
const __tipeInfo = declare('DeviceID.ProductClass', {value: 1});
const __tipe = (__tipeInfo && __tipeInfo.value && __tipeInfo.value[0]) || '';
const __isTotolink = __tipe.indexOf('TOTOLINK') >= 0 || __merk === 'TOTOLINK';
if (__isTotolink) {
  return {writable: false, value: ['N/A', 'xsd:string']};
}

let m = "N/A";
let db = "";

// Deklarasi Path RXPower Perangkat
let cdata_xpon = declare("InternetGatewayDevice.DeviceInfo.XponInterface.RXPower", {value: Date.now()});
let gm220se = declare("InternetGatewayDevice.WANDevice.*.X_CT-COM_EponInterfaceConfig.RXPower", {value: Date.now()});
let gm220sg = declare("InternetGatewayDevice.WANDevice.*.X_CT-COM_GponInterfaceConfig.RXPower", {value: Date.now()});
let zte = declare("InternetGatewayDevice.WANDevice.*.X_ZTE-COM_WANPONInterfaceConfig.RXPower", {value: Date.now()});
let huawei = declare("InternetGatewayDevice.WANDevice.*.X_GponInterafceConfig.RXPower", {value: Date.now()});
let fiberhome = declare("InternetGatewayDevice.WANDevice.*.X_FH_GponInterfaceConfig.RXPower", {value: Date.now()});
let ztecmcc = declare("InternetGatewayDevice.WANDevice.*.X_CMCC_EponInterfaceConfig.RXPower", {value: Date.now()});
let ztecmcg = declare("InternetGatewayDevice.WANDevice.*.X_CMCC_GponInterfaceConfig.RXPower", {value: Date.now()});
let f477v2 = declare("InternetGatewayDevice.WANDevice.*.X_CU_WANEPONInterfaceConfig.OpticalTransceiver.RXPower", {value: Date.now()});
let nokia = declare("InternetGatewayDevice.X_ALU_OntOpticalParam.RXPower", {value: Date.now()});

// 1. Cek Path Utama C-Data (DeviceInfo.XponInterface)
if (cdata_xpon.size) {
  for (let p of cdata_xpon) {
    if (p.value && p.value[0]) {
      let valStr = p.value[0].toString();
      let val = parseFloat(valStr);
      if (!isNaN(val)) {
        m = val.toFixed(2);
      } else {
        m = valStr;
      }
      break;
    }
  }
}
// 2. Cek Path Alternate CT-COM Epon (Digunakan C-Data & ZTE/GM220SE)
else if (gm220se.size) {
  for (let p of gm220se) {
    if (p.value && p.value[0]) {
      let valStr = p.value[0].toString();
      let val = parseFloat(valStr);
      if (val < 0) {
        m = val.toFixed(2);
      } else if (val > 0) {
        db = 30 + (Math.log10((val * (Math.pow(10,-7))))*10);
        m = (Math.ceil(db * 100) / 100).toFixed(2);
      } else {
        m = valStr;
      }
      break;
    }
  }
}
else if (zte.size) {
   let zteval = zte.value[0];
   if (zteval < 0) {
      m = zteval;
   } else if (zteval > 0) {
      db = 30 + (Math.log10((zteval * (Math.pow(10,-7))))*10);
      m = Math.ceil(db * 100) / 100;
   }
}
else if (ztecmcc.size) {
   let zteval = ztecmcc.value[0];
   if (zteval < 0) {
      m = zteval;
   } else if (zteval > 0) {
      db = 30 + (Math.log10((zteval * (Math.pow(10,-7))))*10);
      m = Math.ceil(db * 100) / 100;
   }
}
else if (ztecmcg.size) {
   let zteval = ztecmcg.value[0];
   if (zteval < 0) {
      m = zteval;
   } else if (zteval > 0) {
      db = 30 + (Math.log10((zteval * (Math.pow(10,-7))))*10);
      m = Math.ceil(db * 100) / 100;
   }
}
else if (gm220sg.size) {
   let zteval = gm220sg.value[0];
   if (zteval < 0) {
      m = zteval;
   } else if (zteval > 0) {
      db = 30 + (Math.log10((zteval * (Math.pow(10,-7))))*10);
      m = Math.ceil(db * 100) / 100;
   }
}
else if (f477v2.size) {
   let zteval = f477v2.value[0];
   if (zteval < 0) {
      m = zteval;
   } else if (zteval > 0) {
      db = 30 + (Math.log10((zteval * (Math.pow(10,-7))))*10);
      m = Math.ceil(db * 100) / 100;
   }
}
else if (huawei.size) {
  for (let p of huawei) {
    if (p.value[0]) {
      m = p.value[0];
      break;
    }
  }
}
else if (fiberhome.size) {
  for (let p of fiberhome) {
    if (p.value[0]) {
      m = p.value[0];
      break;
    }
  }
}
else if (nokia.size) {
  for (let p of nokia) {
    if (p.value[0]) {
      m = p.value[0];
      break;
    }
  }
}

return {writable: false, value: [m, "xsd:string"]};