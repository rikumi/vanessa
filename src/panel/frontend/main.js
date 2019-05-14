import Vue from 'vue';
import Root from './component/Root';
import Cert from './component/Cert';

Vue.prototype.window = window;
Vue.config.productionTip = false;

export default new Vue({
    components: { Root, Cert },
    template: location.protocol === 'https:' ? '<Root/>' : '<Cert/>',
    el: '#app'
});