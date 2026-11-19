let manufacturer = declare("DeviceID.Manufacturer", {value: 1}).value[0];
let oui = declare("DeviceID.OUI", {value: 1}).value[0];
let productClass = declare("DeviceID.ProductClass", {value: 1}).value[0];

let vendor = "Other";

// 1. Filter C-Data (berdasarkan OUI 505B1D atau Model FD514GD)
if (oui === "505B1D" || (productClass && productClass.toUpperCase().includes("FD514GD"))) {
  vendor = "C-Data";
}
// 2. Filter Zimmlink
else if ((manufacturer && manufacturer.toUpperCase().includes("ZIMMLINK")) || (productClass && productClass.toUpperCase().includes("ZIMMLINK"))) {
  vendor = "Zimmlink";
}
// 3. Filter BT-PON
else if ((manufacturer && manufacturer.toUpperCase().includes("BTPON")) || (productClass && productClass.toUpperCase().includes("BTPON"))) {
  vendor = "BT-PON";
}
// 4. Filter Totolink / Zioncom
else if (manufacturer === "TOTOLINK" || manufacturer === "ZIONCOM") {
  vendor = "Totolink";
}
// 5. Filter ZTE / ZICG
else if (manufacturer === "ZICG" || manufacturer === "ZTEG" || manufacturer === "ZTE") {
  vendor = "ZTE";
}
// 6. Vendor Lainnya
else if (manufacturer) {
  vendor = manufacturer;
}

return {writable: false, value: [vendor, "xsd:string"]};