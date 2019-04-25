import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as glob from 'glob';
import * as util from 'util';
import * as yaml from 'yaml';
import * as mkdirp from 'mkdirp';

interface Rule {
    name: string;
    content: string;
    options: any
}

const ruleDir = path.join(os.homedir(), '.vanessa', 'rules');
mkdirp.sync(ruleDir);

const loaders: { [ext: string]: (content: string) => string } = {
    js: (content) => content
};

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const unlink = util.promisify(fs.unlink);

const getAllRuleNames = () => {
    let fileGlob = '*.@(' + Object.keys(loaders).join('|') + ')';
    return glob.sync(path.join(ruleDir, fileGlob)).map((p) => path.basename(p));
};

const getRule = async (name: string): Promise<Rule | null> => {
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

const setRule = async ({ name, content, options = {}}: Rule) => {
    let filePath = path.join(ruleDir, name);
    await writeFile(filePath, content);
    await writeFile(filePath + '.yaml', yaml.stringify(options));
}

const removeRule = async (name: string) => {
    let filePath = path.join(ruleDir, name);
    await unlink(filePath);
    await unlink(filePath + '.yaml');
}

export {
    ruleDir,
    loaders,
    getAllRuleNames,
    getRule,
    getAllRules,
    setRule,
    removeRule
};