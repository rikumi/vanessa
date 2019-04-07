import * as Store from 'configstore';

const store = new Store(
    'rikumi.vanessa',
    {
        rules: {
            default: '',
            global: ''
        },
        sessions: {}
    },
    { globalConfigPath: true }
);

let sessions = store.get('sessions');
for (let key in sessions) {
    if (sessions[key].expiration > Date.now()) {
        delete sessions[key];
    }
}
store.set('sessions', sessions);

export default store;
