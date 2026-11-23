# 词光补丁清单

> 词表本身不更新，靠自学补。只回答三件事：**等级怎么换算、哪些词背反了、还缺哪些词**。
> 依据 EVP 全量比对（15,696 条义项，见 `AUDIT-REPORT.md`）；逐词数据见 `learner-patch.csv`。
>
> 先分清四样东西：**释义**是这条义项的意思（英文原句）；**义项标记**（guideword）是 EVP 给义项起的分类名（如 `FRIED FOOD`），不是意思；**词性**是 noun / verb 这类；**等级**是 A1–C2。
>
> 两个词：**词光首义** = 词光自己列的第一条；**入门义** = CEFR 认为这个词最早该会的那组义项（按释义算）。两者不一致，才需要按第 2 节改。

## 先做这三件事

1. **等级往上算半级**：B2 按 C1 准备，C1 按 C2。
2. **看 9 个词的义项和等级**（第 2 节）——6 个要补入门义，3 个只是等级标错。
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

词光写的义项本身不算错，只是**不是 CEFR 认为最早该会的那个**——`chip` 更是完全没有「薯条」这一义。先把入门义补上。

| 词 | 词光等级 | 词光首义 | 入门义（EVP 释义） | 中文 | 怎么补 |
| --- | --- | --- | --- | --- | --- |
| chip | B2 | n. 芯片；集成电路 | a long thin piece of potato that is cooked in oil | 英式薯条 | 缺义：词光只有芯片 / 碎屑 / 碰掉 |
| bear | B2 | v. 忍受；承受；承担 | a large, strong, wild animal with thick fur | 熊 | 顺序：熊在第 2 条，词性也从动词变名词 |
| identification | B2 | n. 识别；鉴定 | an official document that shows or proves who you are | 身份证明 | 顺序：身份证明在第 2 条 |
| soul | B2 | n. 灵魂；心灵 | popular music which expresses deep feelings, originally… | 灵魂乐 | 顺序：灵魂乐在第 3 条 |
| comparative | B2 | adj. 比较的；对比的 | the form of an adjective or adverb that expresses a… | 比较级 | 顺序：比较级在第 3 条 |
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

| 词 | 词光 | CEFR | 入门义（EVP 释义） | 词性 | 词频 |
| --- | --- | --- | --- | --- | ---: |
| lady | A1 | B1 | a polite or old fashioned way of referring to or talking to a woman | noun | 479 |
| feeling | A1 | B1 | emotion<br>an idea that something is true or exists<br>when you feel something physical | noun | 553 |
| personal | A1 | B1 | relating to or belonging to a particular person<br>designed for or used by one person<br>relating to the private parts of someone's life, including their relationships or… | adjective | 912 |
| relax | A1 | B1 | to become happy and comfortable because nothing is worrying you, or to make someone do… | verb | 919 |
| smell | A1 | B1 | to notice something by using your nose<br>to have an unpleasant smell<br>the quality that something has which you notice by using your nose | verb<br>verb<br>noun | 968 |
| smile | A1 | B1 | to make a happy or friendly expression in which the corners of your mouth curve up<br>a happy or friendly expression in which the corners of your mouth curve up | verb<br>noun | 1,190 |
| pants | A1 | B1 | underwear that covers the bottom | noun | 1,373 |
| delicious | A1 | B1 | having a very pleasant taste or smell | adjective | 2,018 |
| writer | A1 | B1 | a person who writes books or articles to be published | noun | 2,549 |
| tiger | A1 | B1 | a large wild cat that has yellow fur with black lines on it | noun | 2,693 |
| gym | A1 | B1 | exercises done inside, especially as a school subject<br>a building or room with equipment for doing exercises | noun | 2,992 |
| strawberry | A1 | B1 | a small, red fruit with a green leaf at the top and small, brown seeds on its surface | noun | 7,907 |
| rainy | A1 | B1 | raining a lot | adjective | 9,557 |
| toothpaste | A1 | B1 | a substance that you use to clean your teeth | noun | 11,792 |
| alphabet | A1 | B1 | a set of letters arranged in a fixed order which is used for writing a language | noun | 12,664 |
| giraffe | A1 | B1 | a large African animal with a very long neck and long legs | noun | 13,464 |
| cause | A2 | B2 | the reason why something, especially something bad, happens<br>to make something happen, especially something bad | noun<br>verb | 555 |
| lower | A2 | B2 | to move something into a low position<br>to reduce the amount or level of something | verb | 1,966 |
| sale | A2 | B2 | the act of selling something, or the time when something is sold | noun | 2,419 |
| learning | A2 | B2 | the process of getting knowledge or a new skill | noun | 2,513 |
| tail | A2 | B2 | the long, narrow part that sticks out at the back of an animal's body | noun | 2,607 |
| task | A2 | B2 | a piece of work, especially something unpleasant or difficult | noun | 2,698 |
| nail | A2 | B2 | a thin piece of metal with a sharp end, used to join pieces of wood together<br>the hard surface at the end of your fingers and toes | noun | 3,261 |
| naughty | A2 | B2 | When children are naughty, or their behaviour is naughty, they behave badly. | adjective | 3,809 |
| tool | A2 | B2 | a piece of equipment that you use with your hands in order to make or repair something<br>a thing that helps you to do a particular activity | noun | 4,294 |
| cherry | A2 | B2 | a small, round, soft red or black fruit with a single hard seed in the middle | noun | 4,436 |
| clothing | A2 | B2 | clothes, especially of a particular type | noun | 4,525 |
| bench | A2 | B2 | a long seat for two or more people, usually made of wood or metal | noun | 4,762 |
| subway | A2 | B2 | a passage under a road or railway for people to walk through | noun | 5,171 |
| cloth | A2 | B2 | material made from cotton, wool, etc. and used, for example, to make clothes or curtains<br>a small piece of material used for cleaning or drying things | noun | 5,646 |
| sadly | A2 | B2 | in an unhappy way<br>in a way that is not satisfactory | adverb | 6,001 |
| mother-in-law | A2 | B2 | the mother of your husband or wife | noun | 7,493 |
| father-in-law | A2 | B2 | the father of your husband or wife | noun | 7,816 |
| gardener | A2 | B2 | someone who works in a garden, growing plants and making it look attractive | noun | 8,032 |
| bakery | A2 | B2 | a place where bread, cakes, etc. are made or sold | noun | 8,663 |
| crocodile | A2 | B2 | a large reptile with a long mouth and sharp teeth, that lives in lakes and rivers | noun | 9,430 |
| pancake | A2 | B2 | a thin, flat food made from flour, milk, and egg mixed together and cooked in a pan | noun | 11,118 |
| zebra | A2 | B2 | an African animal like a horse with black and white lines | noun | 12,535 |
| gardening | A2 | B2 | the job or activity of growing a garden and keeping it attractive | noun | 12,577 |
| pyjamas | A2 | B2 | soft loose clothing which is worn in bed and consists of trousers and a type of shirt | noun | 16,393 |
| non-smoking | A2 | B2 | describes a place where people are not allowed to smoke | adjective | 40,909 |
| bet | B1 | C1 | to risk money on the result of a game, competition, etc. | verb | 654 |
| suppose | A2 | C1 | to think that something is likely to be true | verb | 765 |
| lay | B1 | C1 | — | — | 1,370 |
| scare | B1 | C1 | to frighten a person or animal | verb | 2,002 |
| saving | B1 | C1 | when you use or spend less money than you would usually have to | noun | 2,062 |
| march | B1 | C1 | an organized walk by a group to show that they disagree with something<br>to walk through a public place as a group to show that you disagree with something<br>When soldiers march, they walk together with regular steps. | noun<br>verb<br>verb | 2,164 |
| campaign | B1 | C1 | a series of organized activities or events intended to achieve a result<br>a series of military attacks<br>to organize a series of activities to try to achieve something | noun<br>noun<br>verb | 2,464 |
| tank | B1 | C1 | a large, strong military vehicle with a gun on it which moves on wheels inside large… | noun | 2,616 |
| hop | B1 | C1 | to go somewhere quickly or get into or out of a vehicle quickly | verb | 3,632 |
| assignment | B1 | C1 | a piece of work given to someone, especially as part of their studies or job | noun | 3,917 |
| nap | B1 | C1 | a short sleep | noun | 4,505 |
| quote | B1 | C1 | to repeat the words that someone else has said or written<br>to give a fact or example to support what you are saying | verb | 4,794 |
| coal | B1 | C1 | a hard, black substance that is dug from under the ground and burnt as fuel | noun | 4,937 |
| compliment | B1 | C1 | to praise or express admiration for someone | verb | 5,035 |
| appetite | B1 | C1 | the feeling that makes you want to eat | noun | 5,046 |
| bubble | B1 | C1 | a ball of air or gas with liquid around it | noun | 5,289 |
| journal | B1 | C1 | a magazine containing articles about a particular subject | noun | 5,583 |
| pony | B1 | C1 | a small horse | noun | 5,749 |
| straw | B1 | C1 | the long, dried stems of plants such as wheat, often given to animals for sleeping on… | noun | 6,162 |
| lounge | B1 | C1 | a room in a hotel, theatre, airport, etc. where people can relax or wait | noun | 6,730 |
| crying | B1 | C2 | — | — | 892 |
| narrator | B2 | C2 | the person who tells the story in a book, film, play, etc. | noun | 1,197 |
| commander | B2 | C2 | an officer who is in charge of a military operation, or an officer of middle rank in… | noun | 1,396 |
| goodness | B2 | C2 | the quality of being good | noun | 1,925 |
| suck | B2 | C2 | to have something in your mouth and use your tongue, lips, etc. to pull on it or to get… | verb | 2,014 |
| mercy | B2 | C2 | kindness that makes you forgive someone, usually someone that you have authority over | noun | 2,110 |
| prime | B2 | C2 | main or most important | adjective | 2,191 |
| sin | B2 | C2 | something which is against the rules of a religion<br>something that you should not do because it is morally wrong | noun | 2,458 |
| flesh | B2 | C2 | the soft part of a person's or animal's body between the skin and bones | noun | 2,642 |
| pathetic | B2 | C2 | showing no skill, effort, or bravery<br>sad and weak | adjective | 2,790 |

> C1 列了 20 个、C2 列了 10 个；其余 C1 12 个、C2 236 个在 CSV。

---

## 4. 要补的词

词光未收录、CEFR 收录的单词共 **1,502** 个。按优先级排。

### 4.1 最常用的 16 个（COCA 前 1,000）

这些不是生僻词，缺了会直接卡住听说读写。

| 词 | 中文（参考） | 等级 | 词频 |
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
- 第 3 节的「入门义」是 EVP 的**英文释义原句**（超过 88 字符截断），该等级有几条就列几条，词性单列并按行对应；`—` 表示 EVP 这条没有给定义。
- 词性列：该级义项词性都一样时只写一次；不一样时按行对应，如 `verb<br>verb<br>noun`。
- **义项标记**（guideword）不在正文表格里——它是分类名，62.7% 的入门记录没有，列出来大半是空白；需要时看 CSV 的 `evp_guidewords`。
- 未收录判定已剔除：功能词、屈折形、拼写变体、专有名词、感叹词。
- 词频来自 OpenSubtitles 50k；「榜外」= 不在前 5 万。

> 全部数据：`learner-patch.csv`（2,210 条等级修正 + 1,502 条补充词）。

