# 词光补丁清单

> 词表本身不更新，靠自学补。只回答三件事：**等级怎么换算、哪些词背反了、还缺哪些词**。
> 依据 EVP 全量比对（15,696 条义项，见 `AUDIT-REPORT.md`）；逐词数据见 `learner-patch.csv`。
>
> 文中两个词先分清：**词光首义** = 词光自己列的第一条义项；**入门义** = CEFR 认为这个词最早该会的那条义项。两者不一致，才需要按第 2 节改。

## 先做这三件事

1. **等级往上算半级**：B2 按 C1 准备，C1 按 C2。
2. **补 9 个词的入门义**（第 2 节）——它们的基础义可能没背过。
3. **补词**：先补最常用的 16 个（4.1），再补 A1–A2 缺的 71 个（4.2），最后学术词 46 个（4.3）。

---

## 1. 等级换算表

4,838 个可比词里，词光标注与 CEFR 实际等级的对应：

| 词光标为 | 确实是该级 | 建议按 | 怎么做 |
| --- | ---: | --- | --- |
| A1 | 66% | A1 | 放心背 |
| A2 | 53% | A2 | 基本可信 |
| B1 | 62% | B1 | 基本可信 |
| B2 | 50% | **C1** | 一半其实是 C1/C2 |
| C1 | 27% | **C2** | 71% 被 CEFR 判为 C2 |
| C2 | — | **超纲词** | 大多不在 CEFR 词表内 |

**A1–B1 可以信，B2 开始往上加半级，C1 之后不能当分级用。**

---

## 2. 九个要注意的词

### 2.1 义项排反了（6 个）

词光的义项没写错，但**不是 CEFR 认为最早该会的那个**。先把入门义补上。

| 词 | 词光等级 | 词光首义 | CEFR 入门义（释义） | 中文 | 怎么补 |
| --- | --- | --- | --- | --- | --- |
| chip | B2 | n. 芯片；集成电路 | a long thin piece of potato that is cooked in oil | 英式薯条 | 缺义：词光只有芯片 / 碎屑 / 碰掉 |
| bear | B2 | v. 忍受；承受；承担 | a large, strong, wild animal with thick fur | 熊 | 顺序：熊在第 2 条，词性也从动词变名词 |
| identification | B2 | n. 识别；鉴定 | an official document that shows or proves who you are | 身份证明 | 顺序：身份证明在第 2 条 |
| soul | B2 | n. 灵魂；心灵 | popular music which expresses deep feelings, originally perf… | 灵魂乐 | 顺序：灵魂乐在第 3 条 |
| comparative | B2 | adj. 比较的；对比的 | the form of an adjective or adverb that expresses a differen… | 比较级 | 顺序：比较级在第 3 条 |
| crisp | B2 | adj. 脆的；酥脆的 | a very thin slice of potato that has been cooked in oil and… | 薯片 | 顺序：薯片在第 3 条，词光首义是形容词 |

### 2.2 只是等级标高了（3 个）

义项没错，按 CEFR 的等级学就行，别被词光的标签吓到。

| 词 | 词光等级 | CEFR | 说明 |
| --- | --- | --- | --- |
| golden | B2 | A2 | 「金色的」= EVP 的 COLOUR，两边都是 A2 |
| rap | B2 | A2 | 说唱，义项一致 |
| slim | B1 | A1 | 苗条，义项一致 |

---

## 3. 这些词，词光说简单了

还有 319 个词的 CEFR 等级比词光高 2 级以上。不是让你重背，而是提醒：**你以为会了，其实只掌握了最基础的一面。**

下表按 CEFR 等级排，B1/B2 全列，C1/C2 只列高频；完整 319 条见 CSV（`note=severe`）。

| 词 | 词光 | CEFR | 入门义 | 词频 |
| --- | --- | --- | --- | ---: |
| lady | A1 | B1 | noun（无标记） | 479 |
| feeling | A1 | B1 | EMOTION（noun）；IDEA（noun） 等 3 条 | 553 |
| personal | A1 | B1 | RELATING TO A PERSON（adjective）；FOR ONE PERSON（adjective） 等 3 条 | 912 |
| relax | A1 | B1 | BECOME HAPPY（verb） | 919 |
| smell | A1 | B1 | USE NOSE（verb）；UNPLEASANT（verb） 等 4 条 | 968 |
| smile | A1 | B1 | verb（无标记）；noun（无标记） | 1,190 |
| pants | A1 | B1 | noun（无标记） | 1,373 |
| delicious | A1 | B1 | adjective（无标记） | 2,018 |
| writer | A1 | B1 | noun（无标记） | 2,549 |
| tiger | A1 | B1 | noun（无标记） | 2,693 |
| gym | A1 | B1 | EXERCISES（noun）；BUILDING（noun） | 2,992 |
| strawberry | A1 | B1 | noun（无标记） | 7,907 |
| rainy | A1 | B1 | adjective（无标记） | 9,557 |
| toothpaste | A1 | B1 | noun（无标记） | 11,792 |
| alphabet | A1 | B1 | noun（无标记） | 12,664 |
| giraffe | A1 | B1 | noun（无标记） | 13,464 |
| cause | A2 | B2 | REASON WHY（noun）；verb（无标记） | 555 |
| lower | A2 | B2 | MOVE（verb）；REDUCE（verb） | 1,966 |
| sale | A2 | B2 | SELL（noun） | 2,419 |
| learning | A2 | B2 | noun（无标记） | 2,513 |
| tail | A2 | B2 | ANIMAL（noun） | 2,607 |
| task | A2 | B2 | noun（无标记） | 2,698 |
| nail | A2 | B2 | METAL（noun）；BODY PART（noun） | 3,261 |
| naughty | A2 | B2 | adjective（无标记） | 3,809 |
| tool | A2 | B2 | MAKE/REPAIR（noun）；EQUIPMENT（noun） | 4,294 |
| cherry | A2 | B2 | noun（无标记） | 4,436 |
| clothing | A2 | B2 | noun（无标记） | 4,525 |
| bench | A2 | B2 | noun（无标记） | 4,762 |
| subway | A2 | B2 | noun（无标记） | 5,171 |
| cloth | A2 | B2 | MATERIAL（noun）；FOR CLEANING（noun） | 5,646 |
| sadly | A2 | B2 | NOT HAPPY（adverb）；NOT SATISFACTORY（adverb） | 6,001 |
| mother-in-law | A2 | B2 | noun（无标记） | 7,493 |
| father-in-law | A2 | B2 | noun（无标记） | 7,816 |
| gardener | A2 | B2 | noun（无标记） | 8,032 |
| bakery | A2 | B2 | noun（无标记） | 8,663 |
| crocodile | A2 | B2 | noun（无标记） | 9,430 |
| pancake | A2 | B2 | noun（无标记） | 11,118 |
| zebra | A2 | B2 | noun（无标记） | 12,535 |
| gardening | A2 | B2 | noun（无标记） | 12,577 |
| pyjamas | A2 | B2 | noun（无标记） | 16,393 |
| non-smoking | A2 | B2 | adjective（无标记） | 40,909 |
| bet | B1 | C1 | verb（无标记） | 654 |
| suppose | A2 | C1 | LIKELY（verb）；phrase（无标记） | 765 |
| lay | B1 | C1 | phrasal verb（无标记）；phrase（无标记） | 1,370 |
| scare | B1 | C1 | FRIGHTEN（verb）；phrasal verb（无标记） | 2,002 |
| saving | B1 | C1 | LESS MONEY（noun） | 2,062 |
| march | B1 | C1 | noun（无标记）；SHOW DISAGREEMENT（verb） 等 3 条 | 2,164 |
| campaign | B1 | C1 | ACTIVITIES（noun）；WAR（noun） 等 3 条 | 2,464 |
| tank | B1 | C1 | VEHICLE（noun） | 2,616 |
| hop | B1 | C1 | MOVE QUICKLY（verb） | 3,632 |
| assignment | B1 | C1 | noun（无标记） | 3,917 |
| nap | B1 | C1 | noun（无标记） | 4,505 |
| quote | B1 | C1 | REPEAT（verb）；GIVE EXAMPLE（verb） | 4,794 |
| coal | B1 | C1 | FUEL（noun） | 4,937 |
| compliment | B1 | C1 | verb（无标记） | 5,035 |
| appetite | B1 | C1 | FOOD（noun） | 5,046 |
| bubble | B1 | C1 | noun（无标记）；phrase（无标记） | 5,289 |
| journal | B1 | C1 | MAGAZINE（noun） | 5,583 |
| pony | B1 | C1 | noun（无标记） | 5,749 |
| straw | B1 | C1 | noun（无标记） | 6,162 |
| lounge | B1 | C1 | noun（无标记） | 6,730 |
| crying | B1 | C2 | phrasal verb（无标记） | 892 |
| narrator | B2 | C2 | noun（无标记） | 1,197 |
| commander | B2 | C2 | noun（无标记） | 1,396 |
| goodness | B2 | C2 | noun（无标记） | 1,925 |
| suck | B2 | C2 | verb（无标记） | 2,014 |
| mercy | B2 | C2 | KINDNESS（noun） | 2,110 |
| prime | B2 | C2 | MAIN（adjective） | 2,191 |
| sin | B2 | C2 | RELIGION（noun）；MORALLY WRONG（noun） | 2,458 |
| flesh | B2 | C2 | BODY（noun） | 2,642 |
| pathetic | B2 | C2 | BAD（adjective）；SAD（adjective） | 2,790 |

> C1 列了 20 个、C2 列了 10 个；其余 C1 12 个、C2 236 个在 CSV。

---

## 4. 要补的词

词光未收录、CEFR 收录的单词共 **1,502** 个。按优先级排。

### 4.1 最常用的 16 个（COCA 前 1,000）

这些不是生僻词，缺了会直接卡住听说读写。

| 词 | 中文 | 等级 | 词频 |
| --- | --- | --- | ---: |
| go | 移动 | A1 | 47 |
| work | 工作 | A1 | 151 |
| happy | 开心 | A1 | 296 |
| part | 部分 | A1 | 380 |
| page | 页 | A1 | 1,860 |
| thank | 感谢 | A2 | 131 |
| check | 检查 | A2 | 410 |
| song | 歌 | A2 | 679 |
| deep | 深的 | A2 | 900 |
| search | 搜索 | B1 | 1,106 |
| likely | 可能的 | B1 | 1,899 |
| entire | 整个的 | B2 | 814 |
| religious | 宗教的 | B2 | 3,175 |
| reveal | 揭示 | B2 | 3,440 |
| trial | 审判 | B2 | 1,460 |
| federal | 联邦的 | — | 榜外 |

### 4.2 A1–A2 还缺 71 个（已去掉 4.1 的重复）

最该先补的一批，★ = 词频前 300。

| 词 | 等级 | 词频 |
| --- | --- | ---: |
| ★ well | A1 | 59 |
| ★ two | A1 | 133 |
| ★ dad | A1 | 221 |
| ★ three | A1 | 231 |
| five | A1 | 397 |
| six | A1 | 546 |
| past | A1 | 596 |
| cannot | A1 | 605 |
| ten | A1 | 620 |
| goodbye | A1 | 728 |
| seven | A1 | 788 |
| eight | A1 | 895 |
| sad | A1 | 956 |
| mum | A1 | 970 |
| beer | A1 | 1,080 |
| twenty | A1 | 2,411 |
| fifteen | A1 | 3,877 |
| zoo | A1 | 4,303 |
| eleven | A1 | 4,903 |
| thirteen | A1 | 7,790 |
| fourteen | A1 | 8,020 |
| nineteen | A1 | 11,511 |
| while | A2 | 311 |
| mine | A2 | 421 |
| himself | A2 | 585 |
| luck | A2 | 616 |
| girlfriend | A2 | 966 |
| boyfriend | A2 | 1,012 |
| themselves | A2 | 1,151 |
| herself | A2 | 1,198 |
| itself | A2 | 1,302 |
| grandma | A2 | 1,429 |
| pack | A2 | 1,537 |
| grandpa | A2 | 1,550 |
| carefully | A2 | 2,046 |
| champagne | A2 | 2,338 |
| daily | A2 | 2,806 |
| fifth | A2 | 2,959 |
| fifty | A2 | 3,530 |
| granny | A2 | 3,833 |
| sixth | A2 | 4,693 |
| photographer | A2 | 4,727 |
| good-looking | A2 | 5,707 |
| disco | A2 | 6,634 |
| cheque | A2 | 6,954 |
| granddad | A2 | 7,770 |
| lemonade | A2 | 7,863 |
| hip-hop | A2 | 7,930 |
| mosque | A2 | 8,792 |
| eighty | A2 | 11,699 |
| motorbike | A2 | 11,869 |
| grandchild | A2 | 12,695 |
| seventy | A2 | 13,000 |
| ninety | A2 | 13,012 |
| right-hand | A2 | 13,101 |
| singular | A2 | 16,464 |
| pence | A2 | 16,745 |
| omelette | A2 | 18,080 |
| plural | A2 | 19,768 |
| verb | A2 | 21,020 |
| policewoman | A2 | 23,569 |
| businesswoman | A2 | 24,398 |
| footballer | A2 | 25,094 |
| kilogram | A2 | 36,902 |
| salesperson | A2 | 40,786 |
| washing-up | A2 | 47,925 |
| headteacher | A2 | 榜外 |
| let's | A2 | 榜外 |
| penfriend | A2 | 榜外 |
| schoolchild | A2 | 榜外 |
| superlative | A2 | 榜外 |

> 数词缺得最离谱：有 one / four / nine / hundred / thousand / million，却没有 two / three / five / six / seven / eight / ten。

### 4.3 学术词 46 个（AWL 570 词族里缺的）

雅思写作最直接的缺口，子表数字越小越核心。

| 子表 | 词族 |
| --- | --- |
| S1 | legislate |
| S2 | aspect、equate、perceive、potential |
| S3 | emphasis、scheme |
| S4 | contrast、ethnic、internal、output、parallel、subsequent |
| S5 | enable、notion、revenue、whereas |
| S6 | acknowledge、federal、incorporate、index、rational |
| S7 | foundation、paradigm、phenomenon |
| S8 | commodity、complement、infrastructure、minimise、widespread |
| S9 | anticipate、duration、ethic、passive、preliminary、protocol、qualitative、rigid、scenario、supplement、trigger |
| S10 | albeit、invoke、levy、nonetheless、pose |

### 4.4 B1 以上还缺的（列前 40）

B1–C1 共缺 957 个，按词频列前 40；C2 另有 459 个，见 CSV。

| 词 | 等级 | 词频 |
| --- | --- | ---: |
| seriously | B1 | 807 |
| whether | B1 | 916 |
| killer | B1 | 950 |
| quit | B1 | 1,047 |
| somehow | B1 | 1,464 |
| cancer | B1 | 1,940 |
| particularly | B1 | 2,870 |
| lightning | B1 | 3,656 |
| safely | B1 | 3,757 |
| baker | B1 | 4,055 |
| broad | B1 | 4,600 |
| breast | B1 | 4,692 |
| teenage | B1 | 4,876 |
| kindly | B1 | 4,919 |
| fry | B1 | 5,007 |
| secretly | B1 | 5,281 |
| forehead | B1 | 5,699 |
| leaf | B1 | 5,736 |
| beautifully | B1 | 6,238 |
| rider | B1 | 6,959 |
| keeper | B1 | 7,156 |
| camel | B1 | 7,566 |
| aspirin | B1 | 7,889 |
| fax | B1 | 8,063 |
| surprisingly | B1 | 8,094 |
| juicy | B1 | 8,415 |
| kitten | B1 | 8,455 |
| nightclub | B1 | 8,510 |
| server | B1 | 8,513 |
| briefly | B1 | 8,914 |
| disc | B1 | 9,492 |
| unemployment | B1 | 10,318 |
| examiner | B1 | 10,867 |
| underpants | B1 | 11,040 |
| babysit | B1 | 11,754 |
| animation | B1 | 11,780 |
| middle-aged | B1 | 11,865 |
| amazingly | B1 | 12,217 |
| diver | B1 | 12,266 |
| knickers | B1 | 12,983 |

---

## 5. 怎么用

- **补词**：`learner-patch.csv` 导入 Anki，筛 `type=add`，按 4.1 → 4.2 → 4.3 的顺序建卡。
- **改卡**：筛 `type=fix` 且 `note=severe`，把等级标签换成 `cefr_level`。
- **查义项**：`evp-definitions.csv` 有每条的英文定义，用来核对词光的中文义项。

---

## 6. 口径

- **可比词 4,838 个**：词头精确匹配、非专有名词；不含短语词头与词形推断。
- **入门等级** = 该词在 EVP 的最低等级；**入门义项** = 该等级下的全部记录（17.3% 的词不止一条）。
- 第 3 节「入门义」列是 EVP 的 guideword（义项分类名，如 `FRIED FOOD`），**不是释义**；释义见 `evp-definitions.csv`。
- 未收录判定已剔除：功能词、屈折形、拼写变体、专有名词、感叹词。
- 词频来自 OpenSubtitles 50k；「榜外」= 不在前 5 万。

> 全部数据：`learner-patch.csv`（2,210 条等级修正 + 1,502 条补充词）。

