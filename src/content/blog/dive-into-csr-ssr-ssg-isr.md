---
author: binghuis
pubDatetime: 2024-08-20
title: 深入了解 Next.js 中 CSR、SSR、SSG、ISR 四种前端渲染方式
slug: dive-into-csr-ssr-ssg-isr
featured: false
draft: false
tags:
  - nextjs
description: 本文主要介绍 Next.js 中四种常见的前端渲染方式，包括客户端渲染（CSR）、服务端渲染（SSR）、静态站点生成（SSG）和增量静态再生（ISR）。
---

_文中涉及到 React 和 Next.js 默认指的是版本 18 和 14。_

## CSR（Client-side Rendering 客户端渲染）

客户端渲染指的是网页的渲染过程发生在浏览器。

浏览器从服务器请求一个 HTML 文件，这个文件通常包含一个用于挂载 JS 应用的根 DOM 元素，例如：

```html
<div id="root"></div>
```

React 通过 API 将应用挂载到这个根 DOM 元素上，从而渲染出完整的页面内容。调用过程如下：

```jsx
import React from "react";
import ReactDOM from "react-dom/client";

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
```

在前端 Babel 将 JSX 语法转换为对 React 元素构造函数的调用。比如：

```jsx
<div>hello, world</div>
```

被转换为：

```js
import { jsx as _jsx } from "react/jsx-runtime";
/*#__PURE__*/ _jsx("div", {
  children: "hello, world",
});
```

React 通过 `_jsx` 方法创建 React 元素，并对这些元素进行处理，构建出真实的 DOM。

最后，这些 DOM 会被挂载到 #root 根 DOM 上，从而实现页面渲染。

客户端渲染适合高动态单页应用（SPA），例如后台管理系统。

这些应用通常需要频繁的与用户交互、动态更新页面内容，通过在客户端进行渲染，可减少页面重新加载的次数，快速响应用户操作，从而提升整体的交互性能。

### 优势：

**增强用户体验** 客户端渲染将页面的渲染和更新放在前端进行，避免了服务器再次生成完整页面造成的整页刷新，因此可以实现即时的交互反馈和页面的部分更新。

**服务器负担小** 数据处理和页面渲染在客户端进行，减少了服务器的计算和渲染压力，在高并发场景下效果尤为显著。

### 不足：

**首屏加载慢**

由于页面内容的渲染是在客户端进行的，因此页面所有的 JS 代码块（chunks）都需要从服务器传输到浏览器执行。
较大的 JS 文件会导致加载时间延长，用户可能会看到短暂的白屏或闪烁现象。

**SEO 问题**

传统的搜索引擎爬虫主要依赖静态 HTML 内容进行索引。但客户端渲染的内容是通过 JS 动态生成的。

根据 Vercel 团队的最新测试结果，现代搜索引擎（如 Google）能够有效处理和索引 JS 渲染的内容。参考 [How Google handles JavaScript throughout the indexing process](https://vercel.com/blog/how-google-handles-javascript-throughout-the-indexing-process#myth-1-%E2%80%9Cgoogle-can%E2%80%99t-render-javascript-content%E2%80%9D)。

然而，Baidu 在处理 JS 渲染内容方面的支持仍然有限，且目前没有明确的计划进行技术升级。相关信息请参考 [百度搜索引擎工作原理](https://ziyuan.baidu.com/college/courseinfo?id=144)。

拓展：

- [了解 Google JavaScript SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics?hl=zh-cn)。
- [Babel 在线转换 JSX](https://babeljs.io/repl#?browsers=defaults%2C%20not%20ie%2011%2C%20not%20ie_mob%2011&build=&builtIns=false&corejs=3.21&spec=false&loose=false&code_lz=DwEwlgbgfAFgpgGwQewDQAIDuyBOCTAD040QA&debug=false&forceAllTransforms=false&modules=false&shippedProposals=false&evaluate=false&fileSize=false&timeTravel=false&sourceType=module&lineWrap=true&presets=env%2Creact%2Cstage-2%2Ctypescript&prettier=true&targets=&version=7.25.3&externalPlugins=&assumptions=%7B%7D)

## SSR（Server-side Rendering 服务端渲染）

服务端渲染是指页面的渲染过程发生在服务器。

与客户端渲染不同，在服务端渲染中浏览器接收到的 HTML 文档已经包含了完整的 DOM 结构，而非一个空的根 DOM。

本模块内容部分参考了 React 团队成员 [dan](https://github.com/gaearon) 在社区里的两篇文章：

- React 18 关于 SSR Suspense 的官方讨论 [New Suspense SSR Architecture in React 18 #37](https://github.com/reactwg/react-18/discussions/37)
- React 18 服务器升级官方指南 [Upgrading to React 18 on the server #22](https://github.com/reactwg/react-18/discussions/22)

React 的 SSR 执行过程：

1. 在服务器获取整个页面数据。
2. 根据数据生成 HTML 文档，并将其发送给浏览器。
3. 浏览器接收与页面水合和动态更新相关的 JS chunks。
4. React 对获取到的非交互 HTML 进行水合操作，使 HTML 具有交互能力。

针对服务端渲染过程里的几点作进一步解释：

**非交互指的是什么？**

字面意思，就是没有与用户交互的能力，非交互页面具备完整的 DOM 结构，但是没有绑定交互事件，简单说就是，能看但不能操作。

**水合是什么意思？**

使非交互页面具备交互能力的过程就是水合。React 的 [hydrateRoot](https://zh-hans.react.dev/reference/react-dom/client/hydrateRoot#hydrating-server-rendered-html) 就是水合方法。

```jsx
import { hydrateRoot } from "react-dom/client";

hydrateRoot(document.getElementById("root"), <App />);
```

> 水合是 SSR 特有的过程，在 CSR 中，由于页面内容完全由客户端通过 JS 生成，因此不需要水合页面即有交互能力。

**HTML 文档的传输方式是什么？**

以 Next.js Edge 环境为例，Next.js 的 `renderToInitialFizzStream` 方法使用 React Server API [renderToReadableStream](https://zh-hans.react.dev/reference/react-dom/server/renderToReadableStream) 将 React 树渲染为 HTML 并发送至 Web 可读流。

```jsx
export function renderToInitialFizzStream({
  ReactDOMServer,
  element,
  streamOptions,
}: {
  ReactDOMServer: typeof import('react-dom/server.edge')
  element: React.ReactElement
  streamOptions?: any
}): Promise<ReactReadableStream> {
  return getTracer().trace(AppRenderSpan.renderToReadableStream, async () =>
    ReactDOMServer.renderToReadableStream(element, streamOptions)
  )
}
```

**为什么服务端渲染服务器向客户端传输的 JS chunks 比客户端渲染少？**

相比客户端渲染需要加载所有的 JS chunks，服务端渲染只需要加载一部分 JS chunks，这些 chunk 主要用于处理交互和页面水合。

服务端渲染适用于对首屏加载速度有一定要求，且注重 SEO 的网站，比如新闻类网站。

### 优势

**首屏加载快** 页面在服务器预渲染完成后直接返回给浏览器，用户几乎可以即时看到页面内容。这与客户端渲染不同，后者需要浏览器下载和执行相关 JS 文件后才能构建和展示页面内容。

**SEO 友好** 服务器端渲染生成的页面包含完整的 HTML 内容，使得搜索引擎能够更轻松地抓取和索引页面。

### 不足

**不适合高动态页面** 对于内容频繁更新的动态页面，服务端渲染每次请求都需要重新生成和渲染页面内容，这可能导致性能瓶颈和响应延迟。

**服务器负担重** 服务器需要处理数据获取和页面渲染，这会显著增加服务器的负担。每次用户请求都会触发服务器端的计算和渲染过程。

## SSG（Static Site Generation 静态站点生成）

静态站点生成是指页面的渲染过程发生在项目构建时，而不是在客户端或服务端的运行时。

在开发者运行构建命令时（如 Next.js 的 `next build`），构建工具会在服务器端或本地环境预先渲染所有页面，
根据每个页面生成一个静态 HTML 文件。这些 HTML 文件包含了预渲染的内容和样式，类似于 SSR 的结果，但这个渲染过程仅发生一次（即构建时）。

生成的静态 HTML 文件会被部署到静态文件服务器或 CDN 上。当用户访问网站时，服务器直接返回这些预生成的 HTML 文件，而无需在运行时进行任何额外的渲染操作。

静态生成（SSG）适用于内容相对稳定、更新频率较低，且注重 SEO 的网站，比如博客。

## ISR（Incremental Static Regeneration 增量静态再生）

增量静态再生（ISR）结合了静态站点生成（SSG）和服务端渲染（SSR）的特点。

在初次构建时，ISR 会像 SSG 一样预生成静态页面，并将其部署到服务器或 CDN。

当用户访问页面时，如果页面已经过期，ISR 会触发一个后台再生成过程。这个过程在服务器端完成，类似于 SSR，但与 SSR 不同的是，再生成的页面会被存储为静态文件，而不是每次请求都进行实时渲染。

具体来说，再生成的流程如下：

1. 用户请求过期的页面时，ISR 会启动一个后台再生成过程。
2. 服务器重新生成页面，并将新的 HTML 文件更新到缓存中。
3. 在生成过程完成后，下一个用户请求将会获得更新后的页面。

举个例子，假设一个 Next.js 页面设置了 `revalidate` 选项为 10 秒，这意味着页面在构建时将会生成静态 HTML 文件，并在 10 秒内保持不变。

具体流程如下：

1. **0-10 秒**：在初始构建完成后的前 10 秒内，用户请求的 HTML 文件都是之前生成的静态页面。页面不会重新生成，所有请求都直接返回缓存的静态页面。
2. **10 秒后**：当第一个请求到达并发现页面已经过期时（超过了 10 秒），ISR 会启动一个后台再生成过程。此时，服务器仍然会返回旧的缓存页面给用户，同时在后台生成新的页面。
3. **生成完成后**：当后台生成的页面完成后，下一个用户请求将会得到新的页面。新生成的页面会被存储为缓存静态文件，并在后续的 10 秒内继续使用，直到再次触发再生成过程。

这种机制保证了页面在大部分时间内快速响应，同时能够在后台静默地更新内容，确保用户能尽快看到最新的数据。

增量静态再生（ISR）可以平衡实时性和性能，适合需要频繁更新内容但仍希望保持较高性能的网站，比如新闻类网站和博客。

## 总结

### 渲染时机和优缺点对比

| 渲染方式            | 渲染时机      | 优缺点                                                                                 |
| :------------------ | :------------ | :------------------------------------------------------------------------------------- |
| 客户端渲染（CSR）   | 运行时        | 支持动态内容和局部更新，交互更流畅。但首屏加载较慢，且对搜索引擎的 SEO 支持有限。      |
| 服务端渲染（SSR）   | 运行时        | 首屏加载迅速，SEO 友好。但服务器负担较重，需要处理数据和页面渲染，可能导致性能瓶颈。   |
| 静态站点生成（SSG） | 构建时        | 页面加载极快，服务器负担轻。但不能实时更新内容，交互性和动态功能受限。                 |
| 增量静态再生（ISR） | 构建时+运行时 | 结合了 SSG 和 SSR 的优点，页面加载极快，且支持在缓存过期后通过服务端渲染更新页面内容。 |

### 性能对比

| 渲染方式            | TTFB（首字节时间）                                             | LCP（最大内容绘制）                                                        | TBT（总阻塞时间）                                                |
| :------------------ | :------------------------------------------------------------- | :------------------------------------------------------------------------- | :--------------------------------------------------------------- |
| 客户端渲染（CSR）   | 较快                                                           | 较慢                                                                       | 较高                                                             |
|                     | 初始请求返回的 HTML 非常小，通常只包含基本结构和 JS 入口文件。 | 因为所有内容都由客户端渲染，用户需要等待 JS 加载和执行后才能看到主要内容。 | 客户端渲染时，JS 执行可能会阻塞主线程，导致较高的 TBT。          |
| 服务端渲染（SSR）   | 较慢                                                           | 较快                                                                       | 较低                                                             |
|                     | 服务器需要时间渲染 HTML，导致 TTFB 高于 CSR。                  | 页面在服务器端预渲染，用户在收到初始 HTML 时即可看到主要内容。             | 服务器端渲染减少了客户端 JS 的执行量，从而降低主线程的阻塞时间。 |
| 静态站点生成（SSG） | 非常快                                                         | 非常快                                                                     | 较低                                                             |
|                     | 静态文件可以立即返回，TTFB 非常小。                            | 页面在构建时已经静态生成，服务器只需提供预生成的 HTML。                    | 静态 HTML 文件减少了客户端 JS 的执行需求，从而降低 TBT。         |
| 增量静态再生（ISR） | 非常快                                                         | 非常快                                                                     | 较低                                                             |
|                     | 同 SSG。                                                       | 同 SSG。                                                                   | 同 SSG。                                                         |

**首字节时间 TTFB：** 从客户端发出请求到接收到服务器响应的第一个字节的时间。

**首次内容绘制 FCP：** 从客户端发出请求到页面上第一个内容（如文本、图片或其他 DOM 元素）被绘制到屏幕上的时间。

**最大内容绘制 LCP：** 从客户端发出请求到页面上最大可见内容（如大图、主要文本块或视频）被完全绘制到屏幕上的时间。

**总阻塞时间 TBT：** 从 FCP 到页面完全可交互的时间段中，主线程被长时间占用的总时间。这通常指的是执行 JS 时阻塞主线程的时间。

在 [Chrome 的 Web 性能指标](https://web.dev/explore/metrics?hl=zh-cn)中 LCP 被用于表示首屏时间，TBT 用于表示可交互时间。

[为什么使用 TBT 表示可交互时间比 TTI（可交互时间）更好？](https://web.dev/articles/tbt?hl=zh-cn#how_does_tbt_relate_to_tti)
