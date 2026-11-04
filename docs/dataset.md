# 词库格式 / Dataset format

## `data/word-atlas.json`

一个数组，按学习路线排序（CEFR 由易到难，同级内打散话题）。每个词条：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | URL 安全的唯一标识，同时是媒体文件名，例如 `principle`、`day-off` |
| `w` | string | 词头 |
| `uk` / `us` | string | 英式 / 美式 IPA，带斜杠 |
| `senses` | `{pos, zh, en}[]` | 1–3 个义项：词性、中文释义、简明英文释义 |
| `ex` | `{en, zh}[]` | 两条原创例句：`ex[0]` 日常短句，`ex[1]` 雅思语境长句 |
| `col` | string[] | 常用搭配，格式 `english｜中文` |
| `fam` | string[] | 词族，格式 `word (pos)` |
| `root` | string[] | 可选：同根词——与词头共享词根的同源词，来自词源词典 |
| `ety` | string | 可选：词源图景小结，一句话读出词根的字面义（覆盖 6,754 条） |
| `syn` / `ant` | string[] | 近义 / 反义。`syn` 先放词源词典的近义词辨析，再放原有补充，最多 6 个 |
| `tip` | string | 一条中文用法或辨析提示 |
| `cefr` | `A1`…`C2` | 估计难度 |
| `topic` | string | 19 个话题之一：education, work, technology, science, environment, health, society, government, economy, media, arts, travel, city, nature, daily, emotion, thinking, sport, history |
| `note` | string | 可选：用法提醒（冒犯性、过时用法、拼写说明等） |

## `data/word-atlas.csv`

同样内容的表格版，多值字段用 ` | `、` ; ` 或 `, ` 连接，UTF-8 编码。

## 网页数据 `public/atlas/`

- `index.json`：紧凑索引，`words` 中每行为 `[id, word, zh, ipa, cefrIndex, topicIndex, media]`。`media` 是位标记：`1` 插画、`2` 英音、`4` 美音、`8` 例句朗读。
- `entries/<n>.json`：完整词条，每块 100 条，第 `n` 块对应索引中第 `n*100` 到 `n*100+99` 行。
- `img/<id>.webp`（512px）、`thumb/<id>.webp`（256px）。
- `audio/uk/<id>.mp3`、`audio/us/<id>.mp3`、`audio/ex/<id>.mp3`（`ex[0]` 的朗读）。

媒体覆盖情况以 `index.json` 的位标记为准，不要假设每个词都有全部文件。

## 授权

CC BY 4.0，署名 “Word Atlas contributors”。见 [CONTENT_LICENSE.md](../CONTENT_LICENSE.md)。
