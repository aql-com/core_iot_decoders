function parsePayload(payload, params, fport) {
    if(payload['motionDetected']){
        payload['motionDetected'] = 1;
    }
    else{
        payload['motionDetected'] = 0;
    }
    return payload;
}