# 内容生成流程 / Content pipeline

所有脚本在 `scripts/atlas/`，凭据只从环境变量或仓库外目录读取（见 [SECURITY.md](../SECURITY.md)）。中间产物写入被 Git 忽略的 `.local/forge/`，可断点续跑。

1. **词头**：`.local/forge/headwords.json`，每项 `{hid, word, raw}`。`raw` 是可选的义项提示，只用于判断哪些义项重要，不会被复制进输出。
2. **词条文本** `gen_text.py`：每批 10 个词，按 [`gen_text.py`](../scripts/atlas/gen_text.py) 中的编写规范（准确优先、原创、两类例句、不编造词源、安全中立）生成 JSON。
3. **插画** `gen_images.py`：每个词条自带一个场景描述 `scene`，与统一画风提示词组合后生成 1024px 图片，压缩为 768px WebP 母版。按学习路线顺序生成。
4. **发音** `gen_word_audio.py`：ElevenLabs，英音 Alice、美音 Sarah。
5. **例句朗读** `gen_sentence_audio.py`：为 `ex[0]` 合成朗读，按学习路线顺序。
6. **编译** `build_atlas.py`：清洗字段、排序、切块，生成 `public/atlas/` 与 `data/`。
7. **校验** `npm run check:atlas`：结构、顺序、引用与媒体文件存在性。

```bash
export SUB2_BASE_URL=... SUB2_API_KEY=... ELEVENLABS_API_KEY=...
python3 scripts/atlas/gen_text.py --workers 8
python3 scripts/atlas/gen_images.py --workers 8 --follow
python3 scripts/atlas/gen_word_audio.py
python3 scripts/atlas/gen_sentence_audio.py --follow
python3 scripts/atlas/build_atlas.py
npm run check:atlas
```

`SUB2_BASE_URL` 指向任意 OpenAI 兼容的接口。

## 例句查词与补充插画

补充词卡独立存放于 `public/atlas/supplemental.json`，由应用与原词库一起加载，不改写原有词条。当前补充 1,295 张词卡，其中 335 张配有插画。词条的 `m` 图片标志与完整图、缩略图配对存在性一致。

- 完整图：`public/atlas/img/extra-<id>.webp`，512 × 512。
- 缩略图：`public/atlas/thumb/extra-<id>.webp`，256 × 256。
- 来源：内置 `image_gen` 生成，提示词、生成状态和原始 PNG 文件名记录于 `data/supplemental-art.json`；原始 PNG 与本机路径不随仓库发布。
- 插画遵循 [内容授权](../CONTENT_LICENSE.md) 的 CC BY 4.0 条款，在能够授予的权利范围内提供，署名为 `Word Atlas contributors — CC BY 4.0`。
- 补充释义来自 [ECDICT](https://github.com/skywind3000/ECDICT)，保留其 MIT 声明于 `public/atlas/ECDICT-LICENSE.txt`；来源与 CSV 的 SHA-256 记录在补充数据中。例句复用原项目内容，人工修订记录于 `data/sentence-card-overrides.json`。

直接运行应用使用已提交的数据与图片，不需要下载词典或配置生成凭据。重新生成补充数据时，单独取得 ECDICT CSV，放在被忽略的 `.local/dictionary/ecdict.csv`，运行 `npm run build:sentence-cards`；也可用 `npm run build:sentence-cards -- <csv路径>` 指定文件。该步骤保留已有图片的标志。

`node scripts/prepare-supplemental-art.mjs` 只整理提示词，不调用图像服务。生成并检查新图片后，使用 `python scripts/install-supplemental-art.py <词条id> <源PNG路径>` 安装（需要 Pillow）；脚本输出 quality 88 的 WebP 图像对并更新清单和词卡标志，拒绝覆盖已有图片。

提交前运行 `npm test`、`npm run check:atlas`、`npm run build`。补充词卡测试覆盖例句查词、引用与图片配对；自动检查不能证明释义和图意完全准确。

## 补充词卡录音

1,295 张补充词卡配有 4,611 段英美发音与例句录音，沿用 `public/atlas/audio/{uk,us,ex,ex2}/extra-<id>.mp3` 路径。生成来源、声音、文本与哈希记录在 `data/supplemental-audio.json`；生成和授权说明见[补充语音维护说明](supplemental-audio.md)。重新生成词卡会保留已有录音的媒体标志。

## 质量边界

自动校验覆盖结构、字段、顺序和文件，不覆盖语义正确性。插画和例句没有逐条人工审校；发现问题请提 Issue 或 PR。
