# 辽宁穷胡麻将

基于 [電脳麻将](https://github.com/kobalab/Majiang)（MIT）改造的 **辽宁穷胡** 网页对局应用。保留原有 HTML+CSS 牌桌 UI（非 Three.js），内嵌本仓库 vendored 的规则引擎与 AI。

## 快速开始

```bash
npm install
npm start
```

浏览器打开提示的地址（默认 `http://127.0.0.1:8080/`），点击「开始对局」。  
你将与 3 个 AI 对弈；桌面下方「出牌建议」面板可开关。

| 命令 | 说明 |
|:-----|:-----|
| `npm start` | 构建并启动本地静态服务 |
| `npm run build` | 仅构建 HTML / CSS / JS |
| `npm run serve` | 已构建时只启动服务 |
| `npm test` | 运行辽宁穷胡规则单测 |
| `npm run test:all` | 运行 majiang-core 全部测试 |

## 规则摘要（本叉强制）

1. **缺幺断九不能胡**  
   和牌时手牌/副露中须有至少一张 1 或 9；任意风牌（东南西北）或箭牌（中发白）可替代该幺九要求。

2. **夹胡翻一番**  
   坎张，或边张（12→3 / 89→7）和牌时分数 ×2。单钓亦计夹胡（便于与飘胡叠加）。  
   **吃不妨碍夹胡。**

3. **飘胡**  
   全刻/杠 + 一对（对对胡）再 ×2；与夹胡可叠乘（例如飘胡单钓 → ×4）。

### 可选开关（默认关闭）

在「规则设置」页可打开：

- **三门齐** — 须有万、筒、条
- **必须开门** — 须有副露
- **有刻子** — 须有刻/杠

和牌结算弹窗会列出「穷胡 / 夹胡 / 飘胡 / 自摸」等明细与番数。

## 功能

- 四人：人类 + 3 AI（`majiang-ai` 思考，按辽宁计分/听牌约束）
- 每巡建议：推荐打牌与理由、向听数、有效牌及剩余张数、打出末张幺九/字牌警告、吃碰杠提示、末巡防守提示
- 提示开关（localStorage 记忆）
- 牌面使用電脳麻将原有 GIF：**繁体万/发/东**，**白板为空心方框**（非「白」字）

## 与上游关系

| 组件 | 来源 |
|:-----|:-----|
| UI / 牌桌 | 本仓库（fork of [kobalab/Majiang](https://github.com/kobalab/Majiang)） |
| 规则引擎 | `packages/majiang-core`（vendored from [lwllvyb/majiang-core](https://github.com/lwllvyb/majiang-core)，含辽宁扩展） |
| AI | `packages/majiang-ai`（vendored from [lwllvyb/majiang-ai](https://github.com/lwllvyb/majiang-ai)，含 `Advisor` 建议模块） |
| majiang-ui | npm `@kobalab/majiang-ui`（未改） |

`package.json` 通过 `file:packages/…` 引用本地包，一次 `npm install` 即可运行完整应用。

上游为日本麻将规则；本叉默认 `规则类型: 辽宁穷胡`。可选切回日本麻将（规则页）。

## 许可证

[MIT](LICENSE) — 继承電脳麻将及子包许可。
