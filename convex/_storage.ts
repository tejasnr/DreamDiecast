export function decodeBase64DataUrl(dataUrl: string) {
  const [meta, data] = dataUrl.split(",");
  if (!data) {
    throw new Error("Invalid data URL");
  }
  const match = /data:(.*?);base64/.exec(meta || "");
  const contentType = match?.[1] || "application/octet-stream";
  const binary = typeof atob === "function" ? atob(data) : Buffer.from(data, "base64").toString("binary");
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return { bytes, contentType };
}
