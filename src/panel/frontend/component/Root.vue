<template>
    <div class="app-root">
        <div class="left">
            <div class="title">Vanessa</div>
            <div class="section">
                <div class="section-title">Rules</div>
                <button class="disable-all" @click="disableAllRules()">Disable All</button>
            </div>
            <div class="rule" v-for="rule in rules" :key="rule.name" :class="{ selected: rule.isSelected }" @click="toggleRule(rule)">
                {{ rule.name }}
            </div>
            <div class="section">
                <div class="section-title">History</div>
            </div>
            <div class="table-container">
                <div class="table-scrollable">
                    <div class="history" v-for="history in histories.slice().reverse()"
                        :key='history.id'
                        :class='{ selected: showingHistory && showingHistory.id === history.id }'
                        @click='showHistoryDetail(history)'>
                        <div class="row row-1">
                            <img class="icon" :src="getIcon(history)">
                            <div class="method">{{ history.method }}</div>
                            <div class="url">{{ history.url }}</div>
                        </div>
                        <div class="row row-2">
                            <div class="id">#{{ history.id }}</div>
                            <div class="ip">From: {{ history.ip }}</div>
                            <div class="status">Status: {{ history.status }}</div>
                            <div class="type">Type: {{ history.type || '[unspecified]' }}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="right" v-show="hasEditor">
            <div class="editor-title-bar">
                <div class="editor-title">{{ editorTitle }}</div>
                <div class="download"
                    v-if="showingHistory"
                    @click="downloadRequest"
                >Request body</div>
                <div class="download"
                    v-if="showingHistory && showingHistory.response && showingHistory.response.status"
                    @click="downloadResponse"
                >Response body</div>
            </div>
            <div class="editor" ref="editorContainer"></div>
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

export default {
    data: () => ({
        rules: [],
        histories: [],
        editor: null,
        showingHistory: null,
        editorTitle: '',
        hasEditor: false,
    }),
    created() {
        this.reload();
        this.refreshHistory();
    },
    mounted() {
        this.editor = monaco.editor.create(this.$refs.editorContainer, {
            minimap: {
                enabled: false
            },
            language: 'javascript',
            fontFamily: '"Fira Code", "Monaco", "Source Code Pro", monospace',
            fontLigatures: true,
            fontSize: 13,
            readOnly: true,
            wordWrap: 'on',
            theme: 'ayu-light',
            renderLineHighlight: 'none',
            contextmenu: false,
            scrollBeyondLastLine: false
        });
        window.addEventListener('resize', () => {
            this.editor.layout();
        });
    },
    watch: {
        hasEditor() {
            setTimeout(() => this.editor.layout(), 0);
        },
        showingHistory() {
            let history = this.showingHistory;
            if (history) {
                this.setContent('history-' + history.id + '.json', JSON.stringify(this.showingHistory, null, 4), false);
            }
        }
    },
    methods: {
        async reload() {
            this.rules = (await api.get('/rule')).data;
        },
        async refreshHistory() {
            let unfinishedHistory = this.histories.filter(k => !k.status);
            let { id = 0 } = unfinishedHistory[0] || {};
            let next = (await api.get('/history/~' + id)).data;
            let finishedHistory = this.histories.filter(k => k.id < id);
            this.histories = finishedHistory.concat(next);
            if (this.showingHistory && !this.showingHistory.response.status) {
                let updated = next.find(k => k.id === this.showingHistory.id);
                if (updated.status) {
                    this.showHistoryDetail(this.showingHistory);
                }
            }
            setTimeout(this.refreshHistory.bind(this), 500);
        },
        async toggleRule(rule) {
            if (rule.isSelected) {
                await api.delete('/rule/' + rule.name);
                this.reload();
            } else {
                await api.post('/rule/' + rule.name);
                this.reload();
            }
            let ruleContent = (await api.get('/rule/' + rule.name)).data.content;

            this.showingHistory = null;
            this.setContent(rule.name, ruleContent, true);
        },
        async disableAllRules() {
            await api.delete('/rule');
            this.reload();
        },
        setContent(title, content, editable) {
            this.hasEditor = true;
            this.editorTitle = title;
            this.editor.getModel().setValue(content);
            this.editor.updateOptions({ readOnly: !editable });
            this.editor.setScrollPosition({ scrollTop: 0 });
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
        color: #7f7c83;
        font-size: 13px;
        padding: 5px 35px;
        cursor: pointer;
        display: flex;
        flex-direction: row;
        position: relative;

        &::before {
            content: '';
            position: absolute;
            left: 15px;
            top: 50%;
            margin-top: -4px;
            width: 8px;
            height: 8px;
            border: 1px solid #666;
            box-sizing: border-box;
            border-radius: 50%;
        }

        &.selected {
            color: #fd8844;
            background: #eeeeee;

            &::before {
                border: 0;
                background: #fd8844;
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

        .download {
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
    }
}
</style>
