import chalk from 'chalk';
import Vanessa from './index';

import errorMiddleware from './middleware/functional/error';
import sessionMiddleware from './middleware/functional/session';
import panelMiddleware from './middleware/functional/panel';
import counterMiddleware from './middleware/functional/counter';
import collectMiddleware from './middleware/functional/collect';
import ruleMiddleware from './middleware/functional/rule';

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