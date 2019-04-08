# Vanessa

Can you hear me?

## 开始使用（开发中）

Vanessa 正处于开发阶段，暂未提供 Web 管理界面。

```bash
git clone https://github.com/rikumi/vanessa
cd vanessa
yarn && npm run start
```

## 安装并信任证书

客户端首次连接代理时，需要安装并信任证书，证书的位置在 `~/.config/vanessa/certs/ca.pem`。

- macOS：双击证书文件 - 安装到「系统」- 打开「钥匙串」-「系统」- `NodeMITMProxyCA` - `⌘I` - 信任 - 使用此证书时：始终信任
- iOS：在 Safari 中下载并打开证书文件 - 安装证书后进入「通用」-「关于本机」-「证书信任设置」- 信任 `NodeMITMProxyCA`
- Android：直接安装证书即可

## 配置文件

配置文件位于 `~/.config/vanessa/` 目录下，首次拦截到请求将自动生成。默认使用 global + default 两个配置文件，编辑后保存即可自动更新配置。配置语法示例：

```javascript
if (req.realHost === 'test.qq.com') {
    // 读写请求目标服务器
    req.realHost = '127.0.0.1:8080';
    req.realHost = '127.0.0.1';
    req.port = 8080;
}

// 读写请求虚拟域名
if (req.virtualHost === '10.0.0.1') req.virtualHost = 'test.qq.com';

// 读写请求 URL、请求方法、请求头、请求路径
req.url = req.url.replace(/\.htm$/, '.html');
req.method = req.method.replace('GET', 'POST');
req.headers['user-agent'] += ' vanessa/1.0.0';
if (!/\/$/.test(req.path)) req.path += '/';

// 设置代理，也可以使用 PAC 语法，例如 'SOCKS 127.0.0.1:1081'
req.proxy = 'http://localhost:8070/proxy.pac';
req.proxy = 'http://localhost:8001/';
req.proxy = 'https://localhost:8001/';
req.proxy = 'socks://localhost:1081/';

// 在 await res 之前对 res 进行操作，不等服务器响应，直接返回
res.status = 404;                                   // 不请求，直接返回某错误
res.data = 'Hello World';                           // 不请求，直接返回 200

// 等待收到返回头
// 在 await res 之后对 res 进行操作，会先等待服务器响应
await res;

res.status = 200;                                   // 正常请求，只更改返回码
res.headers['access-control-allow-origin'] = '*';   // 正常请求，只更改头

res.data.transformStream(duplex);                   // 流内变换
res.data.transformAll((k) => {                      // hold 住所有数据，进行一次性变换
    typeof k === 'object' && (k.test = 1);
});
res.data.replace(/必应/g, '必硬');                   // 流内实时字符串替换
res.data.delay(5000);                               // 对所有流数据整体延后 5 秒
res.data.throttle(1000);                            // 限制数据流速度为 1kB/s
res.data.prepend('<script>alert("test")</script>'); // 在返回数据流的开头添加内容
res.data.append('<script>alert("test")</script>');  // 在返回数据流的结尾添加内容
res.data.overwrite('Hello World');                  // 直接覆盖整个数据流内容，不需要等待原数据流结束
res.data = 'Hello World';                           // 另一种写法
```