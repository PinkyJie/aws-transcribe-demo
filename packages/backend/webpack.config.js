const path = require('path');
const { CheckerPlugin } = require('awesome-typescript-loader');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
    entry: {
        'getAudios/getAudios': './src/handlers/getAudios.ts',
        'newAudio/newAudio': './src/handlers/newAudio.ts',
        'transcribeAudio/transcribeAudio': './src/handlers/transcribeAudio.ts',
        'getToken/getToken': './src/handlers/getToken.ts',
        'modifyS3Path/modifyS3Path': './src/deploy/modifyS3Path.ts',
        'getCrossRegionCfn/getCrossRegionCfn':
            './src/deploy/getCrossRegionCfn.ts',
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist'),
        library: 'index',
        libraryTarget: 'commonjs2',
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    target: 'async-node',
    module: {
        rules: [
            {
                test: /\.ts$/,
                loader: 'awesome-typescript-loader',
            },
        ],
    },
    plugins: [new CleanWebpackPlugin(), new CheckerPlugin()],
    mode: 'production',
};
