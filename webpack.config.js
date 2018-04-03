var path = require('path');
// var webpack = require('webpack');
var CopyWebpackPlugin = require('copy-webpack-plugin')
var HtmlWebpackPlugin = require('html-webpack-plugin');
const StatsWriterPlugin = require('webpack-stats-plugin').StatsWriterPlugin;
const Visualizer = require('webpack-visualizer-plugin');
// var node_module_dir = path.resolve(__dirname,'node_module');
var webpack = require('webpack')
var soruces = [__dirname+'/front']
const configRem = {
    loader: 'webpack-px-to-rem',
    //这个配置是可选的 
    query: {
        // 1rem=npx 默认为 10 
        basePx: 75,
        //只会转换大于min的px 默认为0 
        //因为很小的px（比如border的1px）转换为rem后在很小的设备上结果会小于1px，有的设备就会不显示 
        min: 1,
        //转换后的rem值保留的小数点后位数 默认为3 
        floatWidth: 3
    }
}
module.exports = {
    devtool: 'source-map',
    entry: {
        'bundle': __dirname + '/front/index.js',
    },
    output: {
        filename: '[name]-[hash].js',
        path: __dirname + '/static',
        // publicPath: '/',
    },
    externals: {
         'io': 'io',
        // 'react-dom': 'ReactDOM',
        // 'react-addons-transition-group': 'React.addons.TransitionGroup',
        // 'react-addons-css-transition-group': 'React.addons.CSSTransitionGroup',
        // 'react-addons-create-fragment': 'React.addons.createFragment'
    },
    plugins: [
        new HtmlWebpackPlugin({
            filename: "index.html",
            template: __dirname + "/front/index.tml.html",
        }),
        
        ...(process.env.NODE_ENV != 'production' ?[]:[new webpack.optimize.UglifyJsPlugin({
            warnings: false,
        })] ),
        
        
        // new CopyWebpackPlugin([{
        //     from: __dirname + '/data',
        //     to: __dirname + '/dist/data'
        // }]),
        // new webpack.HotModuleReplacementPlugin()
        // new webpack.optimize.CommonsChunkPlugin('vendor.js', ['vendor']),
    ],
    module: {
        loaders: [
            {
                'loader': ['babel-loader'],
                'exclude': [
                    //在node_modules的文件不被babel理会
                    path.resolve(__dirname, 'node_modules'),
                ],
                'include': [
                    //指定app这个文件里面的采用babel
                    ...soruces,
                ],
                'test': /\.js?$/,
                // 'query':{
                // plugins:['transform-runtime'],
                // presets:['es2015','stage-0','react']
                // }
            },
            {
                test: /\.s(a|c)ss$/,
                loaders: ["style-loader", "css-loader", "sass-loader"]
            },
            {
                test: /\.css$/, // Only .css files
                exclude: [
                    /react-table(\/|\\).*\.css$/, //exclude ant
                    'bootstrap.min.css',
                ],
                loader: ['style-loader', 'css-loader?modules&localIdentName=[name]-[hash:base64:5]--[local]'] // Run both loaders
            },
            {
                test: /react-table(\/|\\).*\.css$/, //all ant css
                loader: ['style-loader', 'css-loader'], // Run both loaders
                exclude: [
                ]
            },
            {
                  test: /\.(png|jpg|gif|svg)$/i,
                  loaders: [
                      'url-loader?limit=4000&name=[name]-[hash:5].[ext]',
                      'image-webpack-loader'
                  ]
            },
            {
                test: /\.(ttf|eot|woff|woff2)$/i,
                loader: 'url-loader?limit=2048&outputPath=images/&name=[name]-[hash:5].[ext]'
            }],
    }
}
