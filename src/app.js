#!/usr/bin/env node
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
console.log('⚉ Vanessa listening at', port);