import assert from "node:assert/strict";
import { test } from "node:test";
import { pickVoice, speechText } from "./voice";

const v = (name: string, lang: string) => ({ name, lang });

test("prefers a mainland Mandarin voice, then other Chinese, and avoids Cantonese", () => {
  assert.equal(pickVoice([v("Samantha", "en-US")]), undefined);
  assert.equal(pickVoice([v("Sinji", "zh-HK"), v("Meijia", "zh-TW"), v("Tingting", "zh-CN")])?.name, "Tingting");
  assert.equal(pickVoice([v("Sinji", "zh-HK"), v("Meijia", "zh-TW")])?.name, "Meijia");
  assert.equal(pickVoice([v("Plain", "zh_CN"), v("Microsoft Xiaoxiao Online (Natural)", "zh-CN")])?.name, "Microsoft Xiaoxiao Online (Natural)");
});

test("joins lines with their punctuation so the voice pauses", () => {
  assert.equal(speechText([{ zh: "白日依山尽，" }, { zh: "黄河入海流。" }]), "白日依山尽，黄河入海流。");
});
