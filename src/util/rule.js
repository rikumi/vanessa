const fs = require('fs');
const os = require('os');
const path = require('path');
const glob = require('glob');
const util = require('util');
const yaml = require('yaml');
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

    let content = (await readFile(filePath)).toString();
    let options = {};

    try {
        options = yaml.parse(fs.readFileSync(filePath + '.yaml').toString());
    } catch (e) {}

    return {
        name,
        content,
        options
    };
};

const getAllRules = async () => {
    return (await Promise.all(getAllRuleNames().map(getRule))).filter((r) => r);
};

const setRule = async ({ name, content, options = {}}) => {
    let filePath = path.join(ruleDir, name);
    await writeFile(filePath, content);
    await writeFile(filePath + '.yaml', yaml.stringify(options));
}

const removeRule = async (name) => {
    let filePath = path.join(ruleDir, name);
    await unlink(filePath);
    await unlink(filePath + '.yaml');
}

module.exports = {
    ruleDir,
    loaders,
    getAllRuleNames,
    getRule,
    getAllRules,
    setRule,
    removeRule
};