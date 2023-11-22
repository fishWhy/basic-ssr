```
.
├── README.md
├── build
│   └── index.js
├── package.json
├── pnpm-lock.yaml
├── public
│   └── index.css
├── rollup.config.mjs
├── server
│   └── render.js
├── server.entry.js
└── src
    ├── App.jsx
    ├── html.jsx
    └── index.jsx
```
主要参考了：<br>
[”渐进式页面渲染“：详解 React Streaming 过程](https://juejin.cn/post/7248606482014896185)<br>
[从 新的 Suspense SSR 聊到 HTTP 分块传输](https://juejin.cn/post/7083329781919383588)<br>


# 本地运行项目
1. `pnpm i`安装环境。
2. `pnpm run dev:client`打包客户端代码`src/index.jsx`到文件夹`build`。
3. 本地运行`pnpm run dev:server`，启动项目。

# 服务端渲染流程（实验探究，之后会画个图说明整个过程）
1. 服务调用流程：打开客户端`localhost:3000`访问时，服务端`server.entry.js`提供服务，`/`路径对应服务调用`server/render.js`，对于这次请求`render.js`返回服务端渲染生成的`html`代码块。
2. 服务端渲染流程：`render.js`中，先去请求数据（使用setTimeout+Promise耗时3s）`comments`，再调用库`react-dom/server`中的API`renderToString`，以`/src/html.jsx`、`/src/App.jsx`React组件为原料生成`html`代码块。<br>

3. `html`代码块中，数据挂载：`render.js`中将数据`comments`传递给`/src/html.jsx`后，`/src/html.jsx`中有挂载`comments`数据的script标签（如下代码），在`render.js`生成的`html`代码块中有`<script dangerouslySetInnerHTML={{
    __html: window.__diy_ssr_context=['This is Great.', 'Worthy of recommendation!']
  }}></script>`，返回给前端。
```html
<body>
  <div id='root'>{children}</div>
  <script dangerouslySetInnerHTML={{
    __html: `window.__diy_ssr_context=${JSON.stringify(comments)}`
  }}></script>
  <script src="/index.js">
  </script>
</body>
```

4. `html`代码块中，客户端`hydrate`代码挂载：
* 客户端hydrate代码打包：`pnpm run dev:client`打包hydrate相关代码`src/index.jsx`到文件夹`build/index.js`。
* 客户端hydrate代码挂载：在`/src/html.jsx`中使用script标签去请求hydrate相关代码，在`render.js`生成的`html`代码块中有`<script src="/index.js"></script>`。

5. 客户端加载渲染：客户端获取到`html`代码块后，从上向下解析`html`代码块，执行到`<script dangerouslySetInnerHTML`，将数据挂载到`window.__diy_ssr_context`中，执行到`<script src="/index.js">`，去请求运行`/index.js`静态文件来开始hydrate。

6. 客户端进行hydrate。客户端请求`/index.js`静态文件，`server.entry.js`服务取出`build/index.js`文件返回，客户端获取后执行完成hydrate。<br>
`build/index.js`原文件对应4中所述`src/index.jsx`，即`hydrate`相关代码，如下：<br>
```javaScript
import React, { startTransition } from 'react'
import { hydrateRoot } from 'react-dom/client'
import App from './App'

startTransition(() => {
  setTimeout(() => {
    hydrateRoot(document.getElementById('root'),<App comments={window.__diy_ssr_context} />)
  }, 10000)
})
```
从代码中可以看出，`hydrate`代码中，包括`react-dom/client`的`hydrateRoot`这一API、挂载位置`#root`、待hydrate挂载的组件`APP`、`APP`组件渲染时使用的数据`window.__diy_ssr_context`。<br>
要注意：
* 客户端hydrate要渲染的App组件同服务端`render.js`生成`html`时用的App组件，两者都来自于`/src/App.jsx`，即同一组件供客户端渲染、服务端渲染两次使用。
* 客户端hydrate在渲染APP组件时，使用的数据`window.__diy_ssr_context`同在服务端`render.js`渲染APP组件时使用的数据。
* 同一数据源、同一组件源保证了客户端渲染生成的关于APP的 `html`片段同服务端`render.js`生成的，这样hydrate才可以成功的给页面绑定事件，之后页面才是可以交互。

需要关注的性能指标：
<img src="./image/SSR渲染指标.jpg" width="300px" />
<br>图片来自：https://web.dev/articles/rendering-on-the-web

* 首次内容绘制时间（First Contentful Paint，FCP）：由于服务端`render.js`获取数据`comments`需要用时3s（代码如下），服务端`render.js`至少需要等待3s才会生成`html`代码块，即用户前3s看到是空白页，首屏加载时间(FCP)是大于等于3s的。
```javascript
function getComments() {
  return new Promise((resolve) =>
    setTimeout(() => {
      resolve(['This is Great.', 'Worthy of recommendation!']);
    }, 3000)
  );
}

export default async function render(res) {
  const comments = await getComments();
```
* 首次可交互时间（Time to Interactive，TTI）：客户端接收到hydrate相关的代码（src/index.jsx）如下，需要再等10s才开始进行hydrate，因此从用户发起请求到用户可与APP组件相关的页面交互的时间（即TTI）至少是`3+10=13s`。
```javascript
startTransition(() => {
  setTimeout(() => {
    hydrateRoot(document.getElementById('root'),<App comments={window.__diy_ssr_context} />)
  }, 10000)
})
```

# Suspense SSR（渐进式页面渲染-React Streaming）

在`src/html.jsx`中，要添加`<meta charSet="utf-8" />`，否则会报如下错误：<br>
<img src='./image/suspense_ssr错误.jpg' width="350px"/><br>

可用的链接：<br>


[Web前端最新优化指标：FP、FCP、LCP、CLS、TTI、FID、TBT、FMP等](https://www.cnblogs.com/gg-qq/p/16178277.html)<br>

使用wireshark抓包：<br>
[Macos下的wireshark抓包权限不足问题](https://codeantenna.com/a/pRXs0yMrHD)<br>
[45张图带你从入门到精通学习WireShark！](https://juejin.cn/post/7140935564827557896?searchId=202311221617565FD8473E973707133303)<br>


HTTP2问题：<br>
[当 Transfer-Encoding: chunked 遇上 HTTP2](https://zhuanlan.zhihu.com/p/598820668)<br>
[HTTP2 下的 Transfer-Encoding: chunked](https://kiosk007.top/post/http2-%E6%94%AF%E6%8C%81%E5%88%86%E5%9D%97%E4%BC%A0%E8%BE%93/)<br>
[http2讲解](https://http2-explained.haxx.se/zh)<br>
[从理论到实践 全面理解HTTP/2](https://www.cnblogs.com/nuannuan7362/p/10397536.html)<br>
[通过 Node.js, Express.js 实现 HTTP/2 Server Push](https://developer.aliyun.com/article/181579)<br>








