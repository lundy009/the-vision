export function splitText(text: string, maxChars = 3500) {
  const parts: string[] = [];
  let t = text.trim();

  while (t.length > maxChars) {
    let cut = t.lastIndexOf("\n\n", maxChars);
    if (cut < 500) cut = t.lastIndexOf("\n", maxChars);
    if (cut < 500) cut = t.lastIndexOf(". ", maxChars);
    if (cut < 500) cut = maxChars;

    parts.push(t.slice(0, cut).trim());
    t = t.slice(cut).trim();
  }

  if (t.length) parts.push(t);
  return parts;
}
