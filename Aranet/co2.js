function parsePayload(payload, params) {
    var data = JSON.parse(payload);
    const dataJson  = '{}';
    let returndata  = JSON.parse(dataJson);
    var reading;
    for (let x in data) {

        reading =data[x]['v'];
        switch (data[x]['n'])
        {
            case 'atmosphericpressure':
                reading /=100;
                break;

            case 'volumetricwatercontent':
                reading *= 100;
                break;

            case 'co2':
            case 'ppfd':
                reading *= 1000000;
                break;
            case 'bulkec':
            case 'poreec':
                reading *= 10;
                break;
        }
        returndata[data[x]['n']] =reading;

    }

    return returndata;
}