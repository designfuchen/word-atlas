/** Share a generated file through the OS sheet, falling back to a download. */
export type ShareOutcome = "shared" | "cancelled" | "unavailable";

export async function shareFile(file: File, title?: string): Promise<ShareOutcome> {
  if (!navigator.canShare?.({ files: [file] })) return "unavailable";
  try {
    await navigator.share({ files: [file], title });
    return "shared";
  } catch (e) {
    // AbortError means the user dismissed the sheet; anything else (for example
    // NotAllowedError inside an iframe, or DataError) is a technical failure and
    // the caller should fall back to downloading the file.
    return e instanceof DOMException && e.name === "AbortError" ? "cancelled" : "unavailable";
  }
}

export function downloadFile(file: File) {
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
