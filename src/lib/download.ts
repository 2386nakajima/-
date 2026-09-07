/** Web環境ならテキストをファイルとしてダウンロードする（不可なら false） */
export function downloadText(
  filename: string,
  text: string,
  mime = 'application/json',
): boolean {
  const g = globalThis as unknown as {
    Blob?: new (parts: string[], opts: { type: string }) => object;
    URL?: {
      createObjectURL: (b: object) => string;
      revokeObjectURL: (u: string) => void;
    };
    document?: {
      createElement: (tag: string) => {
        href: string;
        download: string;
        click: () => void;
      };
    };
  };
  if (!g.Blob || !g.URL || !g.document) return false;
  const url = g.URL.createObjectURL(new g.Blob([text], { type: mime }));
  const a = g.document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  g.URL.revokeObjectURL(url);
  return true;
}
