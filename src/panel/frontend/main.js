import Vue from 'vue';
import Root from './component/Root';

Vue.prototype.window = window;
Vue.config.productionTip = false;

export default new Vue({
    components: { Root },
    template: '<Root/>',
    el: '#app'
});