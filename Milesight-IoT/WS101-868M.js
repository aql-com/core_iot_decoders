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
            // PRESS STATE
            else if (channel_id === 0xff && channel_type === 0x2e) {
                var type = payload[i];
                i += 1;

                switch (type) {
                    case 1:
                        decoded.press = 1;//"short";
                        break;
                    case 2:
                        decoded.press = 2;//"long";
                        break;
                    case 3:
                        decoded.press = 3//"double";
                        break;
                    default:
                        decoded.press = 0;//"unknown";
                        break;
                }
            } else {
                break;
            }
        }

        return decoded;
    }

    return milesight(payload);
}