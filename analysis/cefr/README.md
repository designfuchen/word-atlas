# 词光 × CEFR（EVP）比对 / 词头权威性审计

2026-11-23 抓取 englishprofile.org 的 English Vocabulary Profile，与 `data/word-atlas.json` 的 7,298 个词头逐条比对；
随后用 NGSL、COCA 5,000、AWL、NAWL 四套外部基准审计这批词头的权威性与专业性。

## 文件

| 文件 | 内容 |
| --- | --- |
| `AUDIT-REPORT.md` | 完整审计报告（markdown，含方法、全部数据表、结论与评分） |
| `IMPROVEMENT-FEASIBILITY.md` | 改进可行性分析（方案 A–D、投入产出、影响面、验收标准） |
| `LEARNER-PATCH.md` | 面向学习者的补丁清单：词头 / CEFR 等级 / 义项，词表不更新时怎么自学 |
| `learner-patch.csv` | 2,210 条等级修正（`type=fix`）+ 1,502 条补充词（`type=add`） |
| `report.html` | 分级比对报告（第一份，可视化） |
| `report-authority.html` | 权威性 / 专业性审计报告（第二份，可视化） |
| `evp-bre-senses.csv` | EVP 英式全量义项：base_word / guideword / level / part_of_speech / topic（**不随仓库分发**，见「数据来源与授权」） |
| `evp-ame-senses.csv` | EVP 美式全量义项（同结构，**不随仓库分发**） |
| `atlas-vs-evp.csv` | 逐词分级比对结果，见下 |
| `headword-audit.csv` | 逐词权威性审计：ngsl / coca / awl / nawl / evp / freq_rank / flags |
| `refs/` | 外部基准原始文件（NGSL、COCA 5000、AWL.json、NAWL.json、en_50k.txt），**不随仓库分发** |
| `crawl-evp.cjs` | 抓列表页（Playwright） |
| `crawl-evp-details.cjs` | 抓详情页定义：refid 1–6969，一页一个词头，含每条义项的英文定义 |
| `evp-definitions.csv` | 列表 + 逐条定义（14,586 行，99.5% 有定义，**不随仓库分发**） |

`atlas-vs-evp.csv` 字段：

- `word` / `atlas_level` / `atlas_senses`：词光词头、等级、中文义项数
- `evp_senses` / `evp_levels`：该词在 EVP 的义项数、出现的等级集合
- `evp_min` / `evp_mode` / `evp_max`：三种词级归并（最易义项 / 义项最多的等级 / 最难义项）
- `delta_vs_min`：`atlas_level − evp_min`，正数表示词光标得更难
- `sense_share_at_atlas_level`：落在词光所标等级上的义项占比
- `match_type`：`exact` 词头直配 / `phrase` 短语词头 / `inflect` 词形还原 / `inside` 短语内嵌 / `miss` 未匹配
- `evp_senses_detail`：义项明细（`base [guideword] LEVEL`）

`headword-audit.csv` 字段：`word / level / topic / senses`，加上 `ngsl`（Y）与 `ngsl_rank`、`coca_rank`、
`awl` 与 `awl_family`、`nawl`、`evp_levels`、`evp_min`、`freq_rank`（OpenSubtitles 50k 排名），
`flags` 为空格分隔的标记：`proper` 专有名词、`multiword`、`hyphen`、`brE-only` 只收英式、`us-variant` 美式变体、
`inflected` 屈折形重复、`case-error` 大小写错误、`merged-headword` 合并词头、`rare-tail` 词频 > 3 万或不在榜。

`learner-patch.csv` 字段：`type`（`fix` 等级修正 / `add` 补充词）、`word`、`atlas_level`（词光等级）、
`atlas_first_sense`（词光首义，`senses[0]`）、`cefr_level`（入门义项等级）、`cefr_levels`（该词在 EVP 的等级区间）、
`delta`（入门级 − 词光等级）、`evp_guidewords`（入门等级下各条义项的标记，` | ` 分隔）、
`evp_pos`（与之对应的词性，` | ` 分隔）、`entry_count`（该等级的条数）、`freq_rank`、
`atlas_senses_zh`（词光全部义项）、`note`（`severe` 偏差 ≥2 级 / `minor` 1 级 / `missing` 词光未收）。

> 术语：**EVP 的一条记录就是一条义项**，由 释义 + 义项标记（guideword）+ 词性 + 等级 组成。
> 标记是给义项起的分类名（`FRIED FOOD`、`ANIMAL`），不是释义，也可以缺失。
> 「入门等级」= 该词在 EVP 的最低等级；「入门义项」= 该等级下的全部记录（全库 17.3% 的词不止一条）。
> 它与「词光首义」（`senses[0]`，词光自己的排列顺序）分属两个体系，表中分列。完整释义见 `evp-definitions.csv`。

## 关键数字

### 分级（vs EVP）

- EVP 英式 15,696 行 → 去重 14,586 条义项 → 9,751 个词头（6,547 单词 + 3,204 短语）
- 词光 7,298 词中 4,838（66.3%）可比；C1 段仅 26.1%、C2 段 1.5% 可比
- 与 EVP 最易义项：54.2% 完全一致，93.2% 在 ±1 级内；与最难义项：31.6% / 66.3%
- 29.0% 的 EVP 义项落在词光所标等级上；44.3% 的词一个义项都对不上
- 36.3% 的词在 EVP 跨 ≥2 个等级

### 权威性（vs NGSL / COCA / AWL / NAWL）

- NGSL 内容词覆盖 92.4%（缺 214 个内容词）；COCA 前 2,000 内容词 93.1%
- AWL 570 个词族覆盖 524（91.9%），缺 46 族，含 aspect / potential / emphasis / contrast / phenomenon / whereas
- NAWL 963 覆盖 59.8%；EVP 66.3%
- 详情页抓取：6,969 个 refid，6,772 页有内容；14,586 条义项中 14,514 条拿到英文定义（99.5%）
- 938 词（12.9%）落在词频 3 万位之后或榜外，其中 A1 4 / A2 36 / B1 44
- 98 个专有名词未归类；英式美式 27 组双收、10 组只收英式；5 组原形与屈折形并存
- 等级与词频秩相关 ρ = 0.71，各等级中位词频 866 / 2,607 / 4,467 / 8,636 / 18,399 / 30,603

## 方法

1. 站点为 Bubble 单页应用，数据经 Elasticsearch 加密传输，无法直接取 API。
   用 Playwright 打开页面，把 Display 设为 All，逐屏滚动触发增量渲染，再从 DOM 抽取全部行
   （抽取行数与站点自带计数一致：英式 15,696、美式 15,389）。
2. 官网列表自带 1,110 条完全重复行，按「词头+义项标记+等级+词性」去重。
3. 匹配顺序：精确词头 → 冠词/助动词剥离后的短语首词（`the moon`、`depend on/upon sb/sth`）
   → 词形还原（含不规则表）→ 短语内嵌。等级比较只用前两类且剔除专有名词。
4. 未做义项级语义对齐，因此「词光这个等级指的是哪个义项」只能由等级反推。

## 复现

```bash
node analysis/cefr/crawl-evp.cjs "British English"  .tmp-build/raw_bre.json
node analysis/cefr/crawl-evp.cjs "American English" .tmp-build/raw_ame.json
```

需要本机已安装 Playwright Chromium。

## 数据来源与授权

本目录的**分析结果**（两份报告、`atlas-vs-evp.csv`、`headword-audit.csv`）随仓库以 CC BY 4.0 提供，与词库内容一致。

以下**第三方原始数据不随仓库分发**，需要时按下面的方式自行获取：

| 数据 | 来源 | 获取方式 |
| --- | --- | --- |
| EVP 英式 / 美式全量义项 | [englishprofile.org](https://englishprofile.org/?menu=evp-online)，Cambridge University Press & Assessment | `node analysis/cefr/crawl-evp.cjs "British English" .tmp-build/raw_bre.json` |
| EVP 逐条定义 | 同上（详情页 `?refid=ID_00000000`） | `node analysis/cefr/crawl-evp-details.cjs 1 6969 5 .tmp-build/detail_all.jsonl` |
| NGSL 1.01 | newgeneralservicelist.com（CC BY-SA） | 从官网下载 `NGSL 1.01 by band` |
| COCA 5,000 | 美国当代英语语料库高频表 | 公开镜像，按来源方条款使用 |
| AWL | Coxhead (2000) | 公开镜像（`AWL.json`） |
| NAWL | newgeneralservicelist.com | 公开镜像（`NAWL.json`） |
| 词频表 | OpenSubtitles 2018 `en_50k` | 公开镜像 |

`.gitignore` 已排除 `refs/`、`evp-bre-senses.csv`、`evp-ame-senses.csv`、`evp-definitions.csv`。原因有二：
一是 EVP 是 Cambridge 的版权数据，整表再分发不在合理使用范围内；二是这些数据都能由仓库内的抓取脚本或公开链接复原，
不值得把 1.5MB 第三方语料固化进版本库。报告里引用的数字与样例均可在 `atlas-vs-evp.csv`、`headword-audit.csv` 中复核。
