# 词光不更新时，自己怎么打补丁

> 按**词头 · CEFR 等级 · 义项**整理的自学修正清单。
> 依据 `AUDIT-REPORT.md`；完整数据见 `learner-patch.csv`（可导入 Anki 或表格）。
> 适用：继续用词光背词，但想让等级与义项对齐 CEFR。2026-11-23。

---

## 一句话版本

1. **等级偏乐观约半级**：词光标 B2 的，按 C1 的力气学；标 C1 的，按 C2。
2. **5 个词把进阶义当成了入门义**，先把基础义补上；另有 4 个只是等级标高了，义项没错。
3. **词光缺 1,502 个 CEFR 收录的单词**，其中 A1/A2 基础词 80 个、学术词 46 个，优先补这些。

### 怎么用这份清单

- 只想调整心里的难度尺子 → 看第 1 节，5 行表。
- 想按清单补词 → 直接跳到第 4 节，或把 `learner-patch.csv` 导入 Anki 后筛 `type=add`。
- 想重背被标错或需要上调预期的词 → 第 2 节（9 个）+ 第 3 节（319 个）。

### 表头说明

后面所有表格都按这五个概念拆开，不再混在一个单元格里：

| 列 | 含义 |
| --- | --- |
| **词光等级** | 词光自报的难度标签 |
| **词光首义** | 该词在词光里的第一条义项（`senses[0]`） |
| **入门义项** | 该词在 EVP 里**等级最低**的那条义项，用 guideword 标记。EVP 逐义项定级，条目间没有「第几条」的顺序，所以它**不等于**词典里的第一个释义 |
| **词性** | EVP 该义项的词性。可能与词光首义的词性不同（如 `bear`：词光是动词「忍受」，EVP 入门义项是名词「熊」） |
| **入门级 / 全区间** | 该义项的等级 / 该词在 EVP 出现过的所有等级 |

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

### 2.1 入门义项不同（5 个）

词光给的义项没错，但**不是 CEFR 认为最早该会的那个**。先补入门义项，再回到进阶义。

| 词头 | 词光等级 | 词光首义 | 入门义项 | 词性 | 入门级 | 类型 | 怎么补 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| chip | B2 | n. 芯片；集成电路 | FRIED FOOD | noun | A1 | 缺义 | 词光只有芯片 / 碎屑 / 碰掉，没有「薯条」义，需要新增。 |
| bear | B2 | v. 忍受；承受；承担 | ANIMAL | noun | A2 | 顺序 | 「熊」在第 2 条，且词性由动词变成名词。 |
| identification | B2 | n. 识别；鉴定 | DOCUMENT | noun | A2 | 顺序 | 「身份证明」在第 2 条，词光首义是「识别」。 |
| soul | B2 | n. 灵魂；心灵 | MUSIC | noun | A2 | 顺序 | 「灵魂乐」在第 3 条，词光首义是「灵魂」。 |
| comparative | B2 | adj. 比较的；对比的 | ADJECTIVE | adjective | A2 | 顺序 | 「比较级」在第 3 条（词光标成名词），EVP 收的是形容词。 |

### 2.2 只是等级标高了（4 个）

义项和 CEFR 一致，只是词光把难度标高了。按 CEFR 的等级学即可，别被标签吓到。

| 词头 | 词光等级 | 词光首义 | 入门级 | 说明 |
| --- | --- | --- | --- | --- |
| golden | B2 | adj. 金色的 | A2 | 首义与 EVP 一致（METAL / COLOUR），只是等级标高了。 |
| rap | B2 | n. 说唱音乐 | A2 | 义项一致，只是等级标高了。 |
| slim | B1 | adj. 苗条的 | A1 | 义项一致，只是等级标高了。 |
| crisp | B2 | adj. 脆的 | A2 | 义项一致，只是等级标高了。 |

---

## 3. 等级差 2 级及以上：328 个词

其中 **319 个是「词光标低」**——你按更低的等级背了它，CEFR 认为要到更高等级才算掌握。这不是让你重背，而是提示：你只掌握了它最基础的一面。其余 9 个是上一节的反向情况。

常见原因有三类，看表时留意：

- **词光收的是另一个义项**：`cookie` 词光按美式「饼干」标 A2，EVP 英式只收 C2 的「曲奇」；
- **CEFR 只收某个固定搭配**：`crying` 在 EVP 里只有 `be crying out for sth`（C2）；
- **词光把词元拆开了**：`clothing`、`learning`、`saving` 这类 -ing 名词单独成条，CEFR 按词族计。

下表按 **CEFR 入门级** 分组，每级按词频排序；只列高频的，完整 328 条见 CSV。

### 入门级 B1（16 个）

| 词头 | 词光等级 | 入门义项 | 词性 | 全区间 | 词频 |
| --- | --- | --- | --- | --- | ---: |
| lady | A1 | — | noun | B1 | 479 |
| feeling | A1 | EMOTION | noun | B1/B2 | 553 |
| personal | A1 | RELATING TO A PERSON | adjective | B1 | 912 |
| relax | A1 | BECOME HAPPY | verb | B1/C1 | 919 |
| smell | A1 | USE NOSE | verb | B1/B2 | 968 |
| smile | A1 | — | verb | B1 | 1,190 |
| pants | A1 | — | noun | B1 | 1,373 |
| delicious | A1 | — | adjective | B1 | 2,018 |
| writer | A1 | — | noun | B1 | 2,549 |
| tiger | A1 | — | noun | B1 | 2,693 |
| gym | A1 | EXERCISES | noun | B1 | 2,992 |
| strawberry | A1 | — | noun | B1 | 7,907 |
| rainy | A1 | — | adjective | B1 | 9,557 |
| toothpaste | A1 | — | noun | B1 | 11,792 |
| alphabet | A1 | — | noun | B1 | 12,664 |
| giraffe | A1 | — | noun | B1 | 13,464 |

### 入门级 B2（25 个）

| 词头 | 词光等级 | 入门义项 | 词性 | 全区间 | 词频 |
| --- | --- | --- | --- | --- | ---: |
| cause | A2 | REASON WHY | noun | B2/C1/C2 | 555 |
| lower | A2 | MOVE | verb | B2 | 1,966 |
| sale | A2 | SELL | noun | B2 | 2,419 |
| learning | A2 | — | noun | B2 | 2,513 |
| tail | A2 | ANIMAL | noun | B2/C2 | 2,607 |
| task | A2 | — | noun | B2 | 2,698 |
| nail | A2 | METAL | noun | B2 | 3,261 |
| naughty | A2 | — | adjective | B2 | 3,809 |
| tool | A2 | MAKE/REPAIR | noun | B2/C1 | 4,294 |
| cherry | A2 | — | noun | B2 | 4,436 |
| clothing | A2 | — | noun | B2 | 4,525 |
| bench | A2 | — | noun | B2 | 4,762 |
| subway | A2 | — | noun | B2 | 5,171 |
| cloth | A2 | MATERIAL | noun | B2 | 5,646 |
| sadly | A2 | NOT HAPPY | adverb | B2 | 6,001 |
| mother-in-law | A2 | — | noun | B2 | 7,493 |
| father-in-law | A2 | — | noun | B2 | 7,816 |
| gardener | A2 | — | noun | B2 | 8,032 |
| bakery | A2 | — | noun | B2 | 8,663 |
| crocodile | A2 | — | noun | B2 | 9,430 |
| pancake | A2 | — | noun | B2 | 11,118 |
| zebra | A2 | — | noun | B2 | 12,535 |
| gardening | A2 | — | noun | B2 | 12,577 |
| pyjamas | A2 | — | noun | B2 | 16,393 |
| non-smoking | A2 | — | adjective | B2 | 40,909 |

### 入门级 C1（32 个）

| 词头 | 词光等级 | 入门义项 | 词性 | 全区间 | 词频 |
| --- | --- | --- | --- | --- | ---: |
| bet | B1 | — | verb | C1/C2 | 654 |
| suppose | A2 | LIKELY | verb | C1 | 765 |
| lay | B1 | — | phrasal verb | C1 | 1,370 |
| scare | B1 | FRIGHTEN | verb | C1/C2 | 2,002 |
| saving | B1 | LESS MONEY | noun | C1 | 2,062 |
| march | B1 | — | noun | C1/C2 | 2,164 |
| campaign | B1 | ACTIVITIES | noun | C1 | 2,464 |
| tank | B1 | VEHICLE | noun | C1/C2 | 2,616 |
| hop | B1 | MOVE QUICKLY | verb | C1/C2 | 3,632 |
| assignment | B1 | — | noun | C1 | 3,917 |
| nap | B1 | — | noun | C1 | 4,505 |
| quote | B1 | REPEAT | verb | C1/C2 | 4,794 |
| coal | B1 | FUEL | noun | C1 | 4,937 |
| compliment | B1 | — | verb | C1/C2 | 5,035 |
| appetite | B1 | FOOD | noun | C1 | 5,046 |
| bubble | B1 | — | noun | C1/C2 | 5,289 |
| journal | B1 | MAGAZINE | noun | C1/C2 | 5,583 |
| pony | B1 | — | noun | C1 | 5,749 |
| straw | B1 | — | noun | C1/C2 | 6,162 |
| lounge | B1 | — | noun | C1 | 6,730 |
| vest | B1 | UNDERWEAR | noun | C1 | 6,771 |
| workshop | B1 | — | noun | C1 | 7,254 |
| transportation | B1 | — | noun | C1 | 7,798 |
| pyramid | B1 | — | noun | C1 | 8,143 |
| mat | B1 | — | noun | C1 | 8,515 |
| chilly | B1 | — | adjective | C1 | 8,801 |
| workplace | B1 | — | noun | C1 | 11,984 |
| historian | B1 | — | noun | C1 | 13,442 |
| listener | B1 | — | noun | C1 | 14,631 |
| trainee | B1 | — | noun | C1 | 15,210 |
| similarly | B1 | — | adverb | C1 | 18,165 |
| newsletter | B1 | — | noun | C1 | 23,950 |

### 入门级 C2（246 个，列前 40）

| 词头 | 词光等级 | 入门义项 | 词性 | 全区间 | 词频 |
| --- | --- | --- | --- | --- | ---: |
| crying | B1 | — | phrasal verb | C2 | 892 |
| narrator | B2 | — | noun | C2 | 1,197 |
| commander | B2 | — | noun | C2 | 1,396 |
| goodness | B2 | — | noun | C2 | 1,925 |
| suck | B2 | — | verb | C2 | 2,014 |
| mercy | B2 | KINDNESS | noun | C2 | 2,110 |
| prime | B2 | MAIN | adjective | C2 | 2,191 |
| sin | B2 | RELIGION | noun | C2 | 2,458 |
| flesh | B2 | BODY | noun | C2 | 2,642 |
| pathetic | B2 | BAD | adjective | C2 | 2,790 |
| siren | B2 | — | noun | C2 | 2,840 |
| surrender | B2 | — | verb | C2 | 2,991 |
| skull | B2 | — | noun | C2 | 3,024 |
| crystal | B2 | GLASS | noun | C2 | 3,102 |
| lad | B2 | — | noun | C2 | 3,104 |
| motion | B2 | MOVEMENT | noun | C2 | 3,116 |
| chill | B2 | COLD | noun | C2 | 3,201 |
| spit | B2 | — | verb | C2 | 3,202 |
| nerve | B2 | PART OF THE BODY | noun | C2 | 3,209 |
| conscience | B2 | — | noun | C2 | 3,295 |
| pit | B2 | — | noun | C2 | 3,365 |
| pat | B2 | — | verb | C2 | 3,492 |
| snap | B2 | BREAK | verb | C2 | 3,542 |
| sneak | B2 | — | phrase | C2 | 3,648 |
| pole | B1 | — | noun | C2 | 3,729 |
| core | B2 | IMPORTANT PART | noun | C2 | 3,776 |
| warehouse | B2 | — | noun | C2 | 3,872 |
| hostage | B2 | PERSON | noun | C2 | 3,873 |
| fraud | B2 | CRIME | noun | C2 | 3,904 |
| throne | B2 | — | phrase | C2 | 3,965 |
| wicked | B2 | — | adjective | C2 | 3,971 |
| combat | B2 | — | noun | C2 | 4,075 |
| weed | B2 | — | noun | C2 | 4,080 |
| barn | B2 | — | noun | C2 | 4,092 |
| cookie | A2 | — | noun | C2 | 4,160 |
| nest | B1 | BIRDS | noun | C2 | 4,183 |
| medication | B2 | — | noun | C2 | 4,189 |
| tire | B1 | BECOME TIRED | verb | C2 | 4,411 |
| retreat | B2 | — | verb | C2 | 4,498 |
| alliance | B2 | — | noun | C2 | 4,523 |

> 其余 206 个见 `learner-patch.csv`（`type=fix`、`cefr_level=C2`、`note=severe`）。

---

## 4. 该补的词

词光未收录、CEFR 收录的单词共 1,502 个。按优先级分三块。

### 4.1 高频核心缺口（COCA 前 1,000，16 个）

这些不是生僻词，是最常用的词。缺了会直接卡住听说读写。

| 词头 | 入门义项 | 词性 | 入门级 | 词频 | 备注 |
| --- | --- | --- | --- | ---: | --- |
| go | MOVE/TRAVEL | verb | A1 | 47 | 基础移动动词 |
| work | PLACE / JOB | noun | A1 | 151 | 兼动词与名词 |
| happy | PLEASED | adjective | A1 | 296 | 核心形容词 |
| part | PIECE | noun | A1 | 380 | 兼名词与动词 |
| page | PAPER | noun | A1 | 709 |  |
| thank | — | verb | A2 | 131 | `thank you` 是 A1 |
| check | EXAMINE | verb | A2 | 410 | 兼名词 |
| song | — | noun | A2 | 679 |  |
| deep | TOP TO BOTTOM | adjective | A2 | 900 | 兼形容词与副词 |
| search | — | verb | B1 | 1,106 | 兼名词与动词 |
| likely | — | adjective | B1 | 1,899 |  |
| entire | — | adjective | B2 | 814 |  |
| religious | PERSON / OF RELIGION | adjective | B2 | 887 |  |
| reveal | TELL | verb | B2 | 930 |  |
| trial | IN COURT | noun | B2 | 1,460 |  |
| federal | — | adjective | — | 494 | EVP 未收，按 B2 处理 |

### 4.2 学术词缺口（AWL 570 词族中缺 46 族）

雅思写作最直接的缺口，子表数字越小越核心。括号内是该词在 EVP 的入门级（`—` 表示 EVP 未收）。

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

| 词头 | 入门义项 | 词性 | 词频 |
| --- | --- | --- | ---: |
| go | MOVE/TRAVEL | verb | 47 |
| well | IN A GOOD WAY | adverb | 59 |
| two | NUMBER | number | 133 |
| work | PLACE | noun | 151 |
| dad | — | noun | 221 |
| three | — | number | 231 |
| happy | PLEASED | adjective | 296 |
| part | PIECE | noun | 380 |
| five | — | number | 397 |
| six | — | number | 546 |
| past | TIME | preposition | 596 |
| cannot | — | modal verb | 605 |
| ten | — | number | 620 |
| goodbye | — | exclamation | 728 |
| seven | — | number | 788 |
| eight | — | number | 895 |
| sad | — | adjective | 956 |
| mum | — | noun | 970 |
| beer | — | noun | 1,080 |
| page | PAPER | noun | 1,860 |
| twenty | NUMBER | number | 2,411 |
| fifteen | — | number | 3,877 |
| zoo | — | noun | 4,303 |
| eleven | — | number | 4,903 |
| thirteen | — | number | 7,790 |
| fourteen | — | number | 8,020 |
| nineteen | — | number | 11,511 |

#### A2（53 个）

| 词头 | 入门义项 | 词性 | 词频 |
| --- | --- | --- | ---: |
| thank | — | verb | 131 |
| while | DURING | conjunction | 311 |
| check | EXAMINE | verb | 410 |
| mine | — | pronoun | 421 |
| himself | REFLEXIVE | pronoun | 585 |
| luck | CHANCE | noun | 616 |
| song | — | noun | 679 |
| deep | TOP TO BOTTOM | adjective | 900 |
| girlfriend | ROMANCE | noun | 966 |
| boyfriend | — | noun | 1,012 |
| themselves | REFLEXIVE | pronoun | 1,151 |
| herself | REFLEXIVE | pronoun | 1,198 |
| itself | REFLEXIVE | pronoun | 1,302 |
| grandma | — | noun | 1,429 |
| pack | — | verb | 1,537 |
| grandpa | — | noun | 1,550 |
| carefully | — | adverb | 2,046 |
| champagne | — | noun | 2,338 |
| daily | EVERY DAY | adjective | 2,806 |
| fifth | — | number | 2,959 |
| fifty | — | number | 3,530 |
| granny | — | noun | 3,833 |
| sixth | — | number | 4,693 |
| photographer | — | noun | 4,727 |
| good-looking | — | adjective | 5,707 |
| disco | — | noun | 6,634 |
| cheque | — | noun | 6,954 |
| granddad | — | noun | 7,770 |
| lemonade | — | noun | 7,863 |
| hip-hop | — | noun | 7,930 |
| mosque | — | noun | 8,792 |
| eighty | — | number | 11,699 |
| motorbike | — | noun | 11,869 |
| grandchild | — | noun | 12,695 |
| seventy | — | number | 13,000 |
| ninety | NUMBER | number | 13,012 |
| right-hand | — | adjective | 13,101 |
| singular | — | adjective | 16,464 |
| pence | — | noun | 16,745 |
| omelette | — | noun | 18,080 |
| plural | — | noun | 19,768 |
| verb | — | noun | 21,020 |
| policewoman | — | noun | 23,569 |
| businesswoman | — | noun | 24,398 |
| footballer | — | noun | 25,094 |
| kilogram | — | noun | 36,902 |
| salesperson | — | noun | 40,786 |
| washing-up | — | noun | 47,925 |
| headteacher | — | noun | 榜外 |
| let's | — | phrase | 榜外 |
| penfriend | — | noun | 榜外 |
| schoolchild | — | noun | 榜外 |
| superlative | — | noun | 榜外 |

#### B1（91 个，列前 50）

| 词头 | 入门义项 | 词性 | 词频 |
| --- | --- | --- | ---: |
| seriously | BADLY | adverb | 807 |
| whether | IF | conjunction | 916 |
| killer | — | noun | 950 |
| quit | STOP WORK | verb | 1,047 |
| search | TRY TO FIND | verb | 1,106 |
| somehow | WAY NOT KNOWN | adverb | 1,464 |
| likely | — | adjective | 1,899 |
| cancer | — | noun | 1,940 |
| particularly | — | adverb | 2,870 |
| lightning | — | noun | 3,656 |
| safely | — | adverb | 3,757 |
| baker | — | noun | 4,055 |
| broad | WIDE | adjective | 4,600 |
| breast | — | noun | 4,692 |
| teenage | — | adjective | 4,876 |
| kindly | — | adverb | 4,919 |
| fry | — | verb | 5,007 |
| secretly | — | adverb | 5,281 |
| forehead | — | noun | 5,699 |
| leaf | PLANT | noun | 5,736 |
| beautifully | — | adverb | 6,238 |
| rider | — | noun | 6,959 |
| keeper | LOOKING AFTER | noun | 7,156 |
| camel | — | noun | 7,566 |
| aspirin | — | noun | 7,889 |
| fax | — | verb | 8,063 |
| surprisingly | — | adverb | 8,094 |
| juicy | WITH JUICE | adjective | 8,415 |
| kitten | — | noun | 8,455 |
| nightclub | — | noun | 8,510 |
| server | — | noun | 8,513 |
| briefly | — | adverb | 8,914 |
| disc | RECORDING | noun | 9,492 |
| unemployment | — | noun | 10,318 |
| examiner | — | noun | 10,867 |
| underpants | — | noun | 11,040 |
| babysit | — | verb | 11,754 |
| animation | — | noun | 11,780 |
| middle-aged | — | adjective | 11,865 |
| amazingly | — | adverb | 12,217 |
| diver | — | noun | 12,266 |
| knickers | — | noun | 12,983 |
| politely | — | adverb | 13,339 |
| swimmer | — | noun | 13,457 |
| dangerously | — | adverb | 13,484 |
| bravely | — | adverb | 14,182 |
| accurately | — | adverb | 14,416 |
| passive | GRAMMAR | adjective | 14,470 |
| unimportant | — | adjective | 14,859 |
| sweatshirt | — | noun | 17,601 |

> 其余 41 个见 CSV（`type=add`、`cefr_level=B1`）。

#### B2（474 个，列前 20）

| 词头 | 入门义项 | 词性 | 词频 |
| --- | --- | --- | ---: |
| known | FAMILIAR | adjective | 643 |
| darling | — | noun | 707 |
| weird | — | adjective | 724 |
| entire | — | adjective | 814 |
| bloody | COVERED IN BLOOD | adjective | 1,001 |
| stuck | NOT MOVE | adjective | 1,081 |
| mission | PURPOSE | noun | 1,164 |
| heaven | AFTER LIFE | noun | 1,166 |
| witness | — | noun | 1,232 |
| beg | VERY POOR | verb | 1,381 |
| justice | FAIRNESS | noun | 1,394 |
| devil | EVIL BEING | noun | 1,400 |
| trial | IN COURT | noun | 1,460 |
| aware | — | adjective | 1,642 |
| command | ORDER | noun | 1,649 |
| settle | LIVE | verb | 1,719 |
| naked | NO CLOTHES | adjective | 1,802 |
| revenge | — | noun | 1,897 |
| liar | — | noun | 1,944 |
| sexy | — | adjective | 2,082 |

> 其余 454 个见 CSV（`type=add`、`cefr_level=B2`）。

#### C1（398 个，列前 20）

| 词头 | 入门义项 | 词性 | 词频 |
| --- | --- | --- | ---: |
| fake | — | adjective | 1,566 |
| witch | — | noun | 2,334 |
| sacrifice | — | noun | 2,440 |
| empire | BUSINESSES | noun | 2,550 |
| glory | PRAISE | noun | 2,623 |
| alert | — | adjective | 2,677 |
| saint | — | noun | 2,696 |
| aboard | — | adverb | 2,974 |
| trigger | — | verb | 3,143 |
| officially | — | adverb | 3,296 |
| pulse | — | noun | 3,473 |
| technically | SCIENCE/INDUSTRY | adverb | 3,552 |
| walker | — | noun | 3,669 |
| junk | — | noun | 3,679 |
| serial | — | adjective | 3,777 |
| foundation | START | noun | 4,065 |
| rocky | WITH ROCKS | adjective | 4,139 |
| palm | TREE | noun | 4,184 |
| scan | READ | verb | 4,569 |
| personnel | — | noun | 4,654 |

> 其余 378 个见 CSV（`type=add`、`cefr_level=C1`）。

#### C2（459 个，列前 15）

| 词头 | 入门义项 | 词性 | 词频 |
| --- | --- | --- | ---: |
| squad | — | noun | 2,522 |
| trash | — | noun | 2,586 |
| custody | CHILD | noun | 2,705 |
| virgin | — | noun | 2,739 |
| crush | CROWD | noun | 2,994 |
| corpse | — | noun | 3,622 |
| trauma | — | noun | 3,755 |
| resistance | DISAGREE | noun | 3,790 |
| buzz | EXCITEMENT | noun | 3,980 |
| patch | AREA | noun | 4,127 |
| forgiveness | — | noun | 4,341 |
| raid | SOLDIERS | noun | 4,835 |
| fist | — | noun | 4,909 |
| blackmail | — | noun | 4,978 |
| ritual | — | noun | 5,001 |

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
- **入门义项**取该词在 EVP 中等级最低的那条义项，只统计词头与词光完全相同的条目，不借用短语条目的等级。EVP 的义项用 guideword 区分、逐条定级，**没有词典式的释义顺序**，所以「入门义项」不是「第一个释义」。
- **缺词**已剔除：功能词、屈折形（things / working）、拼写变体（color / center）、专有名词、感叹词与缩写。
- 词频来自 OpenSubtitles 50k 语料；「榜外」表示不在前 5 万。

> 完整数据：`learner-patch.csv` —— 2,210 条等级修正（`type=fix`）+ 1,502 条补充词（`type=add`），含词头、词光首义、入门义项、词性、等级、词频。

