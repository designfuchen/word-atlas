# 词光词表改进可行性分析

> 配套文档：`AUDIT-REPORT.md`
> 日期：2026-11-23
> 目标：把审计发现的问题拆成可执行、可分期的改进项，并给出投入、影响面、风险与验收标准

---

## 摘要

审计发现的 6 类问题，可以收敛成 4 个方案包：

| 方案 | 内容 | 规模 | 预估投入 | 收益 | 风险 |
| --- | --- | --- | --- | --- | --- |
| **A 规范清理** | 词头纠错、拼写策略、屈折合并、连字符 | 约 120 条词目 | 2 人日 | 消除内部矛盾，提升专业观感 | 低 |
| **B 元数据补全** | `freq_rank` / `source` / `proper` / `variant`，`cefr` 改名 | 全库 | 2–3 人日 | 让每条词「可解释」，为后续校准打底 | 中（schema 变更） |
| **C 内容补齐** | 46 个 AWL 词族 + 16 个高频实义词 | 62 条新词 | 3–5 人日 | 补上雅思学术骨架，直接提升产品价值 | 中（需重建 forge 输入） |
| **D 义项级 CEFR** | 等级从词级下沉到义项级 | 13,734 个义项 | 8–15 人日 | 从根上解决「按词分级」的定义问题 | 高（架构级） |

**建议顺序：A → C → B → D。**
A 是清障，C 是收益最高的一步（62 条词换一个完整学术骨架），B 是 C 的副产品（补词时顺手加字段），D 单独立项。

如果只做一件事：**补那 46 个 AWL 词族**。投入最小、对目标用户（雅思 5.5–7.5）回报最直接。

---

## 1. 问题清单与优先级

| ID | 问题 | 证据 | 影响 | 严重度 | 修复成本 |
| --- | --- | --- | --- | --- | --- |
| P1 | 缺 46 个 AWL 词族 | `headword-audit.csv` 中 `awl` 为空且 `awl_family` 有值 | 学术写作词汇缺口 | 高 | 低 |
| P2 | 缺 16 个高频实义词 | COCA 前 1,000 缺口：go/work/check/happy/deep… | 基础词缺失，学习者会困惑 | 高 | 低 |
| P3 | 拼写策略不统一 | 12 组双收、8 组只收英式、0 组只收美式 | 词表内部矛盾 | 中 | 低 |
| P4 | 4 处词头错误 | `TRUE`/`FALSE`、`Mister`、`cheque/check`、缺 March/May | 明显的数据瑕疵 | 中 | 低 |
| P5 | 5 组屈折形与原形并存 | chip+chips、child+children… | 词元化不彻底 | 中 | 低 |
| P6 | 72 个过时连字符 | `dining-room`、`tape-recorder` | 观感陈旧，检索命中差 | 低 | 低 |
| P7 | 无来源/词频元数据 | 全部 7,298 条 | 无法解释「为什么收这个词」 | 高 | 中 |
| P8 | `cefr` 字段名暗示官方分级 | `docs/dataset.md` 写「估计难度」 | 用户误解 | 中 | 低 |
| P9 | 98 个专有名词未标记 | 星期/月份/地名/国籍 | 分级失真 | 中 | 低 |
| P10 | 词级标签承载义项级分级 | 29.0% 义项命中率 | 定义层面的根本问题 | 高 | 高 |

优先级排序：**P1 > P2 > P3 ≈ P4 > P7 > P9 > P5 ≈ P6 > P8 > P10**（P10 成本最高，单独排期）。

---

## 2. 方案 A：规范清理（低风险，约 2 人日）

### A1. 词头纠错（4 处 + 2 个补词）

| 现状 | 问题 | 改法 | 影响 |
| --- | --- | --- | --- |
| `TRUE` / `FALSE` | 全大写，疑似表格转换残留 | `w` 改为 `true` / `false` | `id` 已是 `true`/`false`，媒体文件名不变，零迁移 |
| `Mister` | 词典词头应为 `Mr` 或 `mister` | `w` 改为 `mister`，释义保留「先生」 | `id` 需从 `mister` 保持不变 |
| `cheque/check` | 一个词头承载两种拼写与两个义项体系 | 拆成 `cheque`（英式，支票）与 `check`（通用，检查/核对/支票） | 新增 1 条，`id` 从 `cheque-check` 改为 `cheque` + `check`，需迁移媒体 |
| 缺 March / May | 12 个月份缺 2 | 补 `March`（三月）、`May`（五月）；`may` 情态动词另立或合并为多义项 | 新增 1–2 条 |

> 注意：`march` 词条已有「齐步行进/游行/进行曲」3 个义项，容量已满。补 `March` 需新增独立词条（名词，月份），或把「三月」并入现有 `march` 并接受大小写混用。**建议新增独立词条 `March`**，因为月份与动词的语用场景完全不同。

### A2. 拼写策略：三选一

| 方案 | 做法 | 影响 | 优点 | 缺点 |
| --- | --- | --- | --- | --- |
| **英式优先（推荐）** | 保留 8 个英式-only；12 组双收中删掉美式条目，但在 `variant` 字段记 `color` | 删 12 条，新增 8 个 `variant` 值 | 与「英式 IPA」定位一致，词表更干净 | 美式用户搜 `color` 需靠 variant 兜底 |
| 双收标注 | 保留全部 20 组，增加 `variant` 字段区分主/次 | 0 删除，20 条加字段 | 不改内容 | 30 个词位承载 20 个概念，密度低 |
| 美式优先 | 删 8 个英式-only，保留美式 | 删 8 条 | 与多数学习者语料一致 | 与现有英式 IPA、`colour` 等已发布内容冲突 |

**推荐英式优先 + `variant` 兜底**：删除 12 条美式重复项（`favorite`、`organize`、`gray`、`program`、`license`、`practice`、`analyze`、`realize`、`behavior`、`catalog`、`jewelry`、`airplane`），在保留的英式词条上加 `variant` 字段（如 `colour` 的 `variant: ["color"]`），搜索层做同义展开。

> **不建议**动那 15 组「不同词」的英美用词（film/movie、flat/apartment 等）——它们是真实的词汇差异，不是拼写变体，且对学习者有价值。

### A3. 屈折形合并

| 保留 | 合并掉 | 处理 |
| --- | --- | --- |
| chip | chips | 删 `chips`，在 `chip` 的 `senses` 中补「薯条（英）」义项 |
| child | children | 删 `children` |
| foot | feet | 删 `feet` |
| woman | women | 删 `women` |
| person | people | 删 `people`（注意 `people` 另有「民族」义，需并入 `person` 或保留独立条目——建议保留 `people` 并注明是 `person` 的复数兼独立义项） |

删除 5 条会改变词表总数（7,298 → 7,293），需同步更新 README、`index.count`、公开下载 CSV、以及任何硬编码 7,298 的地方（README 中出现 10 处）。

> 替代方案：不删，改为在 `note` 字段标注「`chips` 是 `chip` 的复数，另见 `chip`」。成本更低，但词元化仍不彻底。

### A4. 连字符现代化

72 个连字符条目中，建议改写的**过时写法**（约 12 条）：

| 现状 | 建议 | 依据 |
| --- | --- | --- |
| `dining-room` | `dining room` | 现代词典均分写 |
| `tape-recorder` / `tape-recording` | `tape recorder` / `tape recording` | 同上 |
| `mid-day` | `midday` | 同上 |
| `note-taking` | `note taking` | 同上 |
| `bread-earner` | `breadwinner` | 词形本身过时 |
| `epoch-making` | 删除或改 `epoch-making` 标注为「书面/过时」 | 现代英语极少用 |
| `short-weight` | 删除 | 非通用词 |
| `above-mentioned` | `above-mentioned`（保留，但标注书面） | 仍在使用 |
| `bottom-line` | `bottom line` | 名词分写 |
| `counter-offer` | `counteroffer` | 词典多作合写 |
| `best-selling` / `best-seller` | 保留 | 连字符是标准写法 |
| `so-called` / `self-service` / `part-time` | 保留 | 标准写法 |

改写 `w` 不影响 `id`（id 是 slug），但会影响搜索匹配，需要在搜索层做连字符/空格归一（现有代码若已做则无影响）。

### A5. 验收

```bash
node scripts/check-atlas.mjs          # 结构校验通过
node -e "…"                          # 自建断言：0 条 case-error、0 条 merged-headword、0 组 us-variant 重复
```

---

## 3. 方案 B：元数据补全（中风险，2–3 人日）

### B1. 新增字段

| 字段 | 类型 | 取值 | 用途 |
| --- | --- | --- | --- |
| `freq_rank` | number \| null | 1–50000，榜外为 null | 「为什么收这个词」的第一依据 |
| `source` | string[] | `ngsl` / `awl` / `coca2000` / `cefr-evp` / `topic` / `manual` | 选词来源，可多选 |
| `proper` | boolean | 98 条为 true | 把专有名词从分级统计中剥离 |
| `variant` | string[] | 如 `["color"]` | 拼写变体检索兜底 |
| `cefr_estimate` | string | 由 `cefr` 改名 | 消除「官方分级」的暗示 |

这些值**已经全部算好**，在 `headword-audit.csv` 里：`ngsl`、`coca_rank`、`awl`、`nawl`、`evp_levels`、`freq_rank`、`flags`。合并只需一次脚本。

### B2. 工程影响面

| 位置 | 改动 | 工作量 |
| --- | --- | --- |
| `data/word-atlas.json` / `.csv` | 加 4 个字段、`cefr` 改名 | 脚本一次生成 |
| `scripts/atlas/build_atlas.py` | 索引行增加字段（或保持索引不变，只在 entries 里加） | 0.5 人日 |
| `public/atlas/index.json` | **建议不改**紧凑索引，避免破坏前端与 Android | 0 |
| `public/atlas/entries/<n>.json` | 加字段 | 0（随 build 生成） |
| `scripts/check-atlas.mjs` | 新字段校验（类型、枚举、范围） | 0.5 人日 |
| `src/` 前端类型 | `Word` 接口加可选字段 | 0.5 人日 |
| `android/` | 若前端共用同一份 JSON，无需改动 | 0 |
| `docs/dataset.md` | 字段表更新 | 0.5 人日 |
| `README.md` | 「7,298 条，CEFR A1–C2」改为「CEFR 参考估计」 | 0.2 人日 |

### B3. 兼容策略

- **只增不改**：`index.json` 的紧凑行结构（`[id, word, zh, ipa, cefrIndex, topicIndex, media, more]`）保持不变，新字段只进 `entries/`。
- **`cefr` 改名要留兼容期**：先同时输出 `cefr` 与 `cefr_estimate`，前端切换后再删旧字段；否则旧版 Android 会读到空值。
- 公开 CSV 增加列不会破坏现有用户，但需在 README 注明版本变化。

### B4. 收益

补完之后，任何一条词都能回答三个问题：**这个词从哪来（source）、有多常用（freq_rank）、是不是专有名词（proper）**。这是「权威性」最便宜的一次提升——不改内容，只补证据。

---

## 4. 方案 C：内容补齐（中成本，3–5 人日）

### C1. 待补清单

**AWL 46 族**（按子表，建议全部补主词头，派生词按需）：

```
S1  legislate
S2  aspect, equate, perceive, potential
S3  emphasis, scheme
S4  contrast, ethnic, internal, output, parallel, subsequent
S5  enable, notion, revenue, whereas
S6  acknowledge, federal, incorporate, index, rational
S7  foundation, paradigm, phenomenon
S8  commodity, complement, infrastructure, minimise, widespread
S9  anticipate, duration, ethic, passive, preliminary, protocol, qualitative, rigid, scenario, supplement, trigger
S10 albeit, invoke, levy, nonetheless, pose
```

**高频实义词 16 个**：

```
动词  go, work, thank, check, reveal
形容词 federal, likely, past, happy, entire, religious, deep
名词   part, page, song, trial, center
```

其中 `work` 兼动词/名词，`center` 与现有 `centre` 构成英美变体（按 A2 的策略处理：补 `center` 为 `variant`，不新增词条）。

去重后实际新增约 **62 条**（`center` 作 `variant` 处理不新增；`work` 兼动词与名词，计 1 条；`defense`/`color` 按 §A2 的拼写策略处理）。

### C2. 生产链路与阻塞点

现有链路：

```
.local/forge/headwords.json
   → gen_text.py（LLM 生成 1-3 义项 + 双例句 + 搭配 + 家族 + 近反义 + 词源提示）
   → gen_images.py（每词 1 张插画，512/256 px）
   → gen_word_audio.py（英/美双音）+ gen_sentence_audio.py（例句朗读）
   → build_atlas.py（合并成语料、切块、生成索引、同步 CSV）
   → check-atlas.mjs（校验）
```

**阻塞点：`.local/forge/headwords.json` 不在仓库内**（`.local/` 被 `.gitignore` 排除，本机也不存在该文件）。
补词前必须先重建这个输入——它至少需要 `{hid, word, raw[]}` 三个字段（`raw` 是给 LLM 的原始提示）。

重建方式有二：
1. 从现有 `data/word-atlas.json` 反推 7,298 条的 `headwords.json`（`raw` 可用现有释义拼装），再追加新词；
2. 直接手写 56 条新词的 `headwords.json`，以 `--start` 追加生成。

**推荐第 2 种**：只补新词，不重跑全库，避免已有内容被 LLM 重写导致 diff 爆炸。

### C3. 成本估算

| 项目 | 数量 | 说明 |
| --- | ---: | --- |
| 新词条 | 62 | 每条 1–3 义项、2 例句、2–4 搭配 |
| LLM 生成 | 3 批 × 20 词 | 现有脚本默认 20 词/批、8 并发 |
| 人工校对 | 62 条 | 每条 5–10 分钟（重点核 IPA、词性、中文释义、例句是否含词头） |
| 插画 | 62 张 | 自动生成，需抽检是否切题 |
| 音频 | 62 × 4 | 英音、美音、例句 1、例句 2 |
| 媒体增量 | 约 1.6MB 图 + 6.4MB 音频 | 按现有均值 28KB/图、111KB/词 |

**人工校对是瓶颈**，不是生成。建议按 10 条/批校对，避免疲劳导致漏检。

### C4. 质量风险

| 风险 | 表现 | 缓解 |
| --- | --- | --- |
| LLM 把 `aspect` 写成「方面」但漏了「外观/朝向」 | 义项不全 | 对照 EVP guideword 与本报告附录 |
| `legislate` 与 `legislation` 混淆 | 词性错 | 校对时核对词性 |
| `albeit` / `nonetheless` 的中文释义过于口语 | 语域不符 | 统一用书面语释义 |
| 新词等级标错 | 加剧已有偏移 | 用 min 口径的 EVP 值作锚，再按词光既有偏移量调整 |

---

## 5. 方案 D：义项级 CEFR（高成本，8–15 人日）

### D1. 为什么这件事不能靠「改几个数字」解决

CEFR 的分级单位是义项。词光的单位是词。只要单位不换，任何单词级标签都必然丢失信息——
审计里 29.0% 的义项命中率、44.3% 的词一个义项都对不上，都是这个结构决定的，不是标注失误。

### D2. 三阶段迁移

**阶段 1：加字段，不改 UI（2–3 人日）**

在 `senses[]` 上增加可选字段：

```json
{
  "pos": "n.",
  "zh": "熊",
  "en": "A large wild animal with thick fur.",
  "cefr": "A2",
  "guideword": "ANIMAL",
  "evp_ref": "bear"
}
```

同时保留词级 `cefr` 作为「入门义项等级」的派生值，保证旧 UI 不变。

**阶段 2：义项对齐（5–8 人日）**

13,734 个义项需要对齐到 EVP 的 14,586 条记录。建议分三档处理：

| 档位 | 方法 | 覆盖预估 | 人工量 |
| --- | --- | --- | --- |
| 高置信 | 词头相同 + 词性相同 + 中文释义与 EVP guideword 语义匹配（LLM 判定，阈值高） | 约 30–40% | 抽检 10% |
| 中置信 | 词头相同 + 词性相同，多义项按顺序对位 | 约 30% | 抽检 30% |
| 低置信 | 短语词头、词性不符、EVP 无对应 | 约 30% | 人工逐条或标 `null` |

**关键：允许 `cefr: null`。** 30% 的词在 EVP 里根本没有对应义项（C1/C2 段尤甚），强行给值只会复制现有问题。

**阶段 3：UI 呈现（2–3 人日）**

- 词卡：主义项显示等级；其他义项折叠显示各自等级。
- 列表/搜索：按词级 `min` 排序（保持现有体验），但详情页展示区间（如 `A2–C2`）。
- 分级筛选：新增「按义项等级筛选」，与现有「按词等级筛选」并存。

### D3. 可行性判断

**技术上完全可行，成本主要在语义对齐的人工抽检。**
但要注意：词光的义项是中文释义，EVP 的是英文 guideword + 英文释义，跨语言对齐的准确率取决于 LLM 判定质量。
建议先在 200 个高频多义词上做试点，验证对齐准确率 ≥85% 再全量推进。

### D4. 不建议的做法

- **不要**直接把 EVP 的 min 值批量覆盖现有 `cefr`。词光的等级是教学排序（易→难、同级别打散话题），EVP 的是习得顺序，两者目标不同；直接覆盖会破坏现有学习路线的节奏。
- **不要**为了对齐 CEFR 删除 C1/C2 中「EVP 没有」的词。那 1,459 个词是产品差异点，不是错误——需要的是标记，不是删除。

---

## 6. 影响面矩阵

| 改动 | 数据文件 | build 脚本 | 校验脚本 | 前端 | Android | 公开 CSV | 文档 |
| --- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| A1 词头纠错 | ● | ○ | ○ | ○ | ○ | ● | ○ |
| A2 拼写策略 | ● | ● | ● | ○ | ○ | ● | ● |
| A3 屈折合并 | ● | ● | ● | ○ | ○ | ● | ● |
| A4 连字符 | ● | ○ | ○ | ○ | ○ | ● | ○ |
| B1 新字段 | ● | ● | ● | ● | ○ | ● | ● |
| B2 cefr 改名 | ● | ● | ● | ● | ● | ● | ● |
| C 补词 | ● | ○ | ○ | ○ | ○ | ● | ● |
| D 义项级 | ● | ● | ● | ● | ● | ● | ● |

● 需要改　○ 通常不需要

**Android 是隐性成本**：`vite.config.android.ts` 打包的是同一份 `public/atlas`，若新增字段进入 `index.json` 的紧凑行，会同时影响网页与 APK。
本报告建议**不动 `index.json` 行结构**，把新字段只放进 `entries/`，可把 Android 影响降为零。

---

## 7. 排期建议

### 档位一：最小可用（约 3 人日）

只做 P1 + P2 + P4：

1. 补 46 个 AWL 词族 + 16 个高频实义词（约 62 条）。
2. 修 `TRUE`/`FALSE`、`Mister`、`cheque/check`、补 March/May。
3. 跑一遍 `check-atlas`。

产出：学术骨架补齐，明显瑕疵清零。**不碰 schema，不动前端。**

### 档位二：标准（约 8–10 人日）

在档位一基础上加 A2、A3、A4、B1：

4. 拼写策略统一（删 12 条美式重复 + `variant` 字段）。
5. 屈折形合并（5 条）。
6. 连字符现代化（约 12 条）。
7. 补 `freq_rank` / `source` / `proper` / `variant`，`cefr` 改名 `cefr_estimate`。
8. 更新文档与 README 的「7,298」硬编码。

产出：词表内部自洽，每条词可解释。这是「从自建词表到可引用词表」的关键一步。

### 档位三：完整（20–25 人日）

再加 D（义项级 CEFR），分三阶段推进，先做 200 词试点。

> 时间估算基于：1 名熟悉该仓库的开发者 + 现有脚本可直接复用 + 无外部依赖阻塞。
> 若需重新搭建 forge 环境（LLM 网关、图片模型、ElevenLabs 密钥），额外加 1–2 人日。

---

## 8. 验收标准

### 8.1 规范类（可自动断言）

| 断言 | 期望 |
| --- | --- |
| `node scripts/check-atlas.mjs` | 0 error |
| `flags` 含 `case-error` | 0 条 |
| `flags` 含 `merged-headword` | 0 条 |
| `flags` 含 `inflected` | 0 条 |
| 同一词的美/英拼写重复（`us-variant`） | 0 组 |
| `proper = true` 且参与等级统计 | 0 条 |
| `March` / `May` 存在 | 是 |

### 8.2 覆盖类（用 `headword-audit.csv` 复算）

| 指标 | 现状 | 目标 |
| --- | ---: | ---: |
| AWL 570 族覆盖 | 91.9% | **100%** |
| COCA 前 1,000 实义动词 | 5 缺 | 0 缺 |
| COCA 前 1,000 形容词 | 7 缺 | 0 缺 |
| COCA 前 1,000 实义名词 | 4 缺（part/page/song/trial） | 0 缺 |
| NGSL 内容词 | 92.4% | ≥95% |

### 8.3 分级类

| 指标 | 现状 | 目标（档位二） | 目标（档位三） |
| --- | ---: | ---: | ---: |
| 与 EVP `min` 完全一致 | 54.2% | 57–58%（一阶校准后） | ≥70%（义项级对齐后） |
| 义项命中率 | 29.0% | 29.0%（不变） | ≥60% |
| 无义项在所的等级上的词 | 44.3% | 44.3%（不变） | ≤20% |

> 档位二只改词级标签，命中率不会显著变化；真正的跃升要靠档位三。

---

## 9. 风险登记

| 风险 | 概率 | 影响 | 缓解 |
| --- | --- | --- | --- |
| 删美式重复条目导致部分用户搜不到 | 中 | 中 | `variant` 字段 + 搜索层同义展开；先在测试环境验证 |
| 删 5 条屈折形导致词表总数变化，破坏硬编码 | 高 | 低 | 全局搜索 `7298` / `7,298`，改为读 `index.count` |
| LLM 新生成内容与既有风格不一致 | 中 | 中 | 复用现有 `SYSTEM` 提示词；按 10 条/批人工校对 |
| `cefr` 改名破坏旧版 APK | 中 | 高 | 双字段过渡期 ≥1 个版本 |
| 义项级对齐准确率不足 | 中 | 高 | 200 词试点，准确率 <85% 则暂停 |
| 媒体重命名遗漏 | 低 | 中 | `check-atlas.mjs` 已校验媒体存在性 |

---

## 10. 不建议做的事

1. **不要为了「对齐 CEFR」删掉 C1/C2 中 EVP 没有的词。** 1,459 个「EVP 之外」的词是产品的差异化资产，需要的是 `source` 标记，不是删除。
2. **不要批量把 `cefr` 覆盖成 EVP 的 min 值。** 词光的等级是教学排序，EVP 的是习得顺序；直接覆盖会打乱现有由易到难的学习路线。
3. **不要为了追求「纯英式」删掉 film/movie、flat/apartment 这类不同词。** 它们不是拼写变体，删了是内容损失。
4. **不要在没有人工校对的情况下直接发布新增内容。** 现有内容的错误率已经未知，再叠加 62 条未校对内容，等于把技术债翻倍。

---

## 附录 A：待补 AWL 词族（46）

| 子表 | 词族 |
| --- | --- |
| S1 | legislate |
| S2 | aspect, equate, perceive, potential |
| S3 | emphasis, scheme |
| S4 | contrast, ethnic, internal, output, parallel, subsequent |
| S5 | enable, notion, revenue, whereas |
| S6 | acknowledge, federal, incorporate, index, rational |
| S7 | foundation, paradigm, phenomenon |
| S8 | commodity, complement, infrastructure, minimise, widespread |
| S9 | anticipate, duration, ethic, passive, preliminary, protocol, qualitative, rigid, scenario, supplement, trigger |
| S10 | albeit, invoke, levy, nonetheless, pose |

## 附录 B：待补高频实义词（16）

| 词 | COCA | 词性 | 建议等级锚（EVP min） |
| --- | ---: | --- | --- |
| go | 35 | v. | A1 |
| work | 117 / 199 | v. / n. | A1 |
| thank | 498 | v. | A1（`thank you`）/ A2（动词） |
| check | 857 | v. / n. | A2 |
| reveal | 930 | v. | B2 |
| federal | 494 | adj. | —（EVP 未收，建议 B2） |
| likely | 625 | adj. | B1 |
| past | 681 | adj. / n. / prep. | A1（介词义） |
| happy | 748 | adj. | A1 |
| entire | 871 | adj. | B2 |
| religious | 887 | adj. | B2 |
| deep | 978 | adj. / adv. | A2 |
| part | 178 | n. | A1（PIECE） |
| page | 709 | n. | A1（PAPER） |
| song | 854 | n. | A2 |
| trial | 901 | n. | B2（IN COURT） |

> 等级锚取自 EVP 对应义项；EVP 未收的词（federal）按词频与同义词语域推定，并在 `source` 标注 `manual`。

## 附录 C：待改词条清单

**词头错误（4）**：`TRUE`、`FALSE`、`Mister`、`cheque/check`

**拼写重复（12，建议删美式）**：`favorite`、`organize`、`gray`、`program`、`license`、`practice`、`analyze`、`realize`、`behavior`、`catalog`、`jewelry`、`airplane`

**屈折重复（5）**：`chips`、`children`、`feet`、`women`、`people`

**过时连字符（约 12，建议改写）**：`dining-room`、`tape-recorder`、`tape-recording`、`mid-day`、`note-taking`、`bread-earner`、`epoch-making`、`short-weight`、`bottom-line`、`counter-offer`、`above-mentioned`、`short-term`（视语境）

**缺失（2–3）**：`March`、`May`（月份），`may`（情态动词）
