function parsePayload(payload, params, fport) {
    payload['concentration'] = payload['concentration']['value'];
    payload['temperature'] = payload['temperature']['value'];
    payload['humidity'] = payload['humidity']['value'];
    return payload;
}