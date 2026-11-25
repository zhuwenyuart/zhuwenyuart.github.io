# 朱文语艺术作品网站

直接发布静态 HTML、CSS、JavaScript、JSON 和图片。**没有 Eleventy、模板编译或自定义 Actions 构建流程。** Pages CMS 直接修改 `main` 分支的站点文件，GitHub Pages 从 `/docs` 自动发布。

## 日常使用：只操作 CMS

1. 打开 [Pages CMS](https://app.pagescms.org)，选择原仓库及 `main` 分支。
2. 在“作品管理”新增、编辑或移除作品项。
3. 上传／选择图片，填写资料并保存。
4. 等待 GitHub Pages 发布完成，刷新正式网站。

无需开发机同步、编译 HTML、提交构建产物或手动点 Deploy。上传图片后仍需保存作品记录；只上传文件不会自动出现在列表中。

**自动发布不等于零延迟。** GitHub Pages 仍有内部分支发布和缓存更新过程；你可能在 Actions 面板看到系统生成的 `pages build and deployment`，但仓库不再维护工作流 YAML，也不在 GitHub 运行 Node、测试或模板编译。

## 一次性切换（仓库管理员）

这次 PR 合并后，在原仓库：

```text
Settings → Pages → Build and deployment
Source: Deploy from a branch
Branch: main
Folder: /docs
Save
```

**先合并，再切换**：旧 main 的 docs 是开发说明，不能在新站点目录合并前选它。保留现有自定义域名与 DNS。删除自定义工作流不会自动改变平台发布设置，未切换时旧线上版本可能继续显示。

Pages CMS 需要重新加载仓库配置，确认图片库指向 `docs/media/artworks`、作品目录指向 `docs/artwork.json`。不要继续在旧编辑会话中向已废弃的 `content/`、`public/` 路径保存。

详细切换、删除与回退见 [notes/deployment.md](notes/deployment.md)。

## 唯一维护目录

```text
docs/                             GitHub Pages 直接发布的站点
  index.html                      首页
  about/index.html                关于页
  portfolios/index.html           作品页
  contact/index.html              联系页
  single_portfolio/index.html     暂保留旧详情网址
  artwork.json                    CMS 唯一作品数据源
  media/
    artworks/                     CMS 唯一图片库
    site/                         网站配图，手工维护
    brand/                        Logo、图标，手工维护
  assets/css/                     公共／页面样式
  assets/js/portfolio/
    artwork-data.js               浏览器数据与路径检查
    gallery.js                    读取 JSON、筛选、弹窗
  portfolios/                     原布局依赖与自定义 CSS
  wp-content/、wp-includes/        原第三方前端资源
  .nojekyll                       不再通过 Jekyll 处理站点
  CNAME                           自定义域名
.pages.yml                        只管理作品，不开放其他内容
scripts/                          可选的本地预览与内容检查
notes/                            开发说明，不随站点发布
tests/                            少量数据规则与交互测试
image_origin/                     原图留在仓库，不属于 /docs 站点
```

`docs/` 里的 HTML 就是实际网站，不是生成物。修改页面、导航或页脚时直接编辑相应 HTML；公共 CSS 和 JS 仍是独立文件。去掉模板后，导航／页脚的重复 HTML 不再由工具自动同步，修改公共标记时需检查各页。

作品资料与图片没有副本源；不要编辑或重新建立 `src/`、`public/`、`content/`、`dist/`。图片对外地址仍为 `/media/...`，不会多出 `/docs` 前缀。原有作品（含“实习生”）及图片保留。

## 上传与删除

CMS 配置只暴露：

- 内容：`docs/artwork.json`，顶层数组和现有字段。
- 图片：`docs/media/artworks/`，JPEG／PNG／WebP，新上传使用唯一文件名。

非作品图片与作品一样存 GitHub，但 `docs/media/site/`、`brand/` 没有 CMS 入口。

删除整件作品时，先移除对应列表项并保存；不要删除整个作品文件。若要清理图片，确认没有主图或细节图引用后再删媒体文件。删除列表项不自动删除图片。所有 docs 文件均公开，Git 历史中的删除也不是隐私清除。

当前弹窗仍不展示 `des` 和 `detail`；它们作为资料保留。原先只存在于原图库、未放入站点的 12 张细节图已按原路径补齐，字节未改，CMS 媒体库可以读取这些文件。

## 本地查看（可选）

不需要安装依赖即可预览，只需 Node：

```bash
npm run dev
```

默认 `http://127.0.0.1:8001/`，直接读取 docs，刷新就能看到本机文件变化，不构建。跨机器可在自己的电脑转发：

```bash
ssh -N -o ExitOnForwardFailure=yes -L 127.0.0.1:18001:127.0.0.1:8001 你的SSH主机
```

然后打开 `http://127.0.0.1:18001/`。本地预览不会自动拉取 GitHub；CMS 保存之后，本机想看新内容仍需同步 Git，但正式站不依赖本机。

## 可选检查，不作为 CMS 发布必经步骤

```bash
npm ci
npm test                 # 少量数据／路径安全规则
npm run test:browser     # 核心桌面／手机操作
npm run check            # 本地内容图片检查 + 上述测试；不写文件
```

首次浏览测试需 `npx playwright install chromium`。测试不锁作品数量、文案、分类、排序、图片哈希或页面像素，普通内容更新无需改测试。

**移除构建流水线后的取舍：**本地完整图片检查不再自动拦截 CMS 提交。CMS 有必填、格式和年份提示，浏览器保留安全文本／路径验证，但错误数据仍可能直接发布。建议上传前确认格式、大小和图片本身可用；本地可选检查维持 5 MiB、2400 万像素、单边 8000 像素规则，但不宣称它在网页上传时强制执行。

原图不在 docs 中发布，但公开仓库中的 `image_origin/` 仍不是私有备份。此次不移动、不删除或重写原图历史。
