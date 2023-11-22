function parsePayload(payload, params, fport) {

    function milesight(payload) {
        var decoded = {};

        for (var i = 0; i < payload.length; ) {
            var channel_id = payload[i++];
            var channel_type = payload[i++];
            // BATTERY
            if (channel_id === 0x01 && channel_type === 0x75) {
                decoded.battery = payload[i];
                i += 1;
            }
            // TEMPERATURE
            else if (channel_id === 0x03 && channel_type === 0x67) {
                // ℃
                decoded.temperature = readInt16LE(payload.slice(i, i + 2)) / 10;
                i += 2;

                // ℉
                // decoded.temperature = readInt16LE(payload.slice(i, i + 2)) / 10 * 1.8 + 32;
                // i +=2;
            }
            // HUMIDITY
            else if (channel_id === 0x04 && channel_type === 0x68) {
                decoded.humidity = payload[i] / 2;
                i += 1;
            }
            // MAGNET STATUS
            else if (channel_id === 0x06 && channel_type === 0x00) {
                decoded.magnet_status = payload[i] === 0 ? 0 : 1;
                i += 1;
            }
            // TEMPERATURE、HUMIDITY & MAGNET STATUS HISTROY
            else if (channel_id === 0x20 && channel_type === 0xce) {
                var point = {};
                point.timestamp = readUInt32LE(payload.slice(i, i + 4));
                point.temperature = readInt16LE(payload.slice(i + 4, i + 6)) / 10;
                point.humidity = payload[i + 6] / 2;
                point.magnet_status = payload[i + 7] === 0 ? 0 : 1;

                decoded.history = decoded.history || [];
                decoded.history.push(point);
                i += 8;
            } else {
                break;
            }
        }

        return decoded;
    }

    /* ******************************************
     * payload to number
     ********************************************/
    function readUInt16LE(payload) {
        var value = (payload[1] << 8) + payload[0];
        return value & 0xffff;
    }

    function readInt16LE(payload) {
        var ref = readUInt16LE(payload);
        return ref > 0x7fff ? ref - 0x10000 : ref;
    }

    function readUInt32LE(payload) {
        var value = (payload[3] << 24) + (payload[2] << 16) + (payload[1] << 8) + payload[0];
        return value & 0xffffffff;
    }

    return milesight(payload)
}