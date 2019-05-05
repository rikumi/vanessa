const fs = require('fs');
const path = require('path');

const Parcel = require('parcel');
const rmrf = require('rimraf').sync;

const frontendDir = path.join(__dirname, 'panel', 'frontend');
const outDir = path.join(frontendDir, 'dist');
const outFile = path.join(outDir, 'index.html');
const cacheDir = path.join(frontendDir, '.cache');
const entryFile = path.join(frontendDir, 'index.html');

const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
    rmrf(outDir);
    rmrf(cacheDir);
}

const bundler = new Parcel(entryFile, { outDir, cacheDir });
bundler.bundle(); // Then: Exits on 'production' or watches on non-'production'

module.exports = outDir;