import { marked } from "marked";
import DOMPurify from "dompurify";

marked.setOptions({ breaks: true, gfm: true });

export function pluralizeMessages(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;

  let form = "сообщений";

  if (mod10 === 1 && mod100 !== 11) {
    form = "сообщение";
  } else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    form = "сообщения";
  }

  return `${count} ${form}`;
}

export function renderMarkdown(source: string | undefined | null): string {
  const raw = source ?? "";
  const html = marked.parse(raw);
  return DOMPurify.sanitize(html as string);
}
