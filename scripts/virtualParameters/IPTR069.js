// TR069 IP
let result = '';

if ("value" in args[1]) {
    result = args[1].value[0];
}

if (result === '' || result === '0.0.0.0') {
    let keys = [
        'InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANIPConnection.1.ExternalIPAddress',
        'InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANIPConnection.2.ExternalIPAddress',
        'InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANIPConnection.3.ExternalIPAddress',
        'InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANIPConnection.4.ExternalIPAddress',
        'InternetGatewayDevice.WANDevice.1.WANConnectionDevice.2.WANIPConnection.1.ExternalIPAddress',
        'InternetGatewayDevice.WANDevice.1.WANConnectionDevice.2.WANIPConnection.2.ExternalIPAddress',
        'InternetGatewayDevice.WANDevice.1.WANConnectionDevice.3.WANIPConnection.1.ExternalIPAddress',
        'InternetGatewayDevice.WANDevice.1.WANConnectionDevice.4.WANIPConnection.1.ExternalIPAddress',
        'InternetGatewayDevice.WANDevice.1.WANConnectionDevice.5.WANIPConnection.1.ExternalIPAddress',
        'InternetGatewayDevice.WANDevice.1.WANConnectionDevice.5.WANIPConnection.1.ExternalIPAddress',
        'InternetGatewayDevice.WANDevice.*.WANConnectionDevice.*.WANIPConnection.*.ExternalIPAddress',
        'Device.IP.Interface.1.IPv4Address.1.IPAddress'
    ];

    // === TOTOLINK compat (2026-11-18): root "Device." tidak didukung CPE lama ===
    const __merkInfo = declare('DeviceID.Manufacturer', {value: 1});
    const __merk = (__merkInfo && __merkInfo.value && __merkInfo.value[0]) || '';
    const __tipeInfo = declare('DeviceID.ProductClass', {value: 1});
    const __tipe = (__tipeInfo && __tipeInfo.value && __tipeInfo.value[0]) || '';
    const __isTotolink = __tipe.indexOf('TOTOLINK') >= 0 || __merk === 'TOTOLINK';
    if (__isTotolink) {
      for (let i = keys.length - 1; i >= 0; i--) {
        if (keys[i].indexOf('Device.') === 0) keys.splice(i, 1);
      }
    }
    result = getParameterValue(keys);

    // 2026-11-23: fallback untuk ONT PPPoE yang tidak punya WANIPConnection
    // tetapi ConnectionRequestURL tersedia (host/IPnya adalah IP WAN/TR069)
    if (!result) {
        let cr = declare("InternetGatewayDevice.ManagementServer.ConnectionRequestURL", {value: Date.now()});
        for (let p of cr) {
            let u = p && p.value && p.value[0];
            if (!u) continue;
            let m = /^(?:https?:\/\/)?([^\/:]+)/.exec(String(u).trim());
            if (m && m[1]) { result = m[1]; break; }
        }
    }
}

return {writable: false, value: [result, "xsd:string"]};

function getParameterValue(keys) {
    for (let key of keys) {
        if (key.includes('ExternalIPAddress')) {
            let connectionTypeKey = key.replace('ExternalIPAddress', 'ConnectionType');
            let connectionType = declare(connectionTypeKey, {value: Date.now()});
            if (connectionType.size && connectionType.value[0] === 'bridge') {
                continue;
            }
        }

        let d = declare(key, {path: Date.now() - (120 * 1000), value: Date.now()});

        for (let item of d) {
            if (item.value && item.value[0] && item.value[0] !== '0.0.0.0') {
                return item.value[0];
            }
        }
    }

    return '';
}
