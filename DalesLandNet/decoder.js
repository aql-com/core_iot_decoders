function parsePayload(payload, params) {

    class DLN_Message_Decode {
        // Helper Functions
        static sflt162f(rawSflt16) {
            // rawSflt16 is the 2-byte number decoded from wherever;
            // it's in range 0..0xFFFF
            // bit 15 is the sign bit
            // bits 14..11 are the exponent
            // bits 10..0 are the the mantissa. Unlike IEEE format,
            // 	the msb is explicit; this means that numbers
            //	might not be normalized, but makes coding for
            //	underflow easier.
            // As with IEEE format, negative zero is possible, so
            // we special-case that in hopes that JavaScript will
            // also cooperate.
            //
            // The result is a number in the open interval (-1.0, 1.0);
            //

            // throw away high bits for repeatability.
            rawSflt16 &= 0xFFFF;

            // special case minus zero:
            if (rawSflt16 == 0x8000)
                return -0.0;

            // extract the sign.
            var sSign = ((rawSflt16 & 0x8000) != 0) ? -1 : 1;

            // extract the exponent
            var exp1 = (rawSflt16 >> 11) & 0xF;

            // extract the "mantissa" (the fractional part)
            var mant1 = (rawSflt16 & 0x7FF) / 2048.0;

            // convert back to a floating point number. We hope
            // that Math.pow(2, k) is handled efficiently by
            // the JS interpreter! If this is time critical code,
            // you can replace by a suitable shift and divide.
            var f_unscaled = sSign * mant1 * Math.pow(2, exp1 - 15);

            return f_unscaled;
        }

        static hexStringtoArr(hexStr) {
            var bytes = [];
            for (var i=0; i<hexStr.length; i+=2)
                bytes.push(parseInt(hexStr.substring(i, i+2), 16));
            return bytes;
        }

        static round(value, decPlaces=4) {
            let decPlacesScale = Math.pow(10, decPlaces);
            return Math.round( (value + Number.EPSILON) * decPlacesScale) / decPlacesScale;
        };

        static decode_version(MSB, LSB) {
            let version_integer = (MSB << 8) | LSB;
            let version_raw_string = String(version_integer);
            var version_number = "";
            switch (version_raw_string.length) {
                case 1:
                    version_number = String.format("0.0.%s", version_raw_string[0]);
                    break;
                case 2:
                    version_number = String.format("0.%s.%s", version_raw_string[0], version_raw_string[1]);
                    break;
                case 3:
                    version_number = String.format("%s.%s.%s", version_raw_string[0], version_raw_string[1], version_raw_string[2]);
                    break;
                default:
                    version_number = "?.?.?";
            };
        }

        static decode_battery_voltage(raw_value) {
            return DLN_Message_Decode.round(raw_value * ((10-2.8) / 127) + 2.8);
        }

        // Decoding Functions

        // Decode the message stored in 'str_msg'. Expects a hex string with no '0x' prefix
        static decode_str_msg(byte_arr, json_params) {
            // Convert message to byte array
            // let byte_arr = DLN_Message_Decode.hexStringtoArr(str_msg);

            // Extract message type and downlink request flags
            let msg_type = byte_arr[0] & 0x7F;
            let down_link = byte_arr[0] >> 7;

            // Switch decode function depending on message type
            let default_output = {inLowPower: false};
            switch (msg_type) {
                case 2:
                    return Object.assign(default_output, DLN_Message_Decode.capacitance_decode(byte_arr, json_params));
                case 3:
                    return Object.assign(default_output, DLN_Message_Decode.temperature_decode(byte_arr, json_params));
                case 4:
                    return Object.assign(default_output, DLN_Message_Decode.status_decode(byte_arr, json_params));
                case 5:
                    return Object.assign(default_output, DLN_Message_Decode.location_decode(byte_arr, json_params));
                case 6:
                    return Object.assign(default_output, DLN_Message_Decode.low_power_decode(byte_arr, json_params));
                case 7:
                    return Object.assign(default_output, DLN_Message_Decode.pulse_counter_decode(byte_arr, json_params));
                case 8:
                    return Object.assign(default_output, DLN_Message_Decode.traffic_counter_decode(byte_arr, json_params));
                case 9:
                    return Object.assign(default_output, DLN_Message_Decode.traffic_counter_historical_decode(byte_arr, json_params));
                case 10:
                    return Object.assign(default_output, DLN_Message_Decode.downlink_req_decode(byte_arr, json_params));

                default:
                    return default_output;
            }
        }

        // Capacitance Message decoding (0x02)
        static capacitance_decode(data, json_params) {
            // Decode readings using sflt162f
            var readings = [];
            for (var i=2; i<12; i+=2) {
                let LSB = data[i];
                let MSB = data[i+1];
                let byte_reading = (MSB << 8) | LSB;
                readings.push(DLN_Message_Decode.sflt162f(byte_reading)*100);
            }

            // Normalise capacitance values
            let norm_coeffs = json_params["norm_coeffs"];
            let p1c = readings[0];
            let p2c = (readings[1] - (p1c * norm_coeffs[0][0])) * norm_coeffs[0][1];
            let p3c = (readings[2] - (p2c * norm_coeffs[1][0]) - (p1c * norm_coeffs[1][1])) * norm_coeffs[1][2];
            let p4c = (readings[3] - (p3c * norm_coeffs[2][0]) - (p2c * norm_coeffs[2][1]) - (p1c * norm_coeffs[2][2])) * norm_coeffs[2][3];
            let norm_values = [DLN_Message_Decode.round(p1c), DLN_Message_Decode.round(p2c), DLN_Message_Decode.round(p3c), DLN_Message_Decode.round(p4c)];

            // Convert capacitance values to %VWC
            let vwc_coeffs = json_params["vwc_coeffs"];
            var vwc_values = [];
            for (const norm of norm_values) {
                var vwc = 0;
                for (var i=0; i<vwc_coeffs.length; i++) {
                    vwc += vwc_coeffs[i] * (norm**i);
                }
                vwc_values.push(DLN_Message_Decode.round(vwc*100));
            }

            // Assemble output
            let output = {
                "WakeTime": data[1] << 8,
                "%VWC1": vwc_values[0],
                "%VWC2": vwc_values[1],
                "%VWC3": vwc_values[2],
                "%VWC4": vwc_values[3],
                "Raw1": norm_values[0],
                "Raw2": norm_values[1],
                "Raw3": norm_values[2],
                "Raw4": norm_values[3],
                "T0": DLN_Message_Decode.round(readings[4])
            };

            return output;
        }

        // Temperature Message decoding (0x03)
        static temperature_decode(data, json_params) {
            // Decode readings using sflt162f
            var readings = [];
            for (var i=2; i<12; i+=2) {
                let LSB = data[i];
                let MSB = data[i+1];
                let byte_reading = (MSB << 8) | LSB;
                readings.push(DLN_Message_Decode.sflt162f(byte_reading)*100);
            }

            // Assemble output
            let output = {
                "WakeTime": data[1] << 8,
                "T1": DLN_Message_Decode.round(readings[0]),
                "T2": DLN_Message_Decode.round(readings[1]),
                "T3": DLN_Message_Decode.round(readings[2]),
                "T4": DLN_Message_Decode.round(readings[3]),
                "T5": DLN_Message_Decode.round(readings[4])
            };

            return output;
        }

        // Status Message decoding (0x04)
        static status_decode(data, json_params) {
            // Decode Sigfox chip temperature
            let byte_reading = (data[7] << 8) | data[6];
            let chip_temp = DLN_Message_Decode.sflt162f(byte_reading)*100;

            // Decode battery voltage
            let bat_volt = DLN_Message_Decode.decode_battery_voltage(data[8]);

            // Decode Software Version
            let version_number = DLN_Message_Decode.decode_version(data[10], data[11]);

            // Assemble output
            let output = {
                "WakeTime": data[1] << 8,
                "Sigfox Chip Temperature": DLN_Message_Decode.round(chip_temp),
                "Battery Voltage": DLN_Message_Decode.round(bat_volt),
                "Version Number": version_number
            };

            return output;
        }

        // Location Message (0x05) (NOT YET IMPLEMENTED)
        static location_decode(ddata, json_params) {
            return {};
        }

        // Low Power Message decoding (0x06)
        static low_power_decode(data, json_params) {

            // Message format is identical to status message, so decode using status decoder
            var output = this.status_decode(data, json_params);

            // Add Low Power value
            output["inLowPower"] = true;

            return output;
        }

        // Pulse Counter Message (0x07)
        static pulse_counter_decode(data, json_params) {
            // Decode readings into array of integers
            var readings = [];
            for (var i=1; i<8; i+=2) {
                let LSB = data[i];
                let MSB = data[i+1];
                readings.push((MSB << 8) | LSB);
            }

            // Decode sleep time
            let sleep_time = readings[0] * 1e-2;

            // Decode pulse count
            let pulse_count = readings[1];

            // Calculate pulse rate (in pulses/second)
            let pulse_rate = pulse_count / sleep_time;

            // Decode ADC voltages
            let aux1 = readings[2] * 1e-2;
            let aux2 = readings[3] * 1e-2;

            // Decode battery voltage
            let bat_volt = DLN_Message_Decode.decode_battery_voltage(data[8]);

            // Decode Software Version
            let version_number = DLN_Message_Decode.decode_version(data[10], data[11]);

            // Assemble output
            let output = {
                "Pulses": pulse_count,
                "PulseRate": DLN_Message_Decode.round(pulse_rate),
                "Aux1 Voltage": DLN_Message_Decode.round(aux1),
                "Aux2 Voltage": DLN_Message_Decode.round(aux2),
                "Battery Voltage": bat_volt,
                "Version Number": version_number
            };

            return output;
        }

        // Traffic Counter Message (0x08)
        static traffic_counter_decode(data, json_params) {
            // Decode readings into array of integers
            var readings = [];
            for (var i=1; i<8; i+=2) {
                let LSB = data[i];
                let MSB = data[i+1];
                readings.push((MSB << 8) | LSB);
            }

            // Decode sleep time
            let sleep_time = readings[0] * 1e-2;

            // Decode entry and exit counts
            let entry_count = readings[1];
            let exit_count = readings[2];

            // Decode ADC voltage
            let aux2 = readings[3] * 1e-2;

            // Decode battery voltage
            let bat_volt = DLN_Message_Decode.decode_battery_voltage(data[8]);

            // Decode Software Version
            let version_number = DLN_Message_Decode.decode_version(data[10], data[11]);

            // Assemble output
            let output = {
                "EntryCount": entry_count,
                "ExitCount": exit_count,
                "Aux2 Voltage": DLN_Message_Decode.round(aux2),
                "Battery Voltage": bat_volt,
                "Version Number": version_number
            };

            return output;
        }

        // Traffic Counter With History Message (0x09) (NOT IMPLEMENTED DUE TO LACK OF HISTORICALLY POPULATING DATA)
        static traffic_counter_historical_decode(data, json_params) {
            return {}
        }

        // Explicit Downlink Request Message (0x0A) (NOT IMPLEMENTED DUE TO LACK OF DOWNLINK CAPABILITIES)
        static downlink_req_decode(data, json_params) {
            return {};
        }

        // Distance Measurement Message (0x0B)
        static distance_decode(data, json_params) {
            // Decode readings into array of integers
            var readings = [];
            for (var i=1; i<8; i+=2) {
                let LSB = data[i];
                let MSB = data[i+1];
                readings.push((MSB << 8) | LSB);
            }

            // Decode sleep time
            let sleep_time = readings[0] * 1e-2;

            // Decode mean distance
            let mean_dist = readings[1];

            // Decode standard deviation of distances
            let std_dev = readings[2];

            // Decode ADC voltage
            let aux2 = readings[3] * 1e-2;

            // Decode battery voltage
            let bat_volt = DLN_Message_Decode.decode_battery_voltage(data[8]);

            // Decode Software Version
            let version_number = DLN_Message_Decode.decode_version(data[10], data[11]);

            // Assemble output
            let output = {
                "Mean Distance": mean_dist,
                "Std Dev Distance": std_dev,
                "Aux2 Voltage": DLN_Message_Decode.round(aux2),
                "Battery Voltage": bat_volt,
                "Version Number": version_number
            };

            return output;
        }
    }
    payload = JSON.parse(payload);
    return DLN_Message_Decode.decode_str_msg(payload, params);
}