const fs = require('fs');
const os = require('os');
const path = require('path');
const glob = require('glob');
const util = require('util');
const mkdirp = require('mkdirp');

const ruleDir = path.join(os.homedir(), '.vanessa', 'rules');
mkdirp.sync(ruleDir);

const loaders = {
    js: (content) => content
};

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const unlink = util.promisify(fs.unlink);

const getAllRuleNames = () => {
    let fileGlob = '*.@(' + Object.keys(loaders).join('|') + ')';
    return glob.sync(path.join(ruleDir, fileGlob)).map((p) => path.basename(p));
};

const getRule = async (name) => {
    let filePath = path.join(ruleDir, name);
    if (!fs.existsSync(filePath)) {
        return null;
    }

    return (await readFile(filePath)).toString();
};

const setRule = async (name, content) => {
    let filePath = path.join(ruleDir, name);
    await writeFile(filePath, content);
}

const removeRule = async (name) => {
    let filePath = path.join(ruleDir, name);
    await unlink(filePath);
}

module.exports = {
    ruleDir,
    loaders,
    getAllRuleNames,
    getRule,
    setRule,
    removeRule
};