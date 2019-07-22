# Vanessa

> ⚉ Can you hear me?

## 简介

![预览](https://user-images.githubusercontent.com/5051300/61587495-df000580-abbd-11e9-8afa-9d4dca56e0d8.png)

Vanessa 是一款简单但强大的 Web 代理抓包调试工具，由 rikumi 独立开发，同时也是我的本科毕业设计作品。

Vanessa 的命名来自于 [Cytus II](https://zh.wikipedia.org/wiki/Cytus_II) 中的角色。在人工智慧被人类打败后的世界，智能机体 Vanessa 作为人类的俘虏，沉睡在荒草丛生的 Library 里，驱动着人类世界科技的正常运转，直到被醒来的同伴 Ivy 唤醒，开始了与人类和自我对抗的旅程。~~同时这个命名也意味着 Bug 很多。~~

![Vanessa](https://user-images.githubusercontent.com/5051300/61588892-4ecdba80-abd5-11e9-936d-5e65e07aa9f5.png)

Vanessa 的灵感来自 [Whistle](https://github.com/avwo/whistle)，部分实现代码参照了 [http-mitm-proxy](https://npmjs.com/http-mitm-proxy)，将其拆分为**支持作为代理的 Koa 服务器**以及**用于代理的各种内置中间件**两个部分进行实现。Vanessa 的功能与 Whistle 相比，可以参考下表。

| 特性 | Whistle | Vanessa |
|---|---|---|
| 平台支持 | 全平台 | 理论全平台，仅测 macOS |
| HTTP 抓包 | 支持 | 支持 |
| HTTPS MITM 抓包 | 可选 | 强制开启 |
| WebSocket 抓包 | 支持 | 仅代理，暂不支持抓包 |
| 证书安装 | 自行安装 | HTTP 页面引导安装 |
| 配置文件 | 支持，特殊语法 | **支持，Node Koa 中间件语法** |
| 开机自启 | 不支持 | **自动配置** |
| 上游代理 | 手动设置 | **自动检测（系统代理，环境变量代理）** |
| 多用户 | 不支持 | **IP 多用户（共享配置，单独开关）** |
| 插件 | 支持 | 暂不支持（后续将支持 npm 安装第三方 koa 中间件） |

## 安装

1. `npm i -g vanessa` 或 `yarn global add vanessa`;
2. 安装完成后，输入监听端口号，即可在后台启动，同时设置开机自启动；
3. 在需要代理的设备（如本机）设置系统 HTTP 代理（Firefox 浏览器设置独立代理）到本机设定好的端口上；
4. 在需要代理的设备上，访问 **http**://vanes.sa/，根据提示安装并信任证书后，点击 **Take me to Vanessa** 进入管理页面。

## 中间件语法

在管理界面左侧 New rule，输入新规则的名称，可以创建新的中间件规则。Vanessa 规则是标准的 Koa 中间件格式，可以访问 https://koajs.com/ 学习 Koa 中间件的用法。

另外，Vanessa 作为代理服务器，在 Koa 中间件的语法上增加了一些新的特性：

### 控制台输出

在中间件配置中，使用 `console.log()` `console.error()` 可将参数以类似于 Node.js 的格式输出到管理界面的控制台上。在规则的编辑状态，可以查看规则在每次请求中的控制台输出；在请求记录的查看状态，可以查看该请求经过的所有中间件时的控制台输出。

### 上下文阶段

在中间件配置中，`next()` 方法实质上会递归调用剩余的中间件，最终对真实的远程服务器发起请求并得到响应。以 `next()` 为界，中间件分为**请求**和**响应**两个执行阶段。像 Koa 中间件的常见书写方式一样，使用 `await next()` 可以对两个阶段的处理逻辑进行区分；另外，在书写异步回调等特殊情况下，不清楚当前的阶段，可以通过 `ctx.phase` 获得，其值可以为 `'request'` 或 `'response'`。

### 请求摘要

在管理界面中，选择左侧需要查看的请求，会在右侧编辑器中显示有关请求信息的 JSON 文本，其原理是 Vanessa 会对最近 1000 次请求的上下文对象短时间持有引用，并在管理界面中显示其 `summary` 属性，即 `ctx.summary`。

你可以在中间件配置中对 `ctx.summary` 添加新的属性，使其出现在请求详情的 JSON 文本中。

### 请求对象可写

Koa 中，服务器本身作为请求的终点，请求的各项属性均为只读的，不可以更改（更改了也没有意义）；Vanessa 作为代理服务器，`ctx.request` 中的属性（`url`，`host`，`method` 等）均可以修改，修改后将会影响代理服务器请求远程服务器时的行为。

另外，由于 Koa 请求对象可能并不完整包含请求所需的所有参数，Vanessa 提供了附加配置对象 `ctx.requestOptions`，可在其中添加 `http.request()`（`https.request()`）支持的其它配置属性。

### 主机（Host Name）与虚拟域名（Host Header）

抓包修改请求过程中，常常有两种需要修改域名（Host）的情况：一种是让请求走到不同的**远程主机**，但请求的**虚拟域名**（即 Headers 中的 `Host`）不变，可以帮助我们将现有的请求路由到不同于 DNS 实际解析的服务器（如测试服务器）的同时，保持原有的 `Host` 头；另一种需求是让请求的目标主机和虚拟域名同时改变，以便将这一次请求替换为完全不同的远程文件。

修改 `ctx.host`（`ctx.request.host`）将保持虚拟域名不变，只改变请求发送到的虚拟主机（可以为域名或 IP 地址）；修改 `ctx.request.headers.host` 则会保持远程主机不变，只改变发送到该主机上的虚拟域名。

注意：

1. 管理界面中显示的地址是 `ctx.request.url`，其中的域名部分将会显示为虚拟域名的值，而非实际主机的域名。
2. 由于实现上的限制，目前发出 HTTPS 请求所带的 SNI 头部将会保持与远程主机一致，而不是与虚拟域名一致，这并不符合 SNI 的设计本意。这一实现缺陷在后续版本可能会修正，请留意。

### 原始连接请求（CONNECT request）

在 HTTPS 中间人代理的语境下，客户端发来的请求是 CONNECT 请求，它要求我们连接到远程服务器，并原样转发连接中的所有（密文的）数据；中间人代理随之建立对应的**虚拟远程服务器**，让客户端与虚拟远程服务器之间进行加密通讯，而虚拟远程服务器受到根证书的信任，可以解密客户端发来的 HTTPS 请求中的 HTTP 报文。

这也就意味着，**客户端真实发来的请求**与**能解密得到 HTTP 报文的请求**分属于不同的连接。因为这样的特性，在中间件中获取原始请求中的客户端 IP 地址等属性会出现麻烦。

因此，在Vanessa 中：

- 通过 `ctx.request.protocol` 可以获得客户端发来的原始请求的协议（`http` 或 `https`），并可以进行修改，改变最终发给真实远程服务器的请求协议；
- 通过 `ctx.request.ip` 可以取得客户端的真实 IP；
- 通过 `ctx.rawRequest` 可以取得原始的 CONNECT 请求，而非虚拟远程服务器收到的具体 HTTP 请求；

### 上游代理（链式代理）

通过 `ctx.proxy`（`ctx.request.proxy`）对象，可以设置本次请求所使用的上游代理（链式代理）。该对象含有 `pac`/`socks`/`http`/`https` 四种属性，均为代理服务器或 PAC 文件的**完整 URL 字符串**。

目前上游代理配置的容错性不佳，若书写格式错误可能导致 SSL 出错。

需要注意的是，其中 `http` 表示**自身协议为 HTTP 的**代理服务器，而非用于处理 HTTP 请求的代理服务器；`https` 同理。

若有两种或两种以上属性存在，其优先级顺序为 `pac`>`socks`>`http`>`https`。

### URL 快速匹配

通过 `ctx.test()` 方法可以快速对 URL 进行匹配，匹配语法类似于 `koa-router`，如果模式串中出现协议，协议为精确匹配，其余部分使用 `path-to-regexp` 进行匹配。具体可参见 [path-to-regexp](https://www.npmjs.com/package/path-to-regexp) 的文档。例：

```javascript
module.exports = async (ctx, next) => {
    console.log(ctx.url); // https://support.qq.com/products/28096

    ctx.test('https://support.qq.com/:route+'); // { route: 'products/28096' }
    ctx.test('http://support.qq.com/:route+');  // null
    ctx.test('//support.qq.com/:route+');       // { route: 'products/28096' }
    ctx.test('support.qq.com/:route+');         // { route: 'products/28096' }
    ctx.test('support.qq.com/:route');          // null
    ctx.test(':sub.qq.com/:route+');            // { sub: 'support', route: 'products/28096' }
    ctx.test('support.qq.com/products/:id');    // { id: '28096' }
    await next();
}
```

### 发送本地文件

通过 `ctx.send()` 方法可以发送本地文件，但一定要 `await`。例如：

```javascript
module.exports = async (ctx, next) => {
    let res;
    if (ctx.test('//docs.qq.com/sheet/(.+)')) {
        await ctx.send('~/Documents/sheet/dev/html/pc.html');
    } else if (res = ctx.test('//docs.qq.com/static/img/:route+')) {
        await ctx.send('~/Documents/sheet/dev/img/' + res.route);
    } else if (res = ctx.test('//docs.qq.com/static/dev/:route+')) {
        await ctx.send('~/Documents/sheet/dev/' + res.route);
    } else {
        await next();
    }
}
```

### 会话对象

`ctx.session` 为当前会话的持久化对象，它是每个用户（按 IP 区分）的唯一存储对象，可以进行读写，Vanessa 会自动负责持久化。

### 流操作

Vanessa 借用了 Koa 的 `ctx.request.body` 和 `ctx.response.body` 两个对象，用于保存当前的请求流和响应流。若要对流进行所需的变换（[Stream.Transform](https://nodejs.org/api/stream.html#stream_duplex_and_transform_streams)），只需要将该流 `pipe` 过所需的变换，并将得到的可读流重新赋给 `ctx.request.body` 或 `ctx.response.body` 即可。例如：

```javascript
module.exports = async (ctx, next) => {
    ctx.request.body = ctx.request.body.pipe(myDuplex);
    await next();
    ctx.response.body = ctx.response.body.pipe(myDuplex);
}
```

特别说明，`ctx.req` 和 `ctx.res` 这两个属性在 Vanessa 中有特殊的用途，尽量不要对它们进行修改，否则可能导致未定义行为。

另外，Vanessa 提供了一些常用的**流读取和流变换方法**，位于 `ctx.request` 以及 `ctx.response` 中：

#### 流读取

以下**流读取方法**可以使用在任何不早于流产生的阶段，即在请求阶段可读取请求流，在响应阶段可读取请求流和响应流。

- `async all()`：Hold 住整个流，等所有数据传输完毕，并使用 [raw-body](https://www.npmjs.com/package/raw-body) 的默认配置，解析和返回 UTF-8 字符串数据，限 1M 以内。
- `async json()`：同 `all()`，但解析为 JSON 格式，可能会抛出异常。
- `async cheerio()`：同 `all()`，但解析为 [Cheerio](https://www.npmjs.com/package/cheerio) 格式，方便操作 HTML 文档。

#### 流变换

以下**流变换方法**只能使用在流产生的阶段，即在请求阶段只能变换请求流，在响应阶段只能变换响应流；这些方法将会自动用变换后的流替换原有的流，并支持链式调用。

- `transform(duplex)`：将流通过一个流变换。
- `replace(find, replace)`：利用 [replacestream](https://www.npmjs.com/package/replacestream) 在流内进行实时正则查找替换，在不破坏流的实时性的同时，保证跨数据包边界的查找串也能正常替换。
- `prepend(data)`：在流的起始端增加一段字符串或 Buffer。
- `append(data)`：在流的末尾端增加一段字符串或 Buffer。
- `delay(ms)`：使流中的所有数据包延后指定的毫秒数。
- `throttle(bytesPerSecond)`：限制流中数据的传输速度不超过一个固定的数值（字节/秒）。

## FAQ

### 1. 支持 HTTPS 代理吗？

首先需要明白的是，在代理服务器中，提到 HTTPS/HTTPS 有两种情况，一种是请求本身所使用的协议，另一种代理服务器所监听的协议，经过排列组合事实上一共有四种情况：

1. 通过 HTTP 代理发出 HTTP 请求
2. 通过 HTTP 代理发出 HTTPS 请求
3. 通过 HTTPS 代理发出 HTTP 请求
4. 通过 HTTPS 代理发出 HTTPS 请求

Vanessa 是 HTTP 代理，暂时不支持通过 HTTPS 连接，但通过 Vanessa 可以正常收发 HTTP/HTTPS 协议的请求。

### 2. 我的系统配置了 Tencent iOA/V2Ray/ShadowSocks 等代理服务，如何让 Vanessa 连接到这些代理？

Vanessa 支持在请求时自动探测 Windows 和 macOS 的系统代理及环境变量代理，但开机自启动的 Vanessa 不在 Shell 中运行，不具备环境变量，只能探测系统代理。

因此，日常推荐的做法是，让系统代理保持第三方代理程序的设置，让 Vanessa 可以自动探测到它们，然后在 Chrome 浏览器中通过 SwitchyOmega 等浏览器插件连接 Vanessa 进行使用；

如果你禁用了 Tencent iOA/V2Ray/ShadowSocks 等代理服务的自动设置系统代理功能（例如 Tencent iOA 进入调试模式，V2RayNG 设置为手动模式等），并将系统代理设置为 Vanessa，此时 Vanessa 将无法再自动检测第三方代理，会自动改为直连，需要[手动书写中间件进行设置](#上游代理链式代理)，或在 `~/Library/LaunchAgents/vanessa.plist` 中添加环境变量。