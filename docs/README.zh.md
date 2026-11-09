# 剧本工坊 · DSH 插件

[English](../README.md) | 中文

为 DeepSeek Harness 打造的剧本写作台：本地剧本库、US Letter 稿纸、自动保存，以及和你写在同一份稿子里的 Agent。

安装后在左侧边栏找到「剧本」。

## 安装

需要先装好 DeepSeek Harness。插件已发布到 npm，包名 **`dsh-screenwrite`**。

**用插件管理器（推荐）**：按 npm 包名安装：

```text
install_bundle   target: dsh-screenwrite
```

**手动安装**：把插件写进 `~/.dsh/profiles/<profile>/package.json`，然后安装依赖：

```json
{
  "dependencies": { "dsh-screenwrite": "^1.5.0" },
  "dsh": { "profile": { "bundles": ["…", "dsh-screenwrite"] } }
}
```

```bash
cd ~/.dsh/profiles/<profile> && pnpm install
```

重启 Harness，左侧边栏就会出现「剧本」。

**从源码目录安装**（改插件时用）：改用本地链接即可：

```json
"dependencies": { "dsh-screenwrite": "link:/absolute/path/to/dsh-screenwrite" }
```

无论哪种方式，`package.json` 的 `name`、`cordis.patch.yml` 的 `name`、`client.js` 顶部的 `id`、以及 bundles 列表里的名字都要写 `dsh-screenwrite`；文件夹叫什么名字不影响。

## 写作

- 五要素：场景、动作/事情、角色名、插入说明、对白。`⌥1`–`⌥5`（Windows 用 `Alt+1`–`Alt+5`）直接跳到某个要素，`Tab` 仍然循环切换，`Enter` 拆段，`⌘S` 保存。
- 鼠标移到格式按钮上，会在按钮正上方浮出它的快捷键提示。
- 左侧场景栏跟随正文滚动；点一下场景就能跳过去。
- 导出：PDF（浏览器内直接生成，不走打印）、Fountain、纯文本、独立 HTML。HTML 带封面页，双击就能当阅读稿看。
- 剧本是 `~/.dsh/screenwrite/scripts/` 下的 JSON 文件，全部留在本机；旧的 `~/.dsh/screenplay/` 剧本库会在第一次打开时自动搬过去。
- 第一次打开空剧本库时，会放入一个原创示例《Night Shift》（`samples/`），让稿纸上先有东西可看。

## 格式

类 Fountain，一份剧本一页，五要素：

```fountain
Title: Night Flight
Author: Lin Xia

INT. COFFEE - DAY
Morning light through the blinds.

LIN XIA
(low)
He's late again.

INT. OFFICE - NIGHT
SARAH (V.O.)
We should go.
```

场景标题中英文都可以（`内景 咖啡馆 - 日` 或 `INT. COFFEE - DAY`）。想强制指定类型，就在行首加 `.`（场景）、`@`（角色名）、`!`（动作）。

PDF 按写作稿排版：标题页只有片名和署名，正文左 1.5 英寸、其余 1 英寸，页码在右上角（正文第一页不编号，第二页起显示 `2.`）。

## Agent

插件注册了 `screenwrite` 工具：`list`、`read`、`create`、`write`、`append`、`rename`、`delete`。让 Agent 先读当前稿，再按场说明它改了什么——不要让它把整本剧本贴回聊天。

## 许可

MIT
