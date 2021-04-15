/// <reference path="./deployctl.d.ts" />
import * as csstree from "https://esm.sh/css-tree";
import traverse from "https://cdn.skypack.dev/traverse?dts";
import * as base64 from "https://deno.land/std/encoding/base64.ts";

async function fetchStylesheetFromGoogleFonts(
  family: string,
  weight: string,
): Promise<string> {
  const url =
    `https://fonts.googleapis.com/css2?family=${family}:wght@${weight}&display=swap`;
  const response = await fetch(url);
  return await response.text();
}

async function fetchAllRemoteFonts(
  urls: string[],
): Promise<Map<string, string>> {
  const entriesPromised = urls.map(async (url): Promise<[string, string]> => {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    const data = base64.encode(buffer);
    const p = /(woff2|woff|ttf|otf)$/;
    const m = p.exec(url);
    const dataurl = `data:font/${m![0]};base64,${data}`;
    return [url, dataurl];
  });
  return new Map(await Promise.all(entriesPromised));
}

function extractUrls(tree: csstree.CssNode) {
  return traverse(tree).reduce(function (acc, x) {
    const p = new RegExp("https://.*\\.(?:woff2|woff|ttf|otf)");
    const m = p.exec(x);
    return acc.concat(m ? m[0] : []);
  }, []);
}

async function generateStylesheet(
  family: string,
  weight: string,
): Promise<string> {
  const stylesheet = await fetchStylesheetFromGoogleFonts(family, weight);
  const tree = csstree.parse(stylesheet);
  const urls = extractUrls(tree);
  const urlToDataurl = await fetchAllRemoteFonts(urls);
  const newTree = traverse(tree).map(function (x) {
    const p = new RegExp("https://.*\\.(?:woff2|woff|ttf|otf)");
    const m = p.exec(x);
    if (m) {
      this.update(x.replace(m[0], urlToDataurl.get(m[0])));
    }
  });
  return csstree.generate(newTree);
}

interface Parameters {
  text: string;
  family: string;
  size: string;
  weight: string;
}

async function render(params: Parameters): Promise<string> {
  const stylesheet = await generateStylesheet(params.family, params.weight);
  const image = `<?xml version="1.0"?>
<svg xmlns="http://www.w3.org/2000/svg" height='${parseInt(params.size)*1.3}'>
<style type="text/css"><![CDATA[${stylesheet}]]></style>
<text x="10" y="${params.size}" font-size="${params.size}" font-family="${params.family}">${params.text}</text>
</svg>`;
  return image;
}

self.addEventListener("fetch", async (event) => {
  const url = new URL(event.request.url);
  const params: Parameters = {
    text: "",
    family: "Antonio",
    weight: "100",
    size: "20",
    ...Object.fromEntries(url.searchParams),
  };
  const body = await render(params);
  event.respondWith(
    new Response(body, {
      status: 200,
      headers: {
        "content-type": "image/svg+xml",
      },
    }),
  );
});
