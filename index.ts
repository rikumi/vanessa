import * as MITMProxy from 'http-mitm-proxy';
import rule from './handler/rule';
import logger from './handler/logger';
import { join } from 'path';
import { homedir } from 'os';

const vanessa = MITMProxy();
vanessa.use(MITMProxy.gunzip);
vanessa.use(rule);
vanessa.use(logger);
vanessa.listen({
    port: 8672,
    sslCaDir: join(homedir(), '.vanessa')
});

export default vanessa;