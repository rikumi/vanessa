import * as MITMProxy from 'http-mitm-proxy';
import rule from './handler/rule';
import logger from './handler/logger';
import ivy from './config/ivy';

const vanessa = MITMProxy();
vanessa.use(rule);
vanessa.use(logger);
vanessa.listen(ivy);

export default vanessa;