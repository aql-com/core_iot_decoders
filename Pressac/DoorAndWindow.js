function parsePayload(payload, params, fport) {

    if(payload['contact'] ==='open'){
        payload['contact'] = 1;
    }
    else{
        payload['contact'] = 0;
    }
    return payload;
}