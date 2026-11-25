// Script Provision inform
const url = "http://<ACS_HOST>:7547";
// 2026-11-25: dinaikkan 200 -> 600 detik untuk menghemat CPU server
// (2 vCPU). Watchdog optik masih punya window online 30 menit, aman.
const informInterval = 600;

const daily = Date.now(86400000); 
const minutes = Date.now(300000);

const ConnReqUser = "<CONNREQ_USER>";
const ConnReqPass = "<CONNREQ_PASS>";

// Send ACS URL & Periodic Inform Settings
declare("InternetGatewayDevice.ManagementServer.URL", {value: daily}, {value: url});
declare("InternetGatewayDevice.ManagementServer.PeriodicInformEnable", {value: daily}, {value: true});
declare("InternetGatewayDevice.ManagementServer.PeriodicInformInterval", {value: daily}, {value: informInterval});

// Inject Connection Request Credentials ke Perangkat
declare("InternetGatewayDevice.ManagementServer.ConnectionRequestUsername", {value: daily}, {value: ConnReqUser});
declare("InternetGatewayDevice.ManagementServer.ConnectionRequestPassword", {value: daily}, {value: ConnReqPass});