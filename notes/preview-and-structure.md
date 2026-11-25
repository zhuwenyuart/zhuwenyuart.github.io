# 直接静态站的预览与维护

## 运行预览

```bash
npm run dev
```

仅需 Node，不需要先安装测试依赖。预览直接读取 `docs/`，默认 `http://127.0.0.1:8001/`。没有构建、模板或热更新，保存静态文件后刷新浏览器即可。

在自己电脑转发远程端口：

```bash
ssh -N -o ExitOnForwardFailure=yes -L 127.0.0.1:18001:127.0.0.1:8001 你的SSH主机
```

保持连接后打开 `http://127.0.0.1:18001/`。VS Code Remote SSH 的 Ports 面板也可转发 `8001`，保持私有。开发预览不是生产服务器，不要直接开放公网。自动浏览测试用独立端口 `18765`。

CMS 在 GitHub 保存，开发机不自动同步。想在本机预览 CMS 新内容，应先确认本地修改已保存，再从 GitHub 同步；正式网站不依赖这个步骤。

## 目录边界

```text
docs/           实际静态站点，由 GitHub Pages main /docs 直接发布
  artwork.json  CMS 作品目录唯一来源
  media/        artworks（CMS）、site / brand（手工管理）
  assets/       CSS 与浏览 JavaScript
notes/          开发和发布说明，不进入站点
scripts/        可选预览与内容检查工具，不参与日常发布
tests/          少量规则和核心交互测试
image_origin/   原始图片资料，保持原样，不进入 /docs 站点
```

页面维护入口为 `docs/index.html`、`docs/about/index.html`、`docs/portfolios/index.html`、`docs/contact/index.html`。这些就是实际网页，不由另一个模板文件生成。

公共 CSS 和 JavaScript 仍是外部文件；导航与页脚 HTML 不再由模板共享，调整标记时需同步检查各页。作品列表本来就由浏览器读取 JSON，因此内容编辑不需要生成新的 HTML。

`.nojekyll`、`CNAME` 放在 docs 根目录；自定义域名下网址不带 docs 前缀，仍是 `/about/`、`/artwork.json`、`/media/...`。

## 必要检查

```bash
npm ci
npm test
npm run test:browser
npm run check
```

浏览测试首次需要 `npx playwright install chromium`。`check` 只校验，不改文件、不编译、不发布；包含可选的图片完整性检查、4 项数据规则和4 项核心浏览器冒烟测试，不维护历史 DOM／截图或固定作品数量。

日常 CMS 编辑无需运行这些开发命令，但也因此没有本地检查自动阻止错误内容上线。出现问题直接修正作品资料或文件。不要把“保存后自动发布”理解成同步刷新所有已打开网页或绕过 GitHub Pages 平台处理时间。

细节图片已从现有原图库补齐，共 12 张，主图和细节图路径检查均通过；原图库字节未改。CMS 可管理资料与文件，当前作品弹窗仍只展示主图和基本信息。

更多操作见 [CMS 与图片](cms-and-media.md)、[发布切换](deployment.md)。
