# 内容授权 / Content license

## 代码 / Code

源代码与界面设计采用 [MIT License](LICENSE)。依赖包保留各自授权；Fraunces 字体为 SIL Open Font License 1.1。

Source code and UI design are under the [MIT License](LICENSE). Dependencies keep their own licenses; the Fraunces typeface is under the SIL Open Font License 1.1.

## 词库内容、插画与录音 / Dataset, illustrations and recordings

以下内容以 **[Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/)** 提供，在项目维护者能够授予的权利范围内：

- `data/` 下的词库文件，以及 `public/atlas/index.json`、`public/atlas/entries/` 中的释义、英文释义、例句、译文、搭配、词族、近反义词、提示、分级与分类；
- `public/atlas/img/`、`public/atlas/thumb/`、`public/brand/` 中的插画；
- `public/atlas/audio/` 中的发音与例句录音。

The material above is offered under CC BY 4.0, to the extent of the rights the maintainers can grant.

**署名 / Attribution:** `Word Atlas contributors — CC BY 4.0`，并附授权链接，说明是否做过修改。

### 说明 / Notes

- 单个英文单词与通用词表本身不主张专有权。This project claims no exclusive rights over English words or the bare headword list.
- 内容由 AI 模型按项目规范生成（文本：大语言模型；插画：图像模型；录音：ElevenLabs 合成语音），经过自动校验，未逐条人工审校，按现状提供，不作准确性担保。Content was generated with AI models under the project's specifications, checked automatically, not proofread entry by entry, and is provided as-is without warranty.
- 录音授权只涉及这些完成的音频文件，不包含底层声音模型、声音身份或任何人的肖像、人格权，也不表示声音提供方为本项目背书。英音声音为 ElevenLabs “Alice”，美音为 “Sarah”。The recording license covers the finished audio files only, not the underlying voice models or voice identities, and implies no endorsement. Voices: ElevenLabs "Alice" (UK) and "Sarah" (US).
- 不是官方雅思（IELTS）词表，与雅思考试主办方无关。Not an official IELTS list and not affiliated with the IELTS partners.

## 诗词内容 / Poetry content

`data/poetry.json` 与 `public/poetry/` 中的诗词数据整理自 [chinese-poetry](https://github.com/chinese-poetry/chinese-poetry)（MIT 许可证，全文见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)）。各部分的权利状况不同：

- **古诗原文**：唐代作品，属于公版。校对出的版本差异和上游的录入错误不在此列，见下面的说明。
- **本项目新增的整理**：拆句、逐字拼音（含读音修正表）、体裁与题材归类、学习顺序，按 CC BY 4.0 提供，署名 `Word Atlas contributors — CC BY 4.0`。
- **白话大意**：上游《水墨唐诗》的 `prologue` 字段没有说明作者和授权，所以本仓库的数据里没有收录它（`gist` 字段为空）。
- 内容未逐首人工审校。上游文本有录入错误，拼音由程序生成，只修正了少数确定的读音，按现状提供，不作准确性担保。

The poem texts are Tang-dynasty works in the public domain. The sentence splitting, per-character pinyin, form and theme grouping and learning order added here are offered under CC BY 4.0. The plain-language summaries in the upstream data have no stated author or license and are therefore not included (`gist` is empty). The data is not proofread; the upstream text contains typos and the pinyin is machine-generated with a small table of corrections. Provided as-is without warranty.
