const path = require('path');
const { CheckerPlugin } = require('awesome-typescript-loader');
const CleanWebpackPlugin = require('clean-webpack-plugin');

module.exports = {
    entry: {
        getAudios: './src/handlers/getAudios.ts',
        newAudio: './src/handlers/newAudio.ts',
        transcribeAudio: './src/handlers/transcribeAudio.ts',
        getToken: './src/handlers/getToken.ts',
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
    plugins: [new CleanWebpackPlugin(['dist']), new CheckerPlugin()],
    mode: 'production',
};
