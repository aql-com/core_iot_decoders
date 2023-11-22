function parsePayload(payload, params) {
    function Decoder(bytes, fport) {
        var decoded = {};

        if (fport === 6) { // then its ReportDataCmd

            // full data is split over two separate uplink messages
            decoded.velocityx = bytestofloat16((bytes[4] << 8) + bytes[3]);
            decoded.velocityy = bytestofloat16((bytes[6] << 8) + bytes[5]);
            decoded.velocityz = bytestofloat16((bytes[8] << 8) + bytes[7]);
            decoded.temperature = ((bytes[9] << 24 >> 16) + bytes[10]);
        }
        return decoded;
    }

    function bytestofloat16(bytes) {
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
    return Decoder(payload, 6);
}