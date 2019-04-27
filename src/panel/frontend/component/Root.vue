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
                        :style='getHistoryStyles(history)'
                        @click='showHistoryDetail(history)'>
                        <div class="id">{{ history.id }}</div>
                        <div class="ip">{{ history.ip }}</div>
                        <div class="method">{{ history.method }}</div>
                        <div class="url">{{ history.url }}</div>
                        <div class="status">{{ history.status }}</div>
                        <div class="type">{{ history.type }}</div>
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
                    v-if="showingHistory && showingHistory.response.status"
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
import theme from '../ayu-light.json';

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
            renderLineHighlight: 'none'
        });
        window.addEventListener('resize', () => {
            this.editor.layout();
        });
    },
    watch: {
        hasEditor() {
            setTimeout(() => this.editor.layout(), 0);
        }
    },
    methods: {
        async reload() {
            this.rules = (await api.get('/rule')).data;
        },
        async refreshHistory() {
            let finishedHistory = this.histories.filter(k => k.status);
            let { id = -1 } = finishedHistory.slice(-1)[0] || {};
            let next = (await api.get('/history/~' + (id + 1))).data;
            finishedHistory = this.histories.filter(k => k.id <= id);
            this.histories = finishedHistory.concat(next);
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
            try {
                this.editor.getModel().setValue(content);
            } catch (e) {
                console.log(e, e.message)
                if (!/Unexpected usage/.test(e.message)) {
                    throw e;
                }
            }
            this.editor.updateOptions({ readOnly: !editable });
            this.editor.setScrollPosition({ scrollTop: 0 });
        },
        getHistoryStyles(history) {
            return {
                opacity: history.status ? 1 : 0.5
            }
        },
        async showHistoryDetail(history) {
            this.showingHistory = (await api.get('/history/' + history.id)).data;
            this.setContent('history-' + history.id + '.json', JSON.stringify(this.showingHistory, null, 4), false);
        },
        downloadRequest() {
            window.open('/api/history/' + this.showingHistory.id + '/req');
        },
        downloadResponse() {
            window.open('/api/history/' + this.showingHistory.id + '/res');
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
    background: var(--color-primary-bg);
}
* {
    text-size-adjust: 100%;
    -ms-overflow-style: none;
}
</style>
<style lang="less" scoped>
.app-root {
    display: flex;
    flex-direction: row;
    height: 100%;
}
.left {
    width: 400px;
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
            flex-direction: row;
            padding: 5px 15px;
            box-sizing: border-box;
            cursor: pointer;

            >* {
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                min-width: 0;
            }

            .id {
                flex: 2 0 0;
            }

            .ip {
                flex: 4 0 0;
            }

            .method {
                flex: 3 0 0;
            }

            .url {
                flex: 16 0 0;
            }

            .status {
                flex: 2 0 0;
            }

            .type {
                flex: 10 0 0;
            }

            &:hover {
                background: #f0f0f0;
            }

            &.selected {
                color: #fd8844;
                background: #eeeeee;
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
            background-color: rgba(0, 0, 0, .2);

            &:hover {
                background-color: rgba(0, 0, 0, .3);
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
