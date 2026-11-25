# 切换到 Pages 分支直接发布

## 目标

Pages CMS 直接保存实际站点的作品 JSON 和图片。没有模板、编译、本地成品提交步骤、自定义 CI 或部署工作流。保存到 main 后 GitHub Pages 自动发布 main 的 `/docs`，不需要用户再点击 Deploy。

不能承诺零延迟：GitHub 平台仍需处理提交和缓存，可能在 Actions 面板显示系统生成的 `pages build and deployment`。这不代表项目又引入了自定义 Actions 编译。

## 一次性切换顺序

需要原仓库管理员权限。当前代理账号没有该权限，不会擅自切换或合并。

1. 审阅并合并这次纯静态迁移 PR。先确认新 main 的 `docs/index.html`、`docs/artwork.json`、`docs/media/` 都存在。
2. 再在原仓库 `Settings → Pages → Build and deployment` 设置：
   - Source：**Deploy from a branch**。
   - Branch：**main**。
   - Folder：**/docs**。
   - Save。
3. 不更改现有自定义域名、DNS；`docs/CNAME` 保留原域名，`.nojekyll` 跳过 Jekyll 内容处理。
4. 等待平台的分支发布完成，打开正式站检查四页、作品图片、筛选、弹窗与新作品。
5. 在 Pages CMS 退出旧编辑会话，重新打开仓库／main，使它加载新 `.pages.yml`：内容文件为 `docs/artwork.json`，媒体库为 `docs/media/artworks`。
6. 用一个小的作品资料修改确认提交确实落在 docs，等发布更新后再继续使用。不要在旧界面重新创建已删除的 content/public 路径。

**顺序与之前模板迁移相反：这次先合并，再选 /docs。** 在本 PR 合并前，旧 main 的 docs 仍是开发说明，不是完整网站。切换过程中当前 workflow 模式可能暂时保留上一版网站，不应作零中断保证。

旧的 `ENABLE_PAGES_DEPLOY` 仓库变量不再被任何代码读取，可由维护者清理，也可以暂留。不要关闭整个仓库 Actions 产品；分支 Pages 自己仍用平台发布流程。

## 日常更新

```text
Pages CMS 上传／编辑 → 保存到 main 的 docs → GitHub Pages 分支发布 → 刷新网站
```

- 作品图与资料可能分成不同提交，上传图片后还要保存作品项。
- 没有本项目自己的 check/deploy 两个任务；无需等待或手动运行它们。
- 保存不是同步推送给所有已打开浏览器。平台发布完成后刷新网页；作品数据请求已设为 `cache: no-store` 来减少浏览器复用旧 JSON，但不能绕过平台发布／CDN 延迟。
- 如果打开的是本机 SSH 转发的预览，它读本机文件，不自动同步 CMS；日常查看新发布内容请用正式网站。
- Pages 或自定义域名有问题时，查看 Pages 设置和系统发布记录，不要重新建立 Eleventy 工作流。

## 风险与回退

删除编译门槛后，CMS 的正常保存不再触发本地图片解码和规则测试。浏览器仍校验数据路径、安全渲染文字，但无自动发布前门禁；错删被引用图片或提交无效 JSON 会影响站点，需要修正提交。

保留轻量的可选 `npm run check`，开发代码时运行即可。日常新增作品、换文案和排序不要求维护测试。

若需撤销一次内容编辑，恢复对应 Git 提交的记录／图片并保存 main，分支 Pages 会重新发布。若恢复到旧的模板架构，则必须连同 Pages Source 一起恢复，不能在 `/docs` 模式下发布不存在的模板产物。原始图片与 Git 历史不因部署方式改变而私密。

## 官方说明

[GitHub Pages 发布源配置](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) 支持任意指定分支的根目录或 `/docs`。本项目选择 `/docs`，避免把开发脚本、Node 依赖、测试、说明和原图一起发布。
