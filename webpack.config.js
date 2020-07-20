const path = require("path");



const HtmlWebpackPlugin = require("html-webpack-plugin");

const globalRules = {
    rules: [
        {
            test: /\.css$/,
            use: ["style-loader", "css-loader"]
        },
        {
            test: /\.js$/,
            exclude: /node_modules/,
            use: ["babel-loader"]
        }
    ]
}

const serverConfig = {
    entry: {
        // client: path.resolve(__dirname, "src", "client.js"),
        server: path.resolve(__dirname, "src", "server.js"),
    },
    // output: {
    //     path: path.resolve(__dirname, 'dist'),
    //     filename: 'server.js'
    // }
    target: 'node',
    module: globalRules,

};

const clientConfig = {
    entry: {
        client: path.resolve(__dirname, "src", "client.js"),
        // server: path.resolve(__dirname, "src", "server.js"),
    },
    // output: {
    //     path: path.resolve(__dirname, 'dist'),
    //     filename: 'client.js'
    // }
    target: 'web', // <=== can be omitted as default is 'web'
    module: globalRules,
    plugins: [
        new HtmlWebpackPlugin({
            // excludeChunks: ['server'],
            // chunks: ['client'],
            template: path.resolve(__dirname, "src", "index.html")
        }),
    ],
};

module.exports = [serverConfig, clientConfig];
