function parsePayload(payload, params) {

    class Netvox {

        static parse(bytes, parameters) {


            let hexString = Netvox.convertDecimalArrayToHexString(bytes);
            bytes = Netvox.slicePayload(hexString);
            var decoded = {};
            /* decoded.version = Netvox.hexToDec(bytes[0]);
             decoded.devicetype = bytes[1];
             decoded.reporttype = Netvox.hexToDec(bytes[2]);*/
            decoded.battery = Netvox.hexToDec(bytes[3]) * 0.1;
            decoded.distance = Netvox.hexToDec(bytes[5] + bytes[6])/100;
            decoded.percentFull = Netvox.hexToDec(bytes[7]);
            return decoded;
        }

        static slicePayload(string) {
            let chunks = [];
            const chunkSize = 2;
            for (let i = 0; i < string.length; i += chunkSize) {
                const chunk = string.slice(i, i + chunkSize);
                chunks.push(chunk);
            }
            return chunks;
        }

        static hexToDec(input) {
            return parseInt(input, 16);
        }

        static decToHex(input) {
            return input.toString(16);
        }

        static convertDecimalArrayToHexString(decimalArray) {
            let hexArray = decimalArray.map((x) => {
                let hex = Netvox.decToHex(x);
                if (hex.length == 1) {
                    return "0" + hex;
                }
                return hex;
            });
            return hexArray.join("");
        }

    }


    return Netvox.parse(payload);




}