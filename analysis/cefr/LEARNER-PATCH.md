# 词光不更新时，自己怎么打补丁

> 按**词头 · CEFR 等级 · 义项**整理的自学修正清单。
> 依据 `AUDIT-REPORT.md`；完整数据见 `learner-patch.csv`（可导入 Anki 或表格）。
> 适用：继续用词光背词，但想让等级与义项对齐 CEFR。2026-11-23。

---

## 一句话版本

1. **等级偏乐观约半级**：词光标 B2 的，按 C1 的力气学；标 C1 的，按 C2。
2. **6 个词把进阶义当成了入门义**，先把基础义补上；另有 3 个只是等级标高了，义项没错。
3. **词光缺 1,502 个 CEFR 收录的单词**，其中 A1/A2 基础词 80 个、学术词 46 个，优先补这些。

### 怎么用这份清单

- 只想调整心里的难度尺子 → 看第 1 节，5 行表。
- 想按清单补词 → 直接跳到第 4 节，或把 `learner-patch.csv` 导入 Anki 后筛 `type=add`。
- 想重背被标错或需要上调预期的词 → 第 2 节（9 个）+ 第 3 节（319 个）。

### 五个概念，别混

EVP 的一条记录由四样东西组成：**词头 + guideword + 词性 + 等级**。guideword 是给这条义项起的**标签**（类似分类名，如 `FRIED FOOD`），不是释义本身；它也可以缺失。

| 说法 | 指什么 | 注意 |
| --- | --- | --- |
| **词光等级** | 词光自报的难度标签 | 与 CEFR 无对应关系 |
| **词光首义** | 词光该词的第一条义项（`senses[0]`） | 这是词光自己的排列顺序 |
| **入门等级** | 该词在 EVP 中最低的等级 | 一个词只有一个入门等级 |
| **入门义项** | 该词在入门等级下的**全部条目** | **可能有多条**：17.3% 的词不止一条（`on` 3 条、`a` 4 条）。表中全部列出，不是只取一条 |
| **guideword** | 义项标签，不是释义 | 62.7% 的词在入门等级没有标签，不代表没有义项 |

换句话说：**「入门义项」是一个集合，不是一条记录；guideword 是分类标签，不是意思。**

本版的「释义」列取自每条的 Details 详情页（逐条定义），全库 14,586 条义项抓到 14,514 条（99.5%）。

---

## 1. 先改换算习惯

最高性价比的一步：不改词表，只在脑子里做一次换算。依据是 4,838 个可比词的混淆矩阵。

| 词光标为 | 确实是该级的比例 | 建议按 | 你的动作 |
| --- | ---: | --- | --- |
| A1 | 66% | A1 | 放心背 |
| A2 | 53% | A2 | 基本可信 |
| B1 | 62% | B1 | 基本可信 |
| B2 | 50% | **C1** | 一半以上是 C1/C2 |
| C1 | 27% | **C2** | 71% 被 CEFR 判为 C2 |
| C2 | — | **超出 CEFR** | 词光的 C2 大多不在 CEFR 词表内 |

换句话说：**词光越往上，越不能当分级用。** B2 是需要重新校准的线，C1 之后基本失效。

---

## 2. 入门义项选错了：先把基础义补上

### 2.1 入门义项不同（6 个）

词光给的义项没错，但**不是 CEFR 认为最早该会的那个**。先补入门义项，再回到进阶义。

| 词头 | 词光等级 | 词光首义 | EVP 入门义项 | 释义（EVP） | 入门级 | 类型 · 怎么补 |
| --- | --- | --- | --- | --- | --- | --- |
| chip | B2 | n. 芯片；集成电路 | FRIED FOOD · noun | a long thin piece of potato that is cooked in oil | A1 | **缺义**：词光只有芯片 / 碎屑 / 碰掉，没有「薯条」义，需要新增。 |
| bear | B2 | v. 忍受；承受；承担 | （无标签） · noun | a large, strong, wild animal with thick fur | A2 | **顺序**：「熊」在第 2 条，且词性由动词变成名词。 |
| identification | B2 | n. 识别；鉴定 | DOCUMENT · noun | an official document that shows or proves who you are | A2 | **顺序**：「身份证明」在第 2 条，词光首义是「识别」。 |
| soul | B2 | n. 灵魂；心灵 | MUSIC · noun | popular music which expresses deep feelings, originally perfor… | A2 | **顺序**：「灵魂乐」在第 3 条，词光首义是「灵魂」。 |
| comparative | B2 | adj. 比较的；对比的 | ADJECTIVE · noun | the form of an adjective or adverb that expresses a difference… | A2 | **顺序**：「比较级」在第 3 条（名词），与 EVP 这条同词性，只是排在了最后。 |
| crisp | B2 | adj. 脆的；酥脆的 | （无标签） · noun | a very thin slice of potato that has been cooked in oil and is… | A2 | **顺序**：「薯片」在第 3 条；词光首义是形容词「脆的」，EVP 这条是名词，词性都不同。 |

### 2.2 只是等级标高了（3 个）

义项和 CEFR 一致，只是词光把难度标高了。按 CEFR 的等级学即可，别被标签吓到。

| 词头 | 词光等级 | 词光首义 | 释义（EVP） | 入门级 | 说明 |
| --- | --- | --- | --- | --- | --- |
| golden | B2 | adj. 金色的 | made of gold；being the bright yellow colour of gold | A2 | 词光首义「金色的」对应 EVP 的 COLOUR 义，两者都是 A2；EVP 另有 METAL「金制的」也是 A2。 |
| rap | B2 | n. 说唱音乐 | a type of music in which the words are spoken… | A2 | 义项一致，只是等级标高了。 |
| slim | B1 | adj. 苗条的 | Someone who is slim is thin in an attractive w… | A1 | 义项一致，只是等级标高了。 |

---

## 3. 等级差 2 级及以上：328 个词

其中 **319 个是「词光标低」**——你按更低的等级背了它，CEFR 认为要到更高等级才算掌握。这不是让你重背，而是提示：你只掌握了它最基础的一面。其余 9 个是上一节的反向情况。

常见原因有三类，看表时留意：

- **词光收的是另一个义项**：`cookie` 词光按美式「饼干」标 A2，EVP 英式只收 C2 的「曲奇」；
- **CEFR 只收某个固定搭配**：`crying` 在 EVP 里只有 `be crying out for sth`（C2）；
- **词光把词元拆开了**：`clothing`、`learning`、`saving` 这类 -ing 名词单独成条，CEFR 按词族计。

下表按 **入门等级** 分组，每级按词频排序；EVP 入门义项超过 2 条的只显示前 2 条，完整 328 条见 CSV。

> 表里的「（无标签）」表示 EVP 这条记录没有给 guideword——62.7% 的词在入门等级都是这样。这种情况下只能看到词性，具体含义要回查词光的对应义项。

### 入门级 B1（16 个）

| 词头 | 词光等级 | EVP 入门义项 | 全区间 | 词频 |
| --- | --- | --- | --- | ---: |
| lady | A1 | （无标签） · noun | B1 | 479 |
| feeling | A1 | EMOTION · noun；IDEA · noun …等 3 条 | B1/B2 | 553 |
| personal | A1 | RELATING TO A PERSON · adjective；FOR ONE PERSON · adjective …等 3 条 | B1 | 912 |
| relax | A1 | BECOME HAPPY · verb | B1/C1 | 919 |
| smell | A1 | USE NOSE · verb；UNPLEASANT · verb …等 4 条 | B1/B2 | 968 |
| smile | A1 | （无标签） · verb；（无标签） · noun | B1 | 1,190 |
| pants | A1 | （无标签） · noun | B1 | 1,373 |
| delicious | A1 | （无标签） · adjective | B1 | 2,018 |
| writer | A1 | （无标签） · noun | B1 | 2,549 |
| tiger | A1 | （无标签） · noun | B1 | 2,693 |
| gym | A1 | EXERCISES · noun；BUILDING · noun | B1 | 2,992 |
| strawberry | A1 | （无标签） · noun | B1 | 7,907 |
| rainy | A1 | （无标签） · adjective | B1 | 9,557 |
| toothpaste | A1 | （无标签） · noun | B1 | 11,792 |
| alphabet | A1 | （无标签） · noun | B1 | 12,664 |
| giraffe | A1 | （无标签） · noun | B1 | 13,464 |

### 入门级 B2（25 个）

| 词头 | 词光等级 | EVP 入门义项 | 全区间 | 词频 |
| --- | --- | --- | --- | ---: |
| cause | A2 | REASON WHY · noun；（无标签） · verb | B2/C1/C2 | 555 |
| lower | A2 | MOVE · verb；REDUCE · verb | B2 | 1,966 |
| sale | A2 | SELL · noun | B2 | 2,419 |
| learning | A2 | （无标签） · noun | B2 | 2,513 |
| tail | A2 | ANIMAL · noun | B2/C2 | 2,607 |
| task | A2 | （无标签） · noun | B2 | 2,698 |
| nail | A2 | METAL · noun；BODY PART · noun | B2 | 3,261 |
| naughty | A2 | （无标签） · adjective | B2 | 3,809 |
| tool | A2 | MAKE/REPAIR · noun；EQUIPMENT · noun | B2/C1 | 4,294 |
| cherry | A2 | （无标签） · noun | B2 | 4,436 |
| clothing | A2 | （无标签） · noun | B2 | 4,525 |
| bench | A2 | （无标签） · noun | B2 | 4,762 |
| subway | A2 | （无标签） · noun | B2 | 5,171 |
| cloth | A2 | MATERIAL · noun；FOR CLEANING · noun | B2 | 5,646 |
| sadly | A2 | NOT HAPPY · adverb；NOT SATISFACTORY · adverb | B2 | 6,001 |
| mother-in-law | A2 | （无标签） · noun | B2 | 7,493 |
| father-in-law | A2 | （无标签） · noun | B2 | 7,816 |
| gardener | A2 | （无标签） · noun | B2 | 8,032 |
| bakery | A2 | （无标签） · noun | B2 | 8,663 |
| crocodile | A2 | （无标签） · noun | B2 | 9,430 |
| pancake | A2 | （无标签） · noun | B2 | 11,118 |
| zebra | A2 | （无标签） · noun | B2 | 12,535 |
| gardening | A2 | （无标签） · noun | B2 | 12,577 |
| pyjamas | A2 | （无标签） · noun | B2 | 16,393 |
| non-smoking | A2 | （无标签） · adjective | B2 | 40,909 |

### 入门级 C1（32 个）

| 词头 | 词光等级 | EVP 入门义项 | 全区间 | 词频 |
| --- | --- | --- | --- | ---: |
| bet | B1 | （无标签） · verb | C1/C2 | 654 |
| suppose | A2 | LIKELY · verb；（无标签） · phrase | C1 | 765 |
| lay | B1 | （无标签） · phrasal verb；（无标签） · phrase | C1 | 1,370 |
| scare | B1 | FRIGHTEN · verb；（无标签） · phrasal verb | C1/C2 | 2,002 |
| saving | B1 | LESS MONEY · noun | C1 | 2,062 |
| march | B1 | （无标签） · noun；SHOW DISAGREEMENT · verb …等 3 条 | C1/C2 | 2,164 |
| campaign | B1 | ACTIVITIES · noun；WAR · noun …等 3 条 | C1 | 2,464 |
| tank | B1 | VEHICLE · noun | C1/C2 | 2,616 |
| hop | B1 | MOVE QUICKLY · verb | C1/C2 | 3,632 |
| assignment | B1 | （无标签） · noun | C1 | 3,917 |
| nap | B1 | （无标签） · noun | C1 | 4,505 |
| quote | B1 | REPEAT · verb；GIVE EXAMPLE · verb | C1/C2 | 4,794 |
| coal | B1 | FUEL · noun | C1 | 4,937 |
| compliment | B1 | （无标签） · verb | C1/C2 | 5,035 |
| appetite | B1 | FOOD · noun | C1 | 5,046 |
| bubble | B1 | （无标签） · noun；（无标签） · phrase | C1/C2 | 5,289 |
| journal | B1 | MAGAZINE · noun | C1/C2 | 5,583 |
| pony | B1 | （无标签） · noun | C1 | 5,749 |
| straw | B1 | （无标签） · noun | C1/C2 | 6,162 |
| lounge | B1 | （无标签） · noun | C1 | 6,730 |
| vest | B1 | UNDERWEAR · noun | C1 | 6,771 |
| workshop | B1 | （无标签） · noun | C1 | 7,254 |
| transportation | B1 | （无标签） · noun | C1 | 7,798 |
| pyramid | B1 | （无标签） · noun | C1 | 8,143 |
| mat | B1 | （无标签） · noun | C1 | 8,515 |
| chilly | B1 | （无标签） · adjective | C1 | 8,801 |
| workplace | B1 | （无标签） · noun | C1 | 11,984 |
| historian | B1 | （无标签） · noun | C1 | 13,442 |
| listener | B1 | （无标签） · noun | C1 | 14,631 |
| trainee | B1 | （无标签） · noun | C1 | 15,210 |
| similarly | B1 | （无标签） · adverb | C1 | 18,165 |
| newsletter | B1 | （无标签） · noun | C1 | 23,950 |

### 入门级 C2（246 个，列前 40）

| 词头 | 词光等级 | EVP 入门义项 | 全区间 | 词频 |
| --- | --- | --- | --- | ---: |
| crying | B1 | （无标签） · phrasal verb | C2 | 892 |
| narrator | B2 | （无标签） · noun | C2 | 1,197 |
| commander | B2 | （无标签） · noun | C2 | 1,396 |
| goodness | B2 | （无标签） · noun | C2 | 1,925 |
| suck | B2 | （无标签） · verb | C2 | 2,014 |
| mercy | B2 | KINDNESS · noun | C2 | 2,110 |
| prime | B2 | MAIN · adjective | C2 | 2,191 |
| sin | B2 | RELIGION · noun；MORALLY WRONG · noun | C2 | 2,458 |
| flesh | B2 | BODY · noun | C2 | 2,642 |
| pathetic | B2 | BAD · adjective；SAD · adjective | C2 | 2,790 |
| siren | B2 | （无标签） · noun | C2 | 2,840 |
| surrender | B2 | （无标签） · verb | C2 | 2,991 |
| skull | B2 | （无标签） · noun | C2 | 3,024 |
| crystal | B2 | GLASS · noun | C2 | 3,102 |
| lad | B2 | （无标签） · noun | C2 | 3,104 |
| motion | B2 | MOVEMENT · noun；SUGGESTION · noun | C2 | 3,116 |
| chill | B2 | COLD · noun；FEAR · noun | C2 | 3,201 |
| spit | B2 | （无标签） · verb | C2 | 3,202 |
| nerve | B2 | PART OF THE BODY · noun；RUDENESS · noun …等 3 条 | C2 | 3,209 |
| conscience | B2 | （无标签） · noun | C2 | 3,295 |
| pit | B2 | （无标签） · noun | C2 | 3,365 |
| pat | B2 | （无标签） · verb | C2 | 3,492 |
| snap | B2 | BREAK · verb；LOSE CONTROL · verb …等 4 条 | C2 | 3,542 |
| sneak | B2 | （无标签） · phrase | C2 | 3,648 |
| pole | B1 | （无标签） · noun | C2 | 3,729 |
| core | B2 | IMPORTANT PART · noun；FRUIT · noun | C2 | 3,776 |
| warehouse | B2 | （无标签） · noun | C2 | 3,872 |
| hostage | B2 | PERSON · noun | C2 | 3,873 |
| fraud | B2 | CRIME · noun；TRICK · noun | C2 | 3,904 |
| throne | B2 | （无标签） · phrase；FOR KING/QUEEN · noun | C2 | 3,965 |
| wicked | B2 | （无标签） · adjective | C2 | 3,971 |
| combat | B2 | （无标签） · noun；（无标签） · verb | C2 | 4,075 |
| weed | B2 | （无标签） · noun | C2 | 4,080 |
| barn | B2 | （无标签） · noun | C2 | 4,092 |
| cookie | A2 | （无标签） · noun | C2 | 4,160 |
| nest | B1 | BIRDS · noun；（无标签） · verb | C2 | 4,183 |
| medication | B2 | （无标签） · noun | C2 | 4,189 |
| tire | B1 | BECOME TIRED · verb；（无标签） · phrasal verb | C2 | 4,411 |
| retreat | B2 | （无标签） · verb；MOVE · noun …等 4 条 | C2 | 4,498 |
| alliance | B2 | （无标签） · noun | C2 | 4,523 |

> 其余 206 个见 `learner-patch.csv`（`type=fix`、`cefr_level=C2`、`note=severe`）。

---

## 4. 该补的词

词光未收录、CEFR 收录的单词共 1,502 个。按优先级分三块。

### 4.1 高频核心缺口（COCA 前 1,000，16 个）

这些不是生僻词，是最常用的词。缺了会直接卡住听说读写。

| 词头 | EVP 入门义项 | 入门级 | 词频 | 备注 |
| --- | --- | --- | ---: | --- |
| go | MOVE/TRAVEL · verb；DO SOMETHING · verb | A1 | 47 | 基础移动动词 |
| work | PLACE · noun；JOB · noun …等 3 条 | A1 | 151 | 兼动词与名词 |
| happy | PLEASED · adjective | A1 | 296 | 核心形容词 |
| part | PIECE · noun | A1 | 380 | 兼名词与动词 |
| page | PAPER · noun | A1 | 709 |  |
| thank | （无标签） · verb | A2 | 131 | `thank you` 是 A1 |
| check | EXAMINE · verb | A2 | 410 | 兼名词 |
| song | （无标签） · noun | A2 | 679 |  |
| deep | TOP TO BOTTOM · adjective | A2 | 900 | 兼形容词与副词 |
| search | TRY TO FIND · verb；USE COMPUTER · verb …等 4 条 | B1 | 1,106 | 兼名词与动词 |
| likely | （无标签） · adjective | B1 | 1,899 |  |
| entire | （无标签） · adjective | B2 | 814 |  |
| religious | PERSON · adjective；OF RELIGION · adjective | B2 | 887 |  |
| reveal | TELL · verb | B2 | 930 |  |
| trial | IN COURT · noun | B2 | 1,460 |  |
| federal | — | — | 494 | EVP 未收，按 B2 处理 |

### 4.2 学术词缺口（AWL 570 词族中缺 46 族）

雅思写作最直接的缺口，子表数字越小越核心。括号内是该词的入门等级（`—` 表示 EVP 未收）。

| 子表 | 缺失词族（入门级） |
| --- | --- |
| S1 | legislate(—) |
| S2 | aspect(B2)、equate(C2)、perceive(C1)、potential(B2) |
| S3 | emphasis(B2)、scheme(B2) |
| S4 | contrast(B2)、ethnic(C1)、internal(B2)、output(C2)、parallel(C2)、subsequent(C1) |
| S5 | enable(B2)、notion(C1)、revenue(C1)、whereas(B2) |
| S6 | acknowledge(C1)、federal(—)、incorporate(C2)、index(C1)、rational(C1) |
| S7 | foundation(C1)、paradigm(C2)、phenomenon(C1) |
| S8 | commodity(C1)、complement(—)、infrastructure(C1)、minimise(—)、widespread(C1) |
| S9 | anticipate(C1)、duration(C1)、ethic(—)、passive(B1)、preliminary(C1)、protocol(—)、qualitative(—)、rigid(C2)、scenario(C2)、supplement(C2)、trigger(C1) |
| S10 | albeit(C2)、invoke(—)、levy(—)、nonetheless(C1)、pose(C1) |

### 4.3 CEFR 各级缺口

A1、A2 全列（基础词缺失影响最大），B1 起只列高频的。

#### A1（27 个）

> 最刺眼的是数词：收了 one / four / nine / hundred / thousand / million，却缺 **two / three / five / six / seven / eight / ten**——1 到 10 里只剩 1、4、9。

| 词头 | EVP 入门义项 | 词频 |
| --- | --- | ---: |
| go | MOVE/TRAVEL · verb；DO SOMETHING · verb | 47 |
| well | IN A GOOD WAY · adverb；HEALTHY · adjective …等 3 条 | 59 |
| two | NUMBER · number | 133 |
| work | PLACE · noun；JOB · noun …等 3 条 | 151 |
| dad | （无标签） · noun | 221 |
| three | （无标签） · number | 231 |
| happy | PLEASED · adjective | 296 |
| part | PIECE · noun | 380 |
| five | （无标签） · number | 397 |
| six | （无标签） · number | 546 |
| past | TIME · preposition | 596 |
| cannot | （无标签） · modal verb | 605 |
| ten | （无标签） · number | 620 |
| goodbye | （无标签） · exclamation | 728 |
| seven | （无标签） · number | 788 |
| eight | （无标签） · number | 895 |
| sad | （无标签） · adjective | 956 |
| mum | （无标签） · noun | 970 |
| beer | （无标签） · noun | 1,080 |
| page | PAPER · noun | 1,860 |
| twenty | NUMBER · number | 2,411 |
| fifteen | （无标签） · number | 3,877 |
| zoo | （无标签） · noun | 4,303 |
| eleven | （无标签） · number | 4,903 |
| thirteen | （无标签） · number | 7,790 |
| fourteen | （无标签） · number | 8,020 |
| nineteen | （无标签） · number | 11,511 |

#### A2（53 个）

| 词头 | EVP 入门义项 | 词频 |
| --- | --- | ---: |
| thank | （无标签） · verb | 131 |
| while | DURING · conjunction | 311 |
| check | EXAMINE · verb | 410 |
| mine | （无标签） · pronoun | 421 |
| himself | REFLEXIVE · pronoun | 585 |
| luck | CHANCE · noun | 616 |
| song | （无标签） · noun | 679 |
| deep | TOP TO BOTTOM · adjective | 900 |
| girlfriend | ROMANCE · noun | 966 |
| boyfriend | （无标签） · noun | 1,012 |
| themselves | REFLEXIVE · pronoun | 1,151 |
| herself | REFLEXIVE · pronoun | 1,198 |
| itself | REFLEXIVE · pronoun | 1,302 |
| grandma | （无标签） · noun | 1,429 |
| pack | （无标签） · verb | 1,537 |
| grandpa | （无标签） · noun | 1,550 |
| carefully | （无标签） · adverb | 2,046 |
| champagne | （无标签） · noun | 2,338 |
| daily | EVERY DAY · adjective；（无标签） · adverb | 2,806 |
| fifth | （无标签） · number | 2,959 |
| fifty | （无标签） · number | 3,530 |
| granny | （无标签） · noun | 3,833 |
| sixth | （无标签） · number | 4,693 |
| photographer | （无标签） · noun | 4,727 |
| good-looking | （无标签） · adjective | 5,707 |
| disco | （无标签） · noun | 6,634 |
| cheque | （无标签） · noun | 6,954 |
| granddad | （无标签） · noun | 7,770 |
| lemonade | （无标签） · noun | 7,863 |
| hip-hop | （无标签） · noun | 7,930 |
| mosque | （无标签） · noun | 8,792 |
| eighty | （无标签） · number | 11,699 |
| motorbike | （无标签） · noun | 11,869 |
| grandchild | （无标签） · noun | 12,695 |
| seventy | （无标签） · number | 13,000 |
| ninety | NUMBER · number | 13,012 |
| right-hand | （无标签） · adjective | 13,101 |
| singular | （无标签） · adjective；（无标签） · noun | 16,464 |
| pence | （无标签） · noun | 16,745 |
| omelette | （无标签） · noun | 18,080 |
| plural | （无标签） · noun | 19,768 |
| verb | （无标签） · noun | 21,020 |
| policewoman | （无标签） · noun | 23,569 |
| businesswoman | （无标签） · noun | 24,398 |
| footballer | （无标签） · noun | 25,094 |
| kilogram | （无标签） · noun | 36,902 |
| salesperson | （无标签） · noun | 40,786 |
| washing-up | （无标签） · noun | 47,925 |
| headteacher | （无标签） · noun | 榜外 |
| let's | （无标签） · phrase | 榜外 |
| penfriend | （无标签） · noun | 榜外 |
| schoolchild | （无标签） · noun | 榜外 |
| superlative | （无标签） · noun | 榜外 |

#### B1（91 个，列前 50）

| 词头 | EVP 入门义项 | 词频 |
| --- | --- | ---: |
| seriously | BADLY · adverb | 807 |
| whether | IF · conjunction | 916 |
| killer | （无标签） · noun | 950 |
| quit | STOP WORK · verb；STOP SOMETHING · verb | 1,047 |
| search | TRY TO FIND · verb；USE COMPUTER · verb …等 4 条 | 1,106 |
| somehow | WAY NOT KNOWN · adverb | 1,464 |
| likely | （无标签） · adjective | 1,899 |
| cancer | （无标签） · noun | 1,940 |
| particularly | （无标签） · adverb | 2,870 |
| lightning | （无标签） · noun | 3,656 |
| safely | （无标签） · adverb | 3,757 |
| baker | （无标签） · noun | 4,055 |
| broad | WIDE · adjective | 4,600 |
| breast | （无标签） · noun | 4,692 |
| teenage | （无标签） · adjective | 4,876 |
| kindly | （无标签） · adverb | 4,919 |
| fry | （无标签） · verb | 5,007 |
| secretly | （无标签） · adverb | 5,281 |
| forehead | （无标签） · noun | 5,699 |
| leaf | PLANT · noun | 5,736 |
| beautifully | （无标签） · adverb | 6,238 |
| rider | （无标签） · noun | 6,959 |
| keeper | LOOKING AFTER · noun；FOOTBALL · noun | 7,156 |
| camel | （无标签） · noun | 7,566 |
| aspirin | （无标签） · noun | 7,889 |
| fax | （无标签） · verb | 8,063 |
| surprisingly | （无标签） · adverb | 8,094 |
| juicy | WITH JUICE · adjective | 8,415 |
| kitten | （无标签） · noun | 8,455 |
| nightclub | （无标签） · noun | 8,510 |
| server | （无标签） · noun | 8,513 |
| briefly | （无标签） · adverb | 8,914 |
| disc | RECORDING · noun | 9,492 |
| unemployment | （无标签） · noun | 10,318 |
| examiner | （无标签） · noun | 10,867 |
| underpants | （无标签） · noun | 11,040 |
| babysit | （无标签） · verb | 11,754 |
| animation | （无标签） · noun | 11,780 |
| middle-aged | （无标签） · adjective | 11,865 |
| amazingly | （无标签） · adverb | 12,217 |
| diver | （无标签） · noun | 12,266 |
| knickers | （无标签） · noun | 12,983 |
| politely | （无标签） · adverb | 13,339 |
| swimmer | （无标签） · noun | 13,457 |
| dangerously | （无标签） · adverb | 13,484 |
| bravely | （无标签） · adverb | 14,182 |
| accurately | （无标签） · adverb | 14,416 |
| passive | GRAMMAR · adjective | 14,470 |
| unimportant | （无标签） · adjective | 14,859 |
| sweatshirt | （无标签） · noun | 17,601 |

> 其余 41 个见 CSV（`type=add`、`cefr_level=B1`）。

#### B2（474 个，列前 20）

| 词头 | EVP 入门义项 | 词频 |
| --- | --- | ---: |
| known | FAMILIAR · adjective | 643 |
| darling | （无标签） · noun | 707 |
| weird | （无标签） · adjective | 724 |
| entire | （无标签） · adjective | 814 |
| bloody | COVERED IN BLOOD · adjective | 1,001 |
| stuck | NOT MOVE · adjective | 1,081 |
| mission | PURPOSE · noun | 1,164 |
| heaven | AFTER LIFE · noun；SOMETHING NICE · noun | 1,166 |
| witness | （无标签） · noun；（无标签） · verb | 1,232 |
| beg | VERY POOR · verb；STRONG REQUEST · verb | 1,381 |
| justice | FAIRNESS · noun；LAW · noun | 1,394 |
| devil | EVIL BEING · noun | 1,400 |
| trial | IN COURT · noun | 1,460 |
| aware | （无标签） · adjective | 1,642 |
| command | ORDER · noun；KNOWLEDGE · noun | 1,649 |
| settle | LIVE · verb；DECIDE · verb | 1,719 |
| naked | NO CLOTHES · adjective | 1,802 |
| revenge | （无标签） · noun | 1,897 |
| liar | （无标签） · noun | 1,944 |
| sexy | （无标签） · adjective | 2,082 |

> 其余 454 个见 CSV（`type=add`、`cefr_level=B2`）。

#### C1（398 个，列前 20）

| 词头 | EVP 入门义项 | 词频 |
| --- | --- | ---: |
| fake | （无标签） · adjective | 1,566 |
| witch | （无标签） · noun | 2,334 |
| sacrifice | （无标签） · noun；（无标签） · verb | 2,440 |
| empire | BUSINESSES · noun；COUNTRIES · noun | 2,550 |
| glory | PRAISE · noun；QUALITY · noun | 2,623 |
| alert | （无标签） · adjective；（无标签） · noun | 2,677 |
| saint | （无标签） · noun | 2,696 |
| aboard | （无标签） · adverb | 2,974 |
| trigger | （无标签） · verb | 3,143 |
| officially | （无标签） · adverb | 3,296 |
| pulse | （无标签） · noun | 3,473 |
| technically | SCIENCE/INDUSTRY · adverb | 3,552 |
| walker | （无标签） · noun | 3,669 |
| junk | （无标签） · noun | 3,679 |
| serial | （无标签） · adjective；（无标签） · noun | 3,777 |
| foundation | START · noun；ORGANIZATION · noun | 4,065 |
| rocky | WITH ROCKS · adjective | 4,139 |
| palm | TREE · noun | 4,184 |
| scan | READ · verb；COMPUTER · verb | 4,569 |
| personnel | （无标签） · noun | 4,654 |

> 其余 378 个见 CSV（`type=add`、`cefr_level=C1`）。

#### C2（459 个，列前 15）

| 词头 | EVP 入门义项 | 词频 |
| --- | --- | ---: |
| squad | （无标签） · noun | 2,522 |
| trash | （无标签） · noun | 2,586 |
| custody | CHILD · noun；PRISON · noun | 2,705 |
| virgin | （无标签） · noun；（无标签） · adjective | 2,739 |
| crush | CROWD · noun；（无标签） · verb …等 3 条 | 2,994 |
| corpse | （无标签） · noun | 3,622 |
| trauma | （无标签） · noun | 3,755 |
| resistance | DISAGREE · noun；FIGHT · noun …等 4 条 | 3,790 |
| buzz | EXCITEMENT · noun；SOUND · noun …等 4 条 | 3,980 |
| patch | AREA · noun；MATERIAL · noun …等 4 条 | 4,127 |
| forgiveness | （无标签） · noun | 4,341 |
| raid | SOLDIERS · noun；POLICE · noun …等 4 条 | 4,835 |
| fist | （无标签） · noun | 4,909 |
| blackmail | （无标签） · noun；（无标签） · verb | 4,978 |
| ritual | （无标签） · noun | 5,001 |

> 其余 444 个见 CSV（`type=add`、`cefr_level=C2`）。

---

## 5. 按等级的行动清单

| 你的阶段 | 先做这三件事 |
| --- | --- |
| A1–A2 | 补 4.3 的 A1/A2 缺词（含 2/3/5/6/7/8/10 这些数词）；补 4.1 的 go / work / happy / page |
| B1 | 补 AWL S1–S4（13 族）；把第 3 节入门级 B1 的 16 个词重背一遍 |
| B2 | 词光标 B2 的按 C1 准备；补 AWL S5–S8（17 族）；补 4.3 的 B2 高频缺口 |
| C1 | 词光标 C1 的按 C2 准备（71% 会被判 C2）；补 AWL S9–S10（16 族） |
| C2 | 词光的 C2 不等于 CEFR C2，按超纲词看待；重点转向 4.3 的缺口 |

---

## 6. 口径说明

- **可比词 4,838 个**：词头精确匹配、非专有名词；不含短语式词头（`the moon`、`depend on/upon sth`）与词形推断。
- **偏差 = 入门级 − 词光等级**。正数表示词光标低了（CEFR 更晚要求），负数表示标高了。
- **入门等级**取该词在 EVP 中最低的等级；**入门义项**是该等级下的全部条目，可能 1 条也可能多条（全库 17.3% 的词不止一条）。
- **guideword** 是 EVP 给义项起的标签，用来区分同词的不同义项，**不是释义**；它可缺失，入门等级里 62.7% 的词没有标签。
- 只统计词头与词光完全相同的条目，不借用短语条目的等级（如 `living room` 不算 `living`）。
- **缺词**已剔除：功能词、屈折形（things / working）、拼写变体（color / center）、专有名词、感叹词与缩写。
- **释义**取自 EVP 详情页（`?refid=`），按「词头 + 等级 + 词性 + guideword」与列表条目对齐，覆盖率 99.5%；未匹配的 72 条多为短语。
- 词频来自 OpenSubtitles 50k 语料；「榜外」表示不在前 5 万。

> 完整数据：`learner-patch.csv` —— 2,210 条等级修正（`type=fix`）+ 1,502 条补充词（`type=add`），含词头、词光首义、入门义项（全部条目）、入门级、词频。

