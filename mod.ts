/// <reference path="./deployctl.d.ts" />

import { createCanvas } from "https://deno.land/x/canvas@v1.1.3/mod.ts";
import { APIv2 } from "https://cdn.skypack.dev/google-font-metadata@2.0.2?dts";

interface Font {
  family: string,
  weight: string,
  style: string
}

const defaultFontSource = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf";

const listOfFontSourceEntries = Object.values(APIv2).map((metadata): [Font, string][] => {
  const fontSourceEntries: [Font, string][] = []
  const family = metadata.family
  for (const weight of Object.keys(metadata.variants)) {
    for(const style of Object.keys(metadata.variants[weight])) {
      const source = metadata.variants[weight][style]["latin"].url["truetype"]
      fontSourceEntries.push([{family, weight, style}, source])
    }
  }
  return fontSourceEntries
})

const fontSourceEntries = ([] as [Font, string][]).concat(...listOfFontSourceEntries)

const fontSourceMap = new Map(fontSourceEntries)

fontSourceMap.set(
  {family: "DejaVuSans", weight: "400", style: "normal"},
  "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
)

interface Params extends Font {
  text: string;
  size: string;
  color: string;
}

function render({text, size, color, ...font}: Params): Uint8Array {
  const canvas = createCanvas(100, 100);
  canvas.registerFont(fontSourceMap.get(font) || defaultFontSource, font)
  const context = canvas.getContext("2d");
  context.fillStyle = color;
  context.font = `"${font.weight}" "${font.style}"  "${size}" "${font.family}"`;
  context.fillText(text, 50, 50);
  return canvas.toBuffer();
}

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const params: Params = {
    text: "",
    family: "DejaVuSans",
    weight: "400",
    style: "normal",
    size: "10px",
    color: "black",
    ...Object.fromEntries(url.searchParams),
  }
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
