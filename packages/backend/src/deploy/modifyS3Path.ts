import path = require('path');
import { CloudFrontRequestHandler } from 'aws-lambda';

import {
    AUDIO_FILE_URL_PREFIX,
    TRANSCRIBED_TEXT_FILE_URL_PREFIX,
} from '../constants';

export const handler: CloudFrontRequestHandler = (event, _, callback) => {
    console.log(event);

    const { request } = event.Records[0].cf;
    console.log('Original request: ', request);

    const parsedPath = path.parse(request.uri);
    if (request.origin.s3) {
        if (parsedPath.dir.endsWith(AUDIO_FILE_URL_PREFIX)) {
            console.log(
                'Target for AudioFileBucket: strip "audio-file/" prefix.'
            );
            request.uri = request.uri.replace(`${AUDIO_FILE_URL_PREFIX}/`, '');
        } else if (parsedPath.dir.endsWith(TRANSCRIBED_TEXT_FILE_URL_PREFIX)) {
            console.log(
                'Target for TranscribedTextFileBucket: strip "transcription/" prefix.'
            );
            request.uri = request.uri.replace(
                `${TRANSCRIBED_TEXT_FILE_URL_PREFIX}/`,
                ''
            );
        }
    }

    console.log('Modified request: ', request);

    // Return to CloudFront
    return callback(null, request);
};
