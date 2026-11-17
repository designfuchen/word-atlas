# 补充词卡离线语音

新增 1,295 张词卡内置 2,590 段英美单词发音和 2,021 段例句朗读，共 4,611 个 MP3 文件。相同文本与声音组合复用生成结果，共 4,413 段独立录音。

- 模型：Kokoro v1.0；运行库：kokoro-onnx 0.6.1。
- 英式单词和例句：`bf_emma` / `en-gb`；美式单词：`af_heart` / `en-us`。
- 语速：0.94；格式：24 kHz、单声道、96 kbps MP3。
- 文件：`public/atlas/audio/{uk,us,ex,ex2}/extra-<id>.mp3`，沿用原词库路径。
- 清单：`data/supplemental-audio.json` 保存合成文本、声音、时长、文件 SHA-256 和模型 SHA-256。

## 本地生成

安装 Python、`kokoro-onnx==0.6.1`、`soundfile` 和 FFmpeg。首次从[模型发布页](https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.1)下载 `kokoro-v1.0.onnx` 与 `voices-v1.0.bin` 到被忽略的 `.local/tts/`。

运行 `python scripts/generate-supplemental-audio.py --workers 12`。生成阶段不调用网络服务，不需要 API key。Windows 发音组件使用系统临时目录中的 ASCII 路径，避免中文目录兼容问题。

缓存位于 `.local/tts/audio-cache/`。脚本校验已有缓存后续跑，对不同内容的已有目标录音拒绝覆盖。单词中的个别字母和缩写在脚本中规范化拼读；原例句文本保持不变。

完成后更新词卡媒体位：英音 2、美音 4、第一例句 8、第二例句 16。`npm run build:sentence-cards` 会保留已存在录音的标志。播放按钮和页面交互不变。

## 授权与质量

模型与声音来源为 [hexgrad/Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M)，标注 Apache-2.0；授权文本和来源保存在 [KOKORO-LICENSE.txt](../public/atlas/KOKORO-LICENSE.txt)。生成录音遵循项目 [CONTENT_LICENSE.md](../CONTENT_LICENSE.md)，在能够授予的权利范围内提供。应用只发布录音，不打包模型或合成运行库。

自动检查覆盖文件存在性、合成文本、时长、有效音量、哈希及音频解码，不代表每段录音都经过人工试听。多义词、同形异音词和缩写仍可能需要按语境修正。

## 验证与打包

提交前运行 `npm test`、`npm run check:atlas` 和 `npm run build`。构建会将已提交的录音复制到 `dist/atlas/audio/`，播放沿用原项目的媒体路径和交互。测试检查补充录音的完整性、文本、声音及 SHA-256；本地模型和生成缓存不随源码提交。
