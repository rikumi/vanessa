#!/usr/bin/env node
const chalk = require('chalk');
const { argv } = require('yargs');

const Vanessa = require('./index');

const summaryMiddleware = require('./middleware/functional/summary');
const sessionMiddleware = require('./middleware/functional/session');
const guideMiddleware = require('./middleware/functional/guide');
const panelMiddleware = require('./middleware/functional/panel');
const contextMiddleware = require('./middleware/functional/context');
const ruleMiddleware = require('./middleware/functional/rule');
const timeoutMiddleware = require('./middleware/functional/timeout');
const decompressMiddleware = require('./middleware/functional/decompress');

process.on('uncaughtException', (e) => console.error(chalk.bgRed.black('[exception]'), e));
process.on('unhandledRejection', (e) => console.error(chalk.bgRed.black('[rejection]'), e));

let vanessa = new Vanessa();
vanessa.use(summaryMiddleware);
vanessa.use(sessionMiddleware);
vanessa.use(guideMiddleware);
vanessa.use(panelMiddleware);
vanessa.use(contextMiddleware);
vanessa.use(ruleMiddleware);
vanessa.use(decompressMiddleware);
vanessa.use(timeoutMiddleware);

const { port = 8099 } = argv;
vanessa.listen(port);