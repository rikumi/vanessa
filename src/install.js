const os = require('os');
const path = require('path');
const util = require('util');
const chalk = require('chalk');
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
        rl.close();

        const ifs = os.networkInterfaces();
        const addresses = [].concat(...Object.keys(ifs).map((name) => ifs[name].map((k) => Object.assign(k, { name })))).map((k) => (/:/.test(k.address) ? `(${k.name} ${k.family}) [${k.address}]:${port}` : `(${k.name} ${k.family}) ${k.address}:${port}`));

        console.log(chalk`
{cyan ⚉ Vanessa listening at:}
{yellow ${addresses.join('\n')}}

{cyan For each device:}
{cyan 1.} Set HTTP Proxy to a proper address from above.
{cyan 2.} Disable any VPN service.
{cyan 3.} Visit {green.underline http://vanes.sa/} and follow the instructions.
`
        );
    }
})();
