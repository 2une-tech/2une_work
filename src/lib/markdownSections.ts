export type MarkdownSections = Partial<
  Record<'description' | 'responsibilities' | 'requirements' | 'timeline' | 'faq', string>
>;

function normKey(s: string): keyof MarkdownSections | null {
  const k = s
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!k) return null;

  if (k === 'description' || k === 'about' || k === 'about the role') return 'description';
  if (k === 'responsibilities' || k === 'what youll do' || k === 'what you will do' || k === 'key responsibilities')
    return 'responsibilities';
  if (k === 'requirements' || k === 'qualifications' || k === 'ideal qualifications' || k === 'skills')
    return 'requirements';
  if (k === 'timeline' || k === 'duration' || k === 'hours' || k === 'more about the opportunity')
    return 'timeline';
  if (k === 'faq' || k === 'faqs') return 'faq';
  return null;
}

/**
 * Splits a markdown doc into named sections based on `## Heading` blocks.
 * If headings are missing/unrecognized, callers should fall back to defaults.
 */
export function splitMarkdownSections(md: string): MarkdownSections {
  const text = (md ?? '').replace(/\r\n/g, '\n');
  if (!text.trim()) return {};

  const lines = text.split('\n');
  const out: MarkdownSections = {};

  let current: keyof MarkdownSections | null = null;
  let buf: string[] = [];

  const flush = () => {
    if (!current) return;
    const chunk = buf.join('\n').trim();
    if (chunk) out[current] = chunk;
  };

  for (const line of lines) {
    const m = /^##\s+(.+?)\s*$/.exec(line);
    if (m) {
      flush();
      buf = [];
      current = normKey(m[1]) ?? current;
      continue;
    }
    buf.push(line);
  }

  flush();
  return out;
}

