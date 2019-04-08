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

// 不请求直接返回
res = 404;                                        // 不请求，直接返回某错误
res = 'Hello World';                              // 不请求，直接返回 200

// 等待收到返回头，所有需要取得返回内容的变换需要在本句之后
res = await res;

res.status = 200;                                 // 正常请求，只更改返回码
res.headers['access-control-allow-origin'] = '*'; // 正常请求，只更改头

res.data.transformStream(duplex);                 // 流内变换
res.data.transformAll((k) => {                    // hold 住所有数据，进行一次性变换
    typeof k === 'object' && (k.test = 1);
});
res.data.replace(/必应/g, '必硬');                 // 流内实时字符串替换
res.data.delay(5000);                             // 对所有流数据整体延后 5 秒
res.data.throttle(1000);                          // 限制数据流速度为 1kB/s
res.data.overwrite('Hello World');                // 直接覆盖整个数据流内容，不等待原数据流结束
res.data = 'Hello World';                         // 另一种写法