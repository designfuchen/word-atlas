"""Regenerate the ComfyUI workflow from source, so a `git clean` can never lose it again.

Usage: python3 scripts/atlas/build_workflow.py
Output: （越狱版）image_qwen_image_2_1_t2i_gguf.json at the repo root.

The prompt lives here, not in the json: the json is a build artefact.
Node graph, model filenames and sampler settings mirror the shipped Qwen-Image 2.1 GGUF t2i graph.
"""
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / "（越狱版）image_qwen_image_2_1_t2i_gguf.json"

UNET = "qwen-image-2.1-UC-Q4_K_M.gguf"
CLIP = "qwen3vl_8b_bf16.safetensors"
VAE = "qwen_image_2.1_vae_bf16.safetensors"
SEED = 593103825222985

PROMPT = """Illustrate this everyday moment, and nothing else: {{example_en}}

The headword is {{word}} ({{pos}} — {{sense_en}}); it is what the picture is about. \
Draw the same action, the same objects, the same number of people or things, the same place, and the same time \
of day the moment states. If it states a habitual or general truth rather than one event, depict the typical \
instance it implies, at the moment it puts itself in: morning sunlight must actually flood the room, rain must \
actually be falling, a weekly lunch must actually be laid on the table. Keep every element it names visible and \
recognisable, and add no people, animals, props, buildings, vehicles or weather it does not imply. Never swap \
the moment for a metaphor, a symbol, a mood board or a collage.

Art direction: mid-century modern editorial illustration, like a plate from a vintage illustrated field guide. \
Limited palette of deep ink navy, warm terracotta, mustard ochre, muted sage green and soft sky blue on warm \
cream paper. Flat geometric shapes, confident clean silhouettes, subtle risograph grain and paper texture, gentle \
shading, generous negative space, centered square composition, calm and charming mood, one clear focal group or a \
readable action with every participant visible, textless."""

NEGATIVE = (
    "text, letters, typography, words, numbers, digits, captions, subtitles, lettering, handwriting, paragraphs, "
    "signage, labels, brand logos, headline, title card, poster, banner, book cover, mockup, watermark, signature, "
    "border, frame, panel dividers, collage, split screen, mood board, abstract symbolism, extra people, extra "
    "fingers, extra limbs, deformed hands, distorted faces, cluttered composition, photographic realism, 3d render, "
    "glossy plastic, neon colours, muddy colours, low contrast, blurry, jpeg artifacts"
)

NOTE = """word-atlas 单词生图模板 v4 —— 例句是剧本，风格是外衣

顺序：例句（无引号）→ 词条锚点 → 画风。

为什么没有引号：v3 把例句加引号放首行，Qwen-Image 直接把它当海报标题排了出来，整张图变成带正文的版式。引号 = 待排版文本，删掉引号、改成陈述句后文字消失。

占位符（scripts/atlas/gen_images_comfy.py 自动填充）：
{{example_en}}  日常例句 ex[0].en，必填，唯一场景依据
{{word}}       词形
{{pos}}        词性
{{sense_en}}   英文释义（senses[0]）

cfg ≥2 才能让 negative prompt 生效（当前 2.5）；蒸馏少步模型降回 1.0。

验收：不懂英文的人看图能指出该词对应的事物/动作，画面元素不超出例句，且画面里没有字。"""


def node(nid, ntype, pos, size, wv, inputs=(), outputs=(), named=None, props="auto", **extra):
    n = {
        "id": nid, "type": ntype, "pos": pos, "size": size, "flags": {},
        "order": extra.pop("order", 0), "mode": 0,
        "inputs": list(inputs), "outputs": list(outputs),
        "properties": {"Node name for S&R": ntype} if props == "auto" else props,
        "widgets_values": wv,
    }
    if named:
        n["widgets_values_named"] = named
    n.update(extra)
    return n


def build():
    nodes = [
        node(13, "ResolutionSelector", [140, 680], [300, 190], ["1:1 (Square)", 1, 8],
             outputs=[{"name": "width", "type": "INT", "links": [701]},
                      {"name": "height", "type": "INT", "links": [702]}],
             named={"aspect_ratio": "1:1 (Square)", "megapixels": 1, "multiple": 8},
             order=0, showAdvanced=True),
        node(451, "UnetLoaderGGUF", [140, 100], [380, 90], [UNET],
             outputs=[{"name": "MODEL", "type": "MODEL", "links": [703]}],
             named={"unet_name": UNET}, order=1),
        node(453, "CLIPLoader", [140, 240], [380, 120], [CLIP, "qwen_image", "default"],
             outputs=[{"name": "CLIP", "type": "CLIP", "links": [704]}],
             named={"clip_name": CLIP, "type": "qwen_image", "device": "default"}, order=2),
        node(454, "VAELoader", [140, 420], [380, 70], [VAE],
             outputs=[{"name": "VAE", "type": "VAE", "links": [705]}],
             named={"vae_name": VAE}, order=3),
        node(456, "EmptyLatentImage", [480, 680], [300, 120], [1024, 1024, 1],
             inputs=[{"name": "width", "type": "INT", "widget": {"name": "width"}, "link": 701},
                     {"name": "height", "type": "INT", "widget": {"name": "height"}, "link": 702}],
             outputs=[{"name": "LATENT", "type": "LATENT", "links": [706]}],
             named={"width": 1024, "height": 1024, "batch_size": 1}, order=4),
        node(452, "TextEncodeQwenImage21", [560, 100], [480, 640], [PROMPT, NEGATIVE, 1024],
             inputs=[{"name": "clip", "type": "CLIP", "link": 704},
                     {"name": "images.image_1", "shape": 7, "type": "IMAGE", "link": None},
                     {"name": "vae", "shape": 7, "type": "VAE", "link": None}],
             outputs=[{"name": "positive", "type": "CONDITIONING", "links": [707]},
                      {"name": "negative", "type": "CONDITIONING", "links": [708]},
                      {"name": "latent", "type": "LATENT", "links": None}],
             named={"prompt": PROMPT, "negative_prompt": NEGATIVE, "resolution": 1024}, order=5),
        node(458, "KSampler", [1080, 100], [300, 380],
             [SEED, "randomize", 25, 2.5, "euler", "simple", 1.0],
             inputs=[{"name": "model", "type": "MODEL", "link": 703},
                     {"name": "positive", "type": "CONDITIONING", "link": 707},
                     {"name": "negative", "type": "CONDITIONING", "link": 708},
                     {"name": "latent_image", "type": "LATENT", "link": 706}],
             outputs=[{"name": "LATENT", "type": "LATENT", "links": [709]}],
             named={"seed": SEED, "control_after_generate": "randomize", "steps": 25, "cfg": 2.5,
                    "sampler_name": "euler", "scheduler": "simple", "denoise": 1.0}, order=6),
        node(457, "VAEDecode", [1420, 100], [230, 60], [],
             inputs=[{"name": "samples", "type": "LATENT", "link": 709},
                     {"name": "vae", "type": "VAE", "link": 705}],
             outputs=[{"name": "IMAGE", "type": "IMAGE", "links": [710]}], order=7),
        node(461, "SaveImageAdvanced", [1690, 100], [500, 300], ["word-atlas/scene", "png", "8-bit", "sRGB"],
             inputs=[{"name": "images", "type": "IMAGE", "link": 710}],
             outputs=[{"name": "images", "type": "IMAGE", "links": []}], props={}, order=8,
             named={"filename_prefix": "word-atlas/scene", "format": "png",
                    "format.bit_depth": "8-bit", "format.input_color_space": "sRGB"}),
        node(500, "Note", [1690, 440], [500, 400], [NOTE], props={"text": ""}, order=9,
             color="#322", bgcolor="#533"),
    ]
    links = [
        [701, 13, 0, 456, 0, "INT"],
        [702, 13, 1, 456, 1, "INT"],
        [703, 451, 0, 458, 0, "MODEL"],
        [704, 453, 0, 452, 0, "CLIP"],
        [705, 454, 0, 457, 1, "VAE"],
        [706, 456, 0, 458, 3, "LATENT"],
        [707, 452, 0, 458, 1, "CONDITIONING"],
        [708, 452, 1, 458, 2, "CONDITIONING"],
        [709, 458, 0, 457, 0, "LATENT"],
        [710, 457, 0, 461, 0, "IMAGE"],
    ]
    return {
        "id": "54bb395d-3e60-4c94-b525-85523901575b",
        "revision": 0,
        "last_node_id": 500,
        "last_link_id": 800,
        "nodes": nodes,
        "links": links,
        "groups": [],
        "config": {},
        "extra": {
            "frontendVersion": "1.53.7",
            "wordAtlas": {
                "template": "word-scene-v4",
                "sceneSource": "data/word-atlas.json -> ex[0].en (everyday example sentence)",
                "placeholders": ["example_en", "word", "pos", "sense_en"],
                "runner": "python3 scripts/atlas/gen_images_comfy.py",
            },
        },
        "version": 0.4,
    }


def main():
    wf = build()
    OUT.write_text(json.dumps(wf, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {OUT.name} ({OUT.stat().st_size} bytes, {len(wf['nodes'])} nodes)")


if __name__ == "__main__":
    main()
