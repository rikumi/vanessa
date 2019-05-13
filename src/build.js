const fs = require('fs');
const path = require('path');

const Parcel = require('parcel');
const rmrf = require('rimraf').sync;
const env = require('./util/env');

const frontendDir = path.join(__dirname, 'panel', 'frontend');
const outDir = path.join(frontendDir, 'dist');
const outFile = path.join(outDir, 'index.html');
const cacheDir = path.join(frontendDir, '.cache');
const entryFile = path.join(frontendDir, 'index.html');


const bundler = new Parcel(entryFile, {
    outDir,
    cacheDir,
    hmrHostname: 'vanes.sa',
    watch: env === 'development'
});

if (env !== 'production') {
    if (env === 'prebuild') {
        rmrf(outDir);
        rmrf(cacheDir);
    }
    bundler.bundle(); // Then: Exits on 'production' or watches on non-'production'
}

module.exports = outDir;