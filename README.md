<div align="center">

<a href="https://0xlei.tech/words/"><img src="docs/assets/cover-v2.jpg" alt="词光 Word Atlas — 一词一画，点亮雅思" width="100%"></a>

# 词光 · Word Atlas

**把单词变成画面，让复习有迹可循。**

7,298 个雅思词条 · 原创插画 · 英美发音 · FSRS 间隔复习

[**立即体验 ↗**](https://0xlei.tech/words/)　 /　 [48 秒介绍](docs/assets/launch.mp4)　 /　 [下载词库](data/)　 /　 [English](README.en.md)

[![Code: MIT](https://img.shields.io/badge/Code-MIT-17283B?style=flat-square)](LICENSE)
[![Dataset: CC BY 4.0](https://img.shields.io/badge/Dataset-CC_BY_4.0-AD5038?style=flat-square)](CONTENT_LICENSE.md)

<br>

**词光 iOS App 测试版已开放，免费下载：[api.billswise.cn/app](https://api.billswise.cn/app/)**

[![关注 @yangleiocx3](https://img.shields.io/badge/%E5%85%B3%E6%B3%A8%E6%88%91-@yangleiocx3-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/yangleiocx3)

### 请我喝杯咖啡

这个项目开源，又免费，我自己投了很多钱和时间。觉得有用的话，请我喝杯咖啡吧。

<table><tr><td align="center"><img src="docs/assets/sponsor/wechatpay.png" width="240" alt="微信赞助二维码"><br>微信</td><td align="center"><img src="docs/assets/sponsor/alipay.png" width="240" alt="支付宝赞助二维码"><br>支付宝</td></tr></table>

</div>

---

词光是一款以插画和语境为核心的雅思背词应用。看画面理解词义，听发音建立联系，再用主动回忆和间隔复习巩固记忆。无需账号，学习进度保存在自己的设备上。

> **版本说明**：这个仓库提供词光的开源基础版及配套数据集。在线网站独立迭代，功能与仓库可能不同；仓库里的代码和内容分别遵循下方的 MIT / CC BY 4.0 授权。

[产品预览](#产品预览) · [学习方式](#学习方式) · [本地运行](#本地运行) · [开放数据](#开放数据) · [参与贡献](#参与贡献)

## 产品预览

### 一本可以听、可以练的单词图鉴

<img src="docs/assets/atlas-desktop.jpg" alt="开源版桌面图鉴：插画词卡和词汇浏览" width="100%">

<table>
<tr>
<td width="50%"><img src="docs/assets/today-mobile.jpg" alt="手机端今日学习页" width="100%"></td>
<td width="50%"><img src="docs/assets/word-mobile.jpg" alt="手机端词卡，展示插画、英美发音与例句" width="100%"></td>
</tr>
<tr><td align="center">每日计划，把注意力放在今天</td><td align="center">插画、词义、发音，在一张词卡里</td></tr>
</table>

<sub>以上为仓库开源版的实际界面。页首为品牌概念插画。</sub>

### 学过的词，汇成自己的星图

<img src="docs/assets/galaxy.jpg" alt="词汇星图界面：按话题组织单词，展示学习进度" width="100%">

19 个话题组成词汇星图。拖动旋转、滚动缩放，点击星星打开词卡；学习状态用不同亮度呈现。采用 WebGL2 渲染，不支持的设备提供降级显示。

<details>
<summary><b>看 48 秒宣传片</b></summary>

<a href="docs/assets/launch.mp4"><img src="docs/assets/launch-preview.webp" alt="点击观看词光宣传片" width="100%"></a>

[播放完整视频（含声音）](docs/assets/launch.mp4)

</details>

## 学习方式

| 环节 | 你会做什么 |
| :--- | :--- |
| **看见** | 每个词配一幅插画、中英释义、两条原创例句，以及搭配、词族和用法提示。 |
| **听见** | 切换英音、美音，听日常例句朗读；部分词条另含第二条例句录音。 |
| **想起** | 看义选词、看图补句、听音辨词、拼写，逐步练习主动回忆。 |
| **复习** | FSRS 根据学习记录安排复习，目标记忆率可调。只有首次作答计入正确率。 |
| **积累** | 星图展示学习进度；打字练习独立统计；支持导出和恢复本地进度。 |

**本地优先。** 无需注册；看过的词条与媒体可缓存供离线使用。换设备前，请先导出进度备份。

<details>
<summary><b>听发音、例句与环境声样本</b></summary>



拿 *abandon* 举例，点开就能听（在线播放）：

| | |
|---|---|
| 🇬🇧 英音 | [abandon /əˈbændən/](https://0xlei.tech/words/atlas/audio/uk/abandon.mp3) |
| 🇺🇸 美音 | [abandon /əˈbændən/](https://0xlei.tech/words/atlas/audio/us/abandon.mp3) |
| 📖 例句朗读 | [We had to abandon our car in the snow.](https://0xlei.tech/words/atlas/audio/ex/abandon.mp3) |

全部 7,298 个词都有英音、美音和例句朗读，还有 1,011 个重点词的第二条例句也配了朗读。

### 环境声与交互声音

| | |
|---|---|
| 🎙 **开屏配音** | [「欢迎打开雅思大门」](https://0xlei.tech/words/sfx/splash-voice.mp3)：星尘汇聚成“词光”，大门打开 |
| 🌌 **星图配音** | [「这是你的词汇星图。每学会一个词，就点亮一颗星。」](https://0xlei.tech/words/sfx/voice-galaxy-hello.mp3) |
| 🎵 **星空音乐** | [一段可无缝循环的原创配乐](https://0xlei.tech/words/sfx/amb-stars.mp3)，默认陪你背词 |
| 🌧 **6 段环境声** | [雨天图书馆](https://0xlei.tech/words/sfx/amb-rain.mp3) · [清晨海岸](https://0xlei.tech/words/sfx/amb-sea.mp3) · [林间早晨](https://0xlei.tech/words/sfx/amb-forest.mp3) · [夜晚壁炉](https://0xlei.tech/words/sfx/amb-fire.mp3) · [远航船舱](https://0xlei.tech/words/sfx/amb-voyage.mp3) · [安静咖啡馆](https://0xlei.tech/words/sfx/amb-cafe.mp3) |
| ✨ **界面音效** | 答对、答错、翻卡、打字、连胜、点亮星星……每个操作都有自己的声音；读单词时背景音会自动压低 |

全部素材都在仓库里：插画在 `public/atlas/img/`，录音在 `public/atlas/audio/`，这两类按 CC BY 4.0 开放；界面声音和配乐在 `public/sfx/`，随应用一起提供。


</details>

## 本地运行

需要 **Node.js 20+** 和 npm。仓库含完整图片与录音，首次下载可能较久。

```bash
git clone --depth 1 https://github.com/designfuchen/word-atlas.git
cd word-atlas
npm ci
npm run dev
```

打开 **http://localhost:5188**。

```bash
npm test             # 单元测试
npm run check:atlas  # 词库结构与媒体校验
npm run build        # 构建到 dist/
```

子路径部署：`ATLAS_BASE=/words/ npm run build`。完整说明见 [部署文档](docs/deployment.md)。

**技术栈**：React 19 · TypeScript · Vite · ts-fsrs · WebGL2

## 开放数据

不仅可以直接使用应用，也可以把词库用于自己的学习工具、Anki 牌组或研究项目。

| 资源 | 开源版内容 | 入口 |
| :--- | :--- | :--- |
| 词条 | **7,298** 条，CEFR A1–C2、19 个话题 | [JSON](data/word-atlas.json) · [CSV](data/word-atlas.csv) |
| 例句 | **14,596** 条，日常与雅思语境，附中文翻译 | [字段说明](docs/dataset.md) |
| 插画 | **7,298** 幅，512 px WebP，另有缩略图 | [图片目录](public/atlas/img/) |
| 录音 | **22,905** 段，英音、美音与例句朗读 | [音频目录](public/atlas/audio/) |

```python
import json
from pathlib import Path

words = json.loads(Path("data/word-atlas.json").read_text(encoding="utf-8"))
b2_environment = [w for w in words if w["cefr"] == "B2" and w["topic"] == "environment"]
```

<details>
<summary><b>查看一条词条的数据结构</b></summary>

```json
{
  "id": "principle",
  "w": "principle",
  "uk": "/ˈprɪnsəpəl/",
  "us": "/ˈprɪnsəpəl/",
  "senses": [{ "pos": "n.", "zh": "原则；行为准则", "en": "A belief or rule that guides decisions and behaviour." }],
  "ex": [
    { "en": "I refused the extra money as a matter of principle.", "zh": "出于原则，我拒绝了那笔额外的钱。" },
    { "en": "The principle of equal opportunity should guide policies designed to improve access to higher education.", "zh": "…" }
  ],
  "col": ["in principle｜原则上", "basic principle｜基本原则"],
  "fam": ["principled (adj.)"],
  "tip": "principle 是原则；principal 是校长、主要的。",
  "cefr": "B2",
  "topic": "thinking"
}
```

</details>

### 内容来源与局限

释义、例句、插画和录音为本项目生成：文字与插画使用生成式 AI，语音使用 ElevenLabs。内容经过自动结构与一致性校验，**尚未逐条人工审校**，可能出现释义、例句、插画或发音错误。它不是官方雅思词表，也不承诺提分。

[内容生成流程](docs/pipeline.md) · [记忆模型](docs/learning-model.md) · [生成脚本](scripts/atlas/)

## 参与贡献

发现问题时，请附上**词条 ID、复现步骤和预期结果**。内容纠错如有词典或其他可靠依据，也请一并提供。

- [报告问题](https://github.com/designfuchen/word-atlas/issues/new/choose)：词条纠错、界面问题或使用建议。
- [贡献指南](CONTRIBUTING.md)：数据同步、代码规范和提交前检查。
- [安全政策](SECURITY.md)：安全问题的反馈方式。

## 授权

| 范围 | 许可 |
| :--- | :--- |
| 应用代码 | [MIT](LICENSE) |
| 词库文本、插画与词条录音 | [CC BY 4.0](CONTENT_LICENSE.md)，署名 Word Atlas contributors（词光） |
| 第三方依赖与字体 | 遵循各自许可，详见相应文件 |

---

由 [@designfuchen](https://github.com/designfuchen) 制作。产品进展与制作过程见 [X · @yangleiocx3](https://x.com/yangleiocx3)。

如果词光对你有用，欢迎 Star，或把它分享给正在学英语的朋友。
