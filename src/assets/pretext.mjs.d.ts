declare module '@/assets/pretext.mjs' {
  export function prepareWithSegments(text: string, font: string): any;
  export function layoutWithLines(
    prepared: any,
    maxWidth: number,
    lineHeight: number
  ): { lines: { text: string; width: number }[]; lineCount: number };
}