const chalk = require('chalk');
const Vanessa = require('./index');

const errorMiddleware = require('./middleware/functional/error');
const sessionMiddleware = require('./middleware/functional/session');
const panelMiddleware = require('./middleware/functional/panel');
const counterMiddleware = require('./middleware/functional/counter');
const collectMiddleware = require('./middleware/functional/collect');
const ruleMiddleware = require('./middleware/functional/rule');

process.on('uncaughtException', (e) => console.error(chalk.bgRed.black('[exception]'), e));
process.on('unhandledRejection', (e) => console.error(chalk.bgRed.black('[rejection]'), e));

let vanessa = new Vanessa();
vanessa.use(errorMiddleware);
vanessa.use(sessionMiddleware);
vanessa.use(panelMiddleware);
vanessa.use(counterMiddleware);
vanessa.use(collectMiddleware);
vanessa.use(ruleMiddleware);
vanessa.listen(8672);