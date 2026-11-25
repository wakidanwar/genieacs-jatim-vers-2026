// Script Provision inform
const url = "http://<ACS_HOST>:7547";
const informInterval = 200;

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