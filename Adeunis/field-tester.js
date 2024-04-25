function parsePayload(payload, params, fport) {
    var decoded = {};
    const bytes = payload;
    let offset = 0;
    if (offset + 1 <= bytes.length) {
        let status = bytes[offset++]; // bitmask indicating the presence of the other fields
        if (status & 0x80 && offset + 1 < bytes.length) {
            // Temperature information (degree Celsius)
            let temperature = bytes[offset];
            if (temperature > 127) {
                temperature = temperature - 256;
            }
            decoded.temperature = temperature;
            offset += 1;
        }
        if (status & 0x40) {
            // Transmission triggered by the accelerometer
            decoded.trigger =0;// "accelerometer";
        }
        if (status & 0x20) {
            // Transmission triggered by pressing the pushbutton
            decoded.trigger = 1 ;// "pushbutton";
        }
        if (status & 0x10 && offset + 9 <= bytes.length) {
            // GPS information
            let latDeg10   = bytes[offset] >> 4;
            let latDeg1    = bytes[offset] & 0x0f;
            let latMin10   = bytes[offset + 1] >> 4;
            let latMin1    = bytes[offset + 1] & 0x0f;
            let latMin01   = bytes[offset + 2] >> 4;
            let latMin001  = bytes[offset + 2] & 0x0f;
            let latMin0001 = bytes[offset + 3] >> 4;
            let latSign    = bytes[offset + 3] & 0x01 ? -1 : 1;
            decoded.latitude = latSign * (latDeg10 * 10 + latDeg1 + (latMin10 * 10 + latMin1 + latMin01 * 0.1 + latMin001 * 0.01 + latMin0001 * 0.001) / 60);
            let lonDeg100 = bytes[offset + 4] >> 4;
            let lonDeg10  = bytes[offset + 4] & 0x0f;
            let lonDeg1   = bytes[offset + 5] >> 4;
            let lonMin10  = bytes[offset + 5] & 0x0f;
            let lonMin1   = bytes[offset + 6] >> 4;
            let lonMin01  = bytes[offset + 6] & 0x0f;
            let lonMin001 = bytes[offset + 7] >> 4;
            let lonSign   = bytes[offset + 7] & 0x01 ? -1 : 1;
            decoded.longitude = lonSign * (lonDeg100 * 100 + lonDeg10 * 10 + lonDeg1 + (lonMin10 * 10 + lonMin1 + lonMin01 * 0.1 + lonMin001 * 0.01) / 60);
            decoded.altitude = 0; // altitude information not available
            decoded.sats = bytes[offset + 8] & 0x0f; // number of satellites
            offset += 9;
        }
        if (status & 0x08 && offset + 1 <= bytes.length) {
            // Uplink frame counter
            decoded.uplink = bytes[offset];
            offset += 1;
        }
        if (status & 0x04 && offset + 1 <= bytes.length) {
            // Downlink frame counter
            decoded.downlink = bytes[offset];
            offset += 1;
        }
        if (status & 0x02 && offset + 2 <= bytes.length) {
            // Battery level information (mV)
            decoded.battery = bytes[offset] << 8 | bytes[offset + 1];
            offset += 2;
        }
        if (status & 0x01 && offset + 2 <= bytes.length) {
            // RSSI (dBm) and SNR (dB) information
            decoded.rssi = - bytes[offset];
            let snr = bytes[offset + 1];
            if (snr > 127) {
                snr = snr - 256;
            }
            decoded.snr = snr;
            offset += 2;
        }
    }
    return decoded;
}