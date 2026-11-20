import { readFileSync } from "node:fs";
import { join } from "node:path";

const monoFontDir = join(
  "node_modules",
  "@fontsource",
  "ibm-plex-mono",
  "files"
);
const cjkFontDir = join("node_modules", "@fontsource", "noto-sans-sc", "files");

async function loadLocalFonts(): Promise<
  Array<{ name: string; data: ArrayBuffer; weight: number; style: string }>
> {
  const fontsConfig = [
    {
      name: "IBM Plex Mono",
      file: "ibm-plex-mono-latin-400-normal.woff",
      weight: 400,
      style: "normal",
      dir: monoFontDir,
    },
    {
      name: "IBM Plex Mono",
      file: "ibm-plex-mono-latin-700-normal.woff",
      weight: 700,
      style: "bold",
      dir: monoFontDir,
    },
    {
      name: "Noto Sans SC",
      file: "noto-sans-sc-chinese-simplified-400-normal.woff",
      weight: 400,
      style: "normal",
      dir: cjkFontDir,
    },
    {
      name: "Noto Sans SC",
      file: "noto-sans-sc-chinese-simplified-700-normal.woff",
      weight: 700,
      style: "bold",
      dir: cjkFontDir,
    },
    {
      name: "Noto Sans SC",
      file: "noto-sans-sc-latin-400-normal.woff",
      weight: 400,
      style: "normal",
      dir: cjkFontDir,
    },
    {
      name: "Noto Sans SC",
      file: "noto-sans-sc-latin-700-normal.woff",
      weight: 700,
      style: "bold",
      dir: cjkFontDir,
    },
  ];

  return fontsConfig.map(({ name, file, weight, style, dir }) => {
    const font = readFileSync(join(dir, file));

    return {
      name,
      data: font.buffer.slice(
        font.byteOffset,
        font.byteOffset + font.byteLength
      ) as ArrayBuffer,
      weight,
      style,
    };
  });
}

export default loadLocalFonts;
