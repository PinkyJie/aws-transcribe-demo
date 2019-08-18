export const LAMBDA_FUNCTIONS_DIST_FOLDER = './packages/backend/dist/';
export const WEBSITE_DIST_FOLDER = './packages/frontend/build';

export const API_PATH_PREFIX = 'api';

export const TAGS: {
    [key: string]: string;
} = {
    appName: 'AWSTranscribeDemo',
};

export const SUPPORTED_AUDIO_SUFFIX = ['.mp3', '.wav'];
export const AUDIO_FILE_URL_PREFIX = 'audio-file';
export const TRANSCRIBED_TEXT_FILE_URL_PREFIX = 'transcription';

export const LAMBDA_EDGE_FUNC_PATH = `${LAMBDA_FUNCTIONS_DIST_FOLDER}/modifyS3Path/modifyS3Path.js`;

export const LAMBDA_EDGE_STACK_NAME = 'LambdaEdgeStack';
export const LAMBDA_EDGE_ARN_OUTPUT_NAME = 'LambdaEdgeArnOutput';
export const LAMBDA_EDGE_VERSION_OUTPUT_NAME = 'LambdaEdgeVersionOutput';
export const LAMBDA_EDGE_REGION = 'us-east-1';
export const MAIN_STACK_NAME = 'AwsTranscribeDemoStack';
