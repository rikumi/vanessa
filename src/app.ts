import Vanessa from './index';

process.on('uncaughtException', console.error);
process.on('unhandledRejection', e => { throw e });

let vanessa = new Vanessa();
vanessa.listen(8672);