const os = require('os');
const path = require('path');
const util = require('util');
const readline = require('readline');

const isRoot = require('is-root');
const startup = require('user-startup');

(async () => {
    if (isRoot()) {
        console.error('[!] Root user is not supported.');
        console.error('[!] Please install vanessa without sudo. Exiting.');
    } else {
        const rl = readline.createInterface(process.stdin, process.stdout);
        const question = util.promisify(rl.question).bind(rl);

        const nodePath = process.execPath;
        const scriptPath = path.join(__dirname, 'app.js');
        const logPath = path.join(os.homedir(), '.vanessa', 'vanessa.log');

        console.log('⚉ Vanessa Daemon Installer');
        const port = (await question('Port [8099]: ')) || 8099;

        startup.remove('vanessa');
        startup.create('vanessa', nodePath, [scriptPath, '--port', port], logPath);
        console.log('\n⚉ Created and started Vanessa daemon at', port);
        
        rl.close();
    }
})();
