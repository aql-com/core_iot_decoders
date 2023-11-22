function parsePayload(payload, params) {

    class Netvox {

        static parse(bytes, parameters) {



            let decoded = {};
            decoded.devicetype = "R718AB";
            decoded.battery = bytes[3] / 10;

            decoded.velocityx = Netvox.bytestofloat16((bytes[4] << 8) + bytes[3]);
            decoded.velocityy = Netvox.bytestofloat16((bytes[6] << 8) + bytes[5]);
            decoded.velocityz = Netvox.bytestofloat16((bytes[8] << 8) + bytes[7]);

            decoded.accelerationx = Netvox.bytestofloat16((bytes[5] << 8) + bytes[4]);
            decoded.accelerationy = Netvox.bytestofloat16((bytes[7] << 8) + bytes[6]);
            decoded.accelerationz = Netvox.bytestofloat16((bytes[9] << 8) + bytes[8]);

            return decoded;
        }


        static bytestofloat16(bytes) {
            var sign = (bytes & 0x8000) ? -1 : 1;
            var exponent = ((bytes >> 7) & 0xFF) - 127;
            var significand = (bytes & ~(-1 << 7));

            if (exponent == 128)
                return 0.0;

            if (exponent == -127) {
                if (significand == 0) return sign * 0.0;
                exponent = -126;
                significand /= (1 << 6);
            } else significand = (significand | (1 << 7)) / (1 << 7);

            return sign * significand * Math.pow(2, exponent);
        }

    }

    return Netvox.parse(payload);

}