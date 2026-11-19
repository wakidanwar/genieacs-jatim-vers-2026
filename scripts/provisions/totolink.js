const now = Date.now();

// Refresh informasi dasar
declare("InternetGatewayDevice.DeviceInfo.SoftwareVersion", {value: now});
declare("InternetGatewayDevice.DeviceInfo.HardwareVersion", {value: now});

// Deklarasi WLAN Safe (Hanya membaca / mengaktifkan tanpa memaksa string password yang tidak valid)
declare("InternetGatewayDevice.LANDevice.1.WLANConfiguration.*", 
  {path: 1}, 
  {
    Enable: true
  }
);

// Deklarasi WAN PPP Safe
declare("InternetGatewayDevice.WANDevice.1.WANConnectionDevice.*.WANPPPConnection.*", 
  {path: 1}, 
  {
    Enable: true
  }
);