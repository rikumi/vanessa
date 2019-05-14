#!/usr/bin/env node
const os = require('os');
const chalk = require('chalk');
const { argv } = require('yargs');
const stringify = require('./util/safe-json');

const Vanessa = require('./index');

const { errorMiddleware, errorHandler } = require('./middleware/functional/error');
const sessionMiddleware = require('./middleware/functional/session');
const panelMiddleware = require('./middleware/functional/panel');
const collectMiddleware = require('./middleware/functional/collect');
const contextMiddleware = require('./middleware/functional/context');
const ruleMiddleware = require('./middleware/functional/rule');
const timeoutMiddleware = require('./middleware/functional/timeout');

process.on('uncaughtException', (e) => console.error(chalk.bgRed.black('[exception]'), e));
process.on('unhandledRejection', (e) => console.error(chalk.bgRed.black('[rejection]'), e));

let vanessa = new Vanessa();
vanessa.on('error', errorHandler);
vanessa.use(errorMiddleware);
vanessa.use(sessionMiddleware);
vanessa.use(panelMiddleware);
vanessa.use(collectMiddleware);
vanessa.use(contextMiddleware);
vanessa.use(ruleMiddleware);
vanessa.use(timeoutMiddleware);

const { port = 8099 } = argv;
vanessa.listen(port);

const ifs = os.networkInterfaces();
const addresses = []
    .concat(...Object.keys(ifs).map(name => ifs[name].map(k => Object.assign(k, {name}))))
    .map(k => /:/.test(k.address) ? 
        `(${k.name} ${k.family}) [${k.address}]:${port}` :
        `(${k.name} ${k.family}) ${k.address}:${port}`
    );

console.log(chalk`
{cyan ⚉ Vanessa listening at:}
{yellow ${addresses.join('\n')}}

{cyan For each device:}
{cyan 1.} Set HTTP Proxy to a proper address from above.
{cyan 2.} Disable any VPN service.
{cyan 3.} Visit {green.underline http://vanes.sa/} and follow the instructions.
`);