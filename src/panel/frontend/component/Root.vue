<template>
    <div class='app-root'>
        <div class='left'>
            <div class='title' @click='showInfo'>Vanessa</div>
            <div class='section'>
                <div class='section-title'>Rules</div>
                <button class='disable-all' @click='disableAllRules()'>Disable All</button>
            </div>
            <div class='rules'>
                <div class='rule' v-for='rule in rules' :key='rule.name' :class='{ editing: showingRule && rule.name === showingRule.name }' @click='showRule(rule)'>
                    <div class='rule-select' :class='{ selected: rule.isSelected }' @click.stop='toggleRule(rule)'></div>
                    <div class='rule-name'>{{ rule.name }}</div>
                    <div class='rule-remove' @click.stop='removeRule(rule)'></div>
                </div>
                <div class='rule-add'>
                    <input v-model='newRuleName' placeholder='New rule...' @blur='addRule' @keypress.enter='addRule'/>
                </div>
            </div>
            <div class='section'>
                <div class='section-title'>History</div>
            </div>
            <div class='table-container'>
                <div class='table-scrollable'>
                    <div class='history' v-for='history in histories.slice().reverse()'
                        :key='history.id'
                        :class='{ selected: showingHistory && showingHistory.id === history.id }'
                        @click='showHistoryDetail(history)'>
                        <div class='row row-1'>
                            <img class='icon' :src='getIcon(history)'>
                            <div class='method'>{{ history.method }}</div>
                            <div class='url'>{{ history.url }}</div>
                        </div>
                        <div class='row row-2'>
                            <div class='id'>#{{ history.id }}</div>
                            <div class='ip'>From: {{ history.ip }}</div>
                            <div class='status'>Status: {{ history.status }}</div>
                            <div class='type'>Type: {{ history.type || '[unspecified]' }}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class='right' v-show='hasEditor'>
            <div class='editor-title-bar'>
                <div class='editor-title'>{{ editorTitle }}</div>
                <div class='editor-button'
                    v-if='editorIsDirty'
                    @click='editorSave'
                >Save (⌘S)</div>
                <div class='editor-button'
                    v-if='showingHistory'
                    @click='downloadRequest'
                >Request body</div>
                <div class='editor-button'
                    v-if='showingHistory && showingHistory.response && showingHistory.response.status'
                    @click='downloadResponse'
                >Response body</div>
            </div>
            <div class='editor' ref='editorContainer'></div>
            <div class='logs' v-if='showingRule || showingHistory'>
                <div class='logs-title'>Logs from {{ showingRule ? showingRule.name : '#' + showingHistory.id }}</div>
                <div class='logs-container'>
                    <div class='logs-scroller' v-if='showingRule ? showingRule.logs && showingRule.logs.length : showingHistory.logs && showingHistory.logs.length'>
                        <div class='logs-wrapper' ref='logWrapper'>
                            <div class='log' v-for='log in (showingRule ? showingRule.logs : showingHistory.logs)' :key='log.id' :class='"type-" + log.type'>
                                <div class='log-ctxid' v-if='showingRule' @click='showHistoryDetail({ id: log.ctxId })'>[#{{ log.ctxId }}]</div>
                                <div class='log-ctxid' v-else-if='log.rule' @click='showRule({ name: log.rule })'>[{{ log.rule }}]</div>
                                <div class='log-ctxid' v-else>(global)</div>
                                <div class='log-content'>{{ log.content }}</div>
                            </div>
                            <div class='log bottom'></div>
                        </div>
                    </div>
                    <div class='logs-empty' v-else-if='showingHistory'>Use <code>console.log</code>/<code>console.error</code> in rules to print logs here.</div>
                    <div class='logs-empty' v-else-if='showingRule.logs'>Use <code>console.log</code>/<code>console.error</code> to print logs here.</div>
                    <div class='logs-loading' v-else>Retrieving logs…</div>
                </div>
            </div>
        </div>
    </div>
</template>
<script>
import api from '../api';
import { setTimeout } from 'timers';
import * as monaco from 'monaco-editor';
import theme from '../assets/ayu-light.json';
import iconHtml from '../assets/html.svg';
import iconCss from '../assets/css.svg';
import iconJs from '../assets/js.svg';
import iconJson from '../assets/json.svg';
import iconImage from '../assets/image.svg';
import iconText from '../assets/text.svg';
import iconLoading from '../assets/loading.svg';

monaco.editor.defineTheme('ayu-light', theme);

const monospaceFonts = '"Fira Code", "Monaco", "Source Code Pro", monospace'

export default {
    data: () => ({
        rules: [],
        histories: [],
        editor: null,
        showingInfo: null,
        showingRule: null,
        showingHistory: null,
        editorTitle: '',
        hasEditor: false,
        newRuleName: '',
        editorIsDirty: false,
        markers: [],
    }),
    created() {
        this.reload();
        setInterval(() => this.refreshHistory(), 1000);
        setInterval(() => this.refreshLogs(), 1000);
    },
    mounted() {
        this.editor = monaco.editor.create(this.$refs.editorContainer, {
            minimap: {
                enabled: false
            },
            language: 'javascript',
            fontFamily: monospaceFonts,
            fontLigatures: true,
            fontSize: 13,
            readOnly: true,
            wordWrap: 'on',
            theme: 'ayu-light',
            renderLineHighlight: 'none',
            contextmenu: false,
            scrollBeyondLastLine: false
        });
        this.editor.getModel().onDidChangeContent(() => {
            this.editorIsDirty = true;
        })
        this.editor.addAction({
            id: 'vanessa-save-rule',
            label: 'Save Rule',
            keybindings: [
                monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S,
            ],
            run: (editor) => {
                this.editorSave();
            }
        });
        this.showInfo();
        window.addEventListener('resize', () => {
            this.editor.layout();
        });
    },
    watch: {
        hasEditor() {
            setTimeout(() => this.editor.layout(), 0);
        },
        showingInfo() {
            let info = this.showingInfo;
            console.log('showing info', info);
            if (info && this.editorLeaveConfirm()) {
                this.showingRule = null;
                this.showingHistory = null;
                this.editorSetContent('Vanessa Info', info, false);
            } else {
                this.showingInfo = null;
            }
        },
        showingRule() {
            let rule = this.showingRule;
            console.log('showing rule', rule);
            if (rule) {
                this.showingInfo = null;
                this.showingHistory = null;
                this.editorSetContent(rule.name, rule.content, true);
            }
        },
        showingHistory() {
            let history = this.showingHistory;
            if (history && this.editorLeaveConfirm()) {
                this.showingInfo = null;
                this.showingRule = null;
                this.editorSetContent('#' + history.id, {
                    ...this.showingHistory,
                    logs: undefined
                }, false);
            } else {
                this.showingHistory = null;
            }
        },
        markers() {
            monaco.editor.setModelMarkers(this.editor.getModel(), 'vanessa-rule-logs', this.markers);
        }
    },
    methods: {
        async showInfo() {
            this.showingInfo = (await api.get('/admin/info')).data;
        },
        async reload() {
            this.rules = (await api.get('/rule')).data;
        },
        async refreshHistory() {
            let fetchFromId;
            let unfinishedHistory = this.histories.filter(k => !k.status);

            if (unfinishedHistory[0]) {
                fetchFromId = unfinishedHistory[0].id;
            } else if (this.histories.length) {
                fetchFromId = this.histories.slice(-1)[0].id + 1;
            } else {
                fetchFromId = 0;
            }

            let prev = this.histories.filter(k => k.id < fetchFromId);
            let next = (await api.get('/history/~' + fetchFromId)).data;
            this.histories = prev.concat(next).slice(-1000);
            if (this.showingHistory && !this.showingHistory.response.status) {
                let updated = next.find(k => k.id === this.showingHistory.id);
                if (updated.status) {
                    this.showHistoryDetail(this.showingHistory);
                }
            }
        },
        async addRule() {
            let name = this.newRuleName;
            if (!name) {
                return;
            }
            if (!/\.(js)$/.test(name)) {
                name += '.js';
            }
            if (!/^[0-9a-z\-]+\.[0-9a-z]+$/.test(name)) {
                alert('Rule name should match /^[0-9a-z\\-]+$/');
                this.newRuleName = '';
                return;
            }
            await api.post('/admin/rule/' + name, `module.exports = async (ctx, next) => {\n    await next();\n};`);
            await this.reload();
            this.newRuleName = '';
            this.showRule({ name });
        },
        async showRule(rule) {
            let content = (await api.get('/rule/' + rule.name)).data;
            this.showingRule = {
                name: rule.name,
                content
            };
        },
        async toggleRule(rule) {
            if (rule.isSelected) {
                await api.delete('/rule/' + rule.name);
                this.reload();
            } else {
                await api.post('/rule/' + rule.name);
                this.reload();
            }
        },
        async removeRule(rule) {
            if (confirm(`Confirm to remove rule ${rule.name}.`)) {
                await api.delete('/admin/rule/' + rule.name);
                if (this.showingRule && rule.name === this.showingRule.name) {
                    this.showInfo();
                }
                this.reload();
            }
        },
        async disableAllRules() {
            await api.delete('/rule');
            this.reload();
        },
        async saveRule() {
            this.showingRule.content = this.editor.getModel().getValue();
            await api.post('/admin/rule/' + this.showingRule.name, this.showingRule.content);
            this.markers = [];
        },
        async refreshLogs() {
            let { showingRule } = this;
            if (showingRule) {
                let { logs = [] } = showingRule;
                let fetchFromId = logs.length && logs.slice(-1)[0].id + 1;
                let wrapper = this.$refs.logWrapper;
                let scroller = wrapper && wrapper.parentElement;
                let isAtBottom = !wrapper ||
                    scroller.scrollTop + scroller.clientHeight + 10 >= wrapper.clientHeight;

                let next = (await api.get('/admin/log/' + showingRule.name + '/~' + fetchFromId)).data;

                // After awaiting, the showing rule might have changed
                if (this.showingRule == showingRule) {
                    // Add markers in rule editor when new error logs were fetched, except for the first fetch.
                    if (showingRule.isFirstFetched) {
                        let errors = next.filter(k => k.type === 'error' || k.type === 'trace');

                        errors.forEach((e) => {
                            let match = /vm\.js:(\d+)(:(\d+))?/.exec(e.content);
                            if (match) {
                                let [, row,, col = 0] = match.map(Number);
                                if (!col) {
                                    match = /\n(\s*)\^\s*\n/.exec(e.content);
                                    if (match) {
                                        col = match[1].length + 1;
                                    }
                                }
                                if (!this.markers.find(k => k.startLineNumber === row && k.startColumn === col)) {
                                    this.markers = this.markers.concat({
                                        startLineNumber: row,
                                        endLineNumber: row,
                                        startColumn: col,
                                        endColumn: 1000,
                                        message: e.content.split(/\n\s{4}at\s/)[0]
                                    });
                                }
                            }
                        });
                    }
                    showingRule.isFirstFetched = true;
                    logs = logs.concat(next);
                    this.showingRule.logs = logs;
                    this.showingRule = showingRule;
                }
                if (isAtBottom) {
                    setTimeout(() => {
                        let wrapper = this.$refs.logWrapper;
                        let scroller = wrapper && wrapper.parentElement;
                        scroller && scroller.scrollTo({
                            top: wrapper.clientHeight - scroller.clientHeight + 10,
                            left: 0
                        });
                    }, 0);
                }
            }
        },
        editorSetContent(title, content, editable) {
            if (typeof content !== 'string') {
                console.log('editorSetContent', title, content, editable);
                console.log('editorSetContent warning: Stringify content into JSON');
                content = JSON.stringify(content, null, 4);
            }

            this.hasEditor = true;
            this.editorTitle = title;
            this.editor.getModel().setValue(content);
            this.editor.updateOptions({ readOnly: !editable });
            this.editor.setScrollPosition({ scrollTop: 0 });
            this.editorIsDirty = false;
            setTimeout(() => this.editor.layout(), 0);
            this.markers = [];
        },
        editorLeaveConfirm() {
            return !this.editorIsDirty || confirm(`Do you mean to leave without saving changes?`);
        },
        async editorSave() {
            if (this.showingRule && this.editorIsDirty) {
                await this.saveRule();
                this.editorIsDirty = false;
            }
        },
        async showHistoryDetail(history) {
            this.showingHistory = (await api.get('/history/' + history.id)).data;
        },
        downloadRequest() {
            window.open('/api/history/' + this.showingHistory.id + '/req');
        },
        downloadResponse() {
            window.open('/api/history/' + this.showingHistory.id + '/res');
        },
        getIcon(history) {
            if (!history.status) {
                return iconLoading;
            }

            let [type, subtype = ''] = history.type.split('/');
            if (/\.(jpe?g|png|svg|gif|bmp|webp)?$/.test(history.url) || type === 'image') {
                return iconImage;
            }
            if (/\.html?$/.test(history.url) || subtype === 'html') {
                return iconHtml;
            }
            if (/\.css?$/.test(history.url) || subtype === 'css') {
                return iconCss;
            }
            if (/\.js?$/.test(history.url) || subtype === 'javascript') {
                return iconJs;
            }
            if (/\.json?$/.test(history.url) || subtype === 'json') {
                return iconJson;
            }
            if (type === 'text') {
                return iconText;
            }

            return 'data:image/svg+xml;utf8,<svg></svg>';
        }
    }
}
</script>
<style lang="less">
html {
    height: 100%;
    -webkit-tap-highlight-color: transparent;
    font-family: -apple-system, BlinkMacSystemFont, 'Noble Scarlet', 'PingFang SC', 'Noto Sans CJK SC', 'Source Han Sans CN', 'Microsoft YaHei UI', sans-serif;
    font-size: 13px;
    overflow: hidden;
    color: #6c7680;
}
body {
    height: 100%;
    margin: 0;
    overflow: hidden;
}
button, input, textarea {
    font-size: inherit;
    font-family: inherit;
}
::selection {
    background: rgba(0, 0, 0, .1);
}
* {
    text-size-adjust: 100%;
    -ms-overflow-style: none;
}
input, textarea {
    outline: none;
}
</style>
<style lang="less" scoped>
.app-root {
    display: flex;
    flex-direction: row;
    height: 100%;
}
.left {
    width: 30%;
    height: 100%;
    flex: 0 0 auto;
    background: #fafafa;
    border-right: 1px solid #f0f0f0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    user-select: none;

    .title {
        text-transform: uppercase;
        color: #434144;
        font-size: 12px;
        padding: 13px 15px 8px;
        height: 35px;
        box-sizing: border-box;
        cursor: pointer;

        &:hover {
            text-decoration: underline;
        }
    }

    .section {
        text-transform: uppercase;
        color: #5b595e;
        font-size: 12px;
        font-weight: bold;
        padding: 4px 15px 5px;
        cursor: pointer;
        display: flex;
        flex-direction: row;
        border-top: 1px solid #eeeeee;
        margin: 5px 0;

        .section-title {
            flex: 1 1 0;
        }

        button {
            background: none;
            border: 0;
            color: #5b595e;
            font-size: 12px;
            padding: 0;
            outline: none;
            cursor: pointer;

            &:hover {
                text-decoration: underline;
            }
        }

        &:active {
            border: 1px solid #ddd;
            padding: 4px 14px;
        }
    }

    .rule {
        cursor: pointer;
        display: flex;
        flex-direction: row;
        align-items: center;
        box-sizing: border-box;
        padding: 0 10px;

        &:hover {
            background: #f3f3f3;

            .rule-select::before {
                background: #f3f3f3;
            }
        }

        &.editing {
            background: #eeeeee;
        }

        .rule-select {
            flex: 0 0 22px;
            position: relative;
            pointer-events: all;

            &::before {
                content: '';
                position: absolute;
                left: 5px;
                top: 50%;
                margin-top: -7px;
                width: 14px;
                height: 14px;
                border: 1px solid #888;
                box-sizing: border-box;
                border-radius: 50%;
                transition: .2s;
            }

            &.selected {
                color: #fd8844;

                &::before {
                    border: 0;
                    background-image: url('../assets/checked.svg');
                    background-size: contain;
                    background-repeat: no-repeat;
                }
            }
        }

        .rule-name {
            color: #7f7c83;
            font-size: 13px;
            flex: 1 1 0;
            padding: 6px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            min-width: 0;
        }

        &:hover .rule-remove {
            width: 20px;
            position: relative;

            &::before {
                content: '';
                position: absolute;
                left: 5px;
                top: 50%;
                width: 12px;
                margin-top: -6px;
                height: 12px;
                background-image: url('../assets/remove.svg');
                background-size: contain;
                background-repeat: no-repeat;
                box-sizing: border-box;
                opacity: .5;
                transform-origin: center;
            }

            &:hover::before {
                opacity: .7;
                transform: scale(1.1);
            }
        }
    }

    .rule-add {
        padding: 5px 10px;
        position: relative;

        &::before {
            content: '';
            position: absolute;
            left: 15px;
            top: 50%;
            width: 15px;
            margin-top: -7.5px;
            height: 15px;
            background-image: url('../assets/add.svg');
            background-size: contain;
            background-repeat: no-repeat;
            box-sizing: border-box;
            opacity: .8;
        }

        input {
            width: 100%;
            box-sizing: border-box;
            padding: 3px 10px 3px 28px;
            font-size: 13px;
            background: #fafafa;
            border: none;

            &:not(:focus) {
                cursor: pointer;
            }
        }
    }

    .table-container {
        flex: 1 1 0;
        overflow: scroll;
        display: flex;
        flex-direction: column;
        font-size: 13px;

        .headers {
            font-weight: bold;
            text-transform: uppercase;
        }

        .history {
            width: 720px;
            flex: 0 0 auto;
            display: flex;
            flex-direction: column;
            padding: 5px 15px;
            box-sizing: border-box;
            cursor: pointer;

            .row {
                display: flex;
                flex-direction: row;
                align-items: center;
                width: 100%;

                >* {
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    min-width: 0;
                }

                .icon {
                    width: 14px;
                    height: 14px;
                    margin-right: 10px;
                }

                .id {
                    width: 50px;
                    margin-left: 24px;
                }

                .method {
                    width: 50px;                    
                }

                .url {
                    flex: 1 1 0;
                }

                &.row-2 {
                    font-size: 12px;
                    margin-top: 2px;
                    opacity: .7;

                    >*:not(:first-child) + * {
                        margin-left: 10px;
                    }
                }
            }

            &:hover {
                background: #f3f3f3;
            }

            &.selected {
                color: #fd8844;
                background: #ececec;
            }
        }

        &::-webkit-scrollbar {
            width: 10px;
            height: 0;
            background-color: transparent;
            display: none;
        }
        
        &::-webkit-scrollbar-thumb {
            width: 10px;
            height: 10px;
            background-color: rgba(0, 0, 0, .1);

            &:hover {
                background-color: rgba(0, 0, 0, .2);
            }
        }

        &:hover::-webkit-scrollbar {
            display: initial;
        }
    }
}
.right {
    height: 100%;
    flex: 1 1 0;
    overflow: hidden;
    background: #ffffff;
    display: flex;
    flex-direction: column;
    
    .editor-title-bar {
        flex: 0 0 40px;
        display: flex;
        flex-direction: row;
        align-items: center;
        box-shadow: inset 0 -1px 0 #f0f0f0;
        font-size: 12px;
        user-select: none;
        
        .editor-title {
            font-size: 13px;
            color: #434144;
            padding: 10px 15px 13px;
            height: 100%;
            box-sizing: border-box;
            border-top: 2px solid #fd8844;
            border-right: 1px solid #f0f0f0;
            background: #ffffff;
        }

        .editor-button {
            padding: 3px 5px;
            border-radius: 2px;
            margin-left: 15px;
            background: #f7f7f7;
            cursor: pointer;

            &:hover {
                background: #eeeeee;
            }
        }
    }

    .editor {
        flex: 1 1 0;
        overflow: hidden;
    }

    .logs {
        border-top: 1px solid #eeeeee;
        height: 30%;
        display: flex;
        flex-direction: column;

        .logs-title {
            flex: 0 0 auto;
            // text-transform: uppercase;
            color: #434144;
            font-size: 12px;
            padding: 10px 15px;
        }

        .logs-container {
            flex: 1 1 0;
            padding: 5px 15px 15px;
            min-height: 0;

            .logs-scroller {
                width: 100%;
                height: 100%;
                overflow-x: hidden;
                overflow-y: scroll;

                .logs-wrapper {
                    font-family: "Fira Code", "Monaco", "Source Code Pro", monospace;

                    .log {
                        white-space: pre-wrap;
                        word-break: break-all;
                        word-wrap: break-word;
                        width: 100%;
                        line-height: 17px;
                        padding: 0 5px;

                        .log-ctxid {
                            display: inline-block;
                            color: #55b4d4;
                            cursor: pointer;

                            &:hover {
                                text-decoration: underline;
                            }
                        }

                        .log-content {
                            display: inline;
                        }

                        &.type-error,
                        &.type-trace {
                            padding-top: 5px;
                            padding-bottom: 5px;
                            margin-top: 5px;
                            margin-bottom: 5px;
                            border-top: 1px solid #fcc;
                            border-bottom: 1px solid #fcc;
                            background: rgba(255, 0, 0, .05);

                            .log-ctxid,
                            .log-content {
                                color: #c33f3f;
                            }
                        }

                        &.bottom {
                            width: 2px;
                            height: 15px;
                            padding: 0;
                            background: #6c7680;
                            animation: blink 1s linear infinite;

                            @keyframes blink {
                                0%, 50% {
                                    opacity: 1;
                                }
                                1%, 49% {
                                    opacity: 0;
                                }
                            }
                        }
                    }
                }
            }

            .logs-empty,
            .logs-loading {
                height: 90%;
                display: flex;
                flex-direction: row;
                align-items: center;
                justify-content: center;
                font-size: 15px;
                opacity: .7;

                code {
                    font-family: 'Fira Code', 'Monaco', 'Source Code Pro', 'Courier New', Courier, monospace;
                    margin: 0 5px;
                    padding: 2px 3px;
                    background: #f7f7f7;
                }
            }
        }
    }
}
</style>
