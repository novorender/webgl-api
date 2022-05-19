const path = require("path");
const ResolveTypeScriptPlugin = require("resolve-typescript-plugin");


module.exports = {
    entry: "./src/demo/index.ts",
    devtool: "source-map",
    module: {
        rules: [
            {
                test: /\.(t|j)sx?$/,
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
            ["@novorender/webgl-api"]: path.resolve(__dirname, "./src/webgl-api"),
            ["@novorender/renderer"]: path.resolve(__dirname, "./src/renderer"),
        },
        roots: [path.resolve(__dirname, "./src/")],
        plugins: [new ResolveTypeScriptPlugin()]
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
        hot: false,
    },
};