/// <reference path="./deployctl.d.ts" />

import Canvas, { EmulatedCanvas2D } from "https://deno.land/x/canvas@v1.1.3/mod.ts";
import { DejaVueSans } from "./dejavusans.ts"
// import { APIv2 } from "https://esm.sh/google-font-metadata@2.0.2";

const APIv2 = {}

interface Font {
  family: string;
  weight: string;
  style: string;
  range: string;
}

const defaultFontSource = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf";

const listOfFontSourceEntries = Object.values(APIv2).map(
  (metadata: any): [Font, string][] => {
    const fontSourceEntries: [Font, string][] = [];
    const family = metadata.family;
    for (const weight of Object.keys(metadata.variants)) {
      for (const style of Object.keys(metadata.variants[weight])) {
        for (const range of Object.keys(metadata.variants[weight][style])) {
          const source =
            metadata.variants[weight][style][range].url["truetype"];
          fontSourceEntries.push([{ family, weight, style, range }, source]);
        }
      }
    }
    return fontSourceEntries;
  },
);

const fontSourceEntries = ([] as [Font, string][]).concat(
  ...listOfFontSourceEntries,
);

const fontSourceMap = new Map(fontSourceEntries);

fontSourceMap.set(
  { family: "DejaVuSans", weight: "400", style: "normal", range: "latin" },
  DejaVueSans,
);

interface Params extends Font {
  text: string;
  size: string;
  color: string;
}

function registerFont(canvas: EmulatedCanvas2D, font: Font): void {
  const source = fontSourceMap.get(font) || defaultFontSource;
  if (source.match(new RegExp("https?://.*|data:font/ttf;base64,"))) {
    fetch(source)
      .then(response => response.blob())
      .then(blob => blob.arrayBuffer())
      .then(bytes => canvas.loadFont(bytes, font));
  }
}

function measureTextWidth({ text, size, color: _, ...font }: Params): number {
  const canvas = Canvas.MakeCanvas(1, 1);
  registerFont(canvas, font);
  const context = canvas.getContext("2d");
  context.font = `"${font.weight}" "${font.style}"  "${size}" "${font.family}"`;
  return context.measureText(text).width;
}

function render({ text, size, color, ...font }: Params): Uint8Array {
  const canvas = Canvas.MakeCanvas(
    measureTextWidth({ text, size, color, ...font }) + 20,
    parseInt(size) + 20,
  );
  registerFont(canvas, font);
  const context = canvas.getContext("2d");
  context.fillStyle = color;
  context.font =
    `"${font.weight}" "${font.style}"  "${size}px" "${font.family}"`;
  context.fillText(text, 10, parseInt(size) + 10);
  return canvas.toBuffer();
}

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const params: Params = {
    text: "",
    family: "DejaVuSans",
    weight: "400",
    style: "normal",
    size: "10",
    color: "black",
    range: "latin",
    ...Object.fromEntries(url.searchParams),
  };
  const body = render(params);
  event.respondWith(
    new Response(body, {
      status: 200,
      headers: {
        "content-type": "image/png",
      },
    }),
  );
});
