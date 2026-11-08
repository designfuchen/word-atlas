import { Volume2 } from "lucide-react";
import { useEffect, useState } from "react";
import { stopAudio } from "../lib/audio";
import { toast } from "../ui/Toast";
import { readAloud } from "./speech";
import { RATE } from "./voice";
import { usePoetryStore } from "./store";

/** Play button for a piece of verse. Uses the "slow" preference; says so once if the device has no Chinese voice. */
export function PoemSpeak({ text, label, size = "md", className = "" }: { text: string; label?: string; size?: "sm" | "md"; className?: string }) {
  const slow = usePoetryStore((s) => s.prefs.slow);
  const [on, setOn] = useState(false);
  useEffect(() => () => stopAudio(), []);
  const run = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setOn(true);
    try {
      const r = await readAloud(text, slow ? RATE.slow : RATE.normal);
      if (r === "unsupported") toast("这个浏览器不支持语音朗读。", "warn");
      else if (r === "no-voice") toast("没有找到普通话语音，朗读可能不准。可以在系统设置里安装中文语音。", "warn");
    } finally {
      setOn(false);
    }
  };
  return (
    <button type="button" className={`speak speak-${size} ${on ? "is-on" : ""} ${label ? "has-label" : ""} ${className}`} onClick={run} aria-label={label ? `朗读：${label}` : "朗读"} title="朗读">
      <span className="speak-icon">
        <Volume2 size={size === "sm" ? 15 : 18} strokeWidth={1.8} />
        <span className="speak-waves" />
      </span>
      {label && <span className="speak-label">{label}</span>}
    </button>
  );
}
