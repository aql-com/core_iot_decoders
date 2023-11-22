function parsePayload(payload, params) {
    class Netvox {
        static parse(bytes, parameters) {
            let decoded = {};
            decoded.devicetype = "R718AB";
            decoded.battery = bytes[3] / 10;
            decoded.temperature = ((bytes[4] << 24 >> 16) + bytes[5]) / 100;
            decoded.humidity = ((bytes[6] << 8) + bytes[7]) / 100;
            return decoded;
        }

    }
    return Netvox.parse(payload);
}