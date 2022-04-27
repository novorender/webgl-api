const path = require("path");

module.exports = {
    entry: "./demo/src/index.ts",
    devtool: "source-map",
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: "ts-loader",
                exclude: /node_modules/,
            },
            {
                test: /\.(glsl|vert|frag)$/,
                use: "webpack-glsl-loader"
            }
        ],
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js"],
        alias: {
            ["@novorender/webgl-api"]: path.resolve(__dirname, "./src/"),
        },
        roots: [path.resolve(__dirname, "./src/")]
    },
    output: {
        filename: "bundle.js",
        path: path.resolve(__dirname, "dist"),
    },
    devServer: {
        static: {
            directory: path.join(__dirname, "static"),
        },
        compress: true,
        https: false,
        port: 9000,
    },
};