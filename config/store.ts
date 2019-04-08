import * as Store from 'configstore';

const store = new Store('vanessa', {}, {
    globalConfigPath: true
});

let sessions = store.all;
for (let key in sessions) {
    let session = sessions[key];
    if (session.expires && session.expires < Date.now()) {
        delete sessions[key];
    }
}
store.all = sessions;

export default store;
