/// <reference path="./deployctl.d.ts" />

import * as csstree from "https://esm.sh/css-tree@1.1.3";
import * as pako from "https://esm.sh/pako@2.0.3";
import * as base64 from "https://deno.land/std@0.91.0/encoding/base64.ts";
import { XmlEntities } from "https://deno.land/x/html_entities@v1.0/mod.js";

async function fetchStylesheetFromGoogleFonts(
  family: string,
  weight: string,
): Promise<string> {
  const url =
    `https://fonts.googleapis.com/css2?family=${family}:wght@${weight}&display=swap`;
  const response = await fetch(url);
  return await response.text();
}

async function fetchRemoteFont(url: string): Promise<[string, string]> {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  const data = base64.encode(buffer);
  const p = /(woff2|woff|ttf|otf)$/;
  const m = p.exec(url);
  return [url, `data:font/${m![0]};base64,${data}`];
}

async function fetchAllRemoteFonts(
  tree: csstree.CssNode,
): Promise<Map<string, string>> {
  const entries: Promise<[string, string]>[] = [];
  csstree.walk(tree, {
    visit: "Url",
    enter: (node: csstree.Url) =>
      entries.push(fetchRemoteFont(node.value.value)),
  });
  return new Map(await Promise.all(entries));
}

async function generateStylesheet(
  family: string,
  weight: string,
): Promise<string> {
  const stylesheet = await fetchStylesheetFromGoogleFonts(family, weight);
  const tree = csstree.parse(stylesheet);
  const urlToDataurl = await fetchAllRemoteFonts(tree);
  csstree.walk(tree, {
    visit: "Url",
    enter: (node) =>
      node.value.value = urlToDataurl.get(node.value.value) || "",
  });
  return csstree.generate(tree);
}

async function render(params: URLSearchParams): Promise<string> {
  const size = XmlEntities.encode(params.get("size") || "20");
  const text = XmlEntities.encode(params.get("text") || "");
  const height = XmlEntities.encode(params.get("height") || (parseInt(size) * 1.3).toString());
  const width = XmlEntities.encode(params.get("width") || (parseInt(size) * 0.65 * text.length).toString());
  const color = XmlEntities.encode(params.get("color") || "#000000");
  const family = XmlEntities.encode(params.get("family") || "Abel");
  const weight = XmlEntities.encode(params.get("weight") || "400");
  const stylesheet = await generateStylesheet(family, weight);
  return `<svg xmlns="http://www.w3.org/2000/svg" height="${height}" width="${width}">
    <style><![CDATA[${stylesheet}]]></style>
    <text
      fill="${color}"
      x="50%"
      y="50%"
      text-anchor="middle"
      dominant-baseline="central"
      font-size="${size}"
      font-family="${family}">
      ${text}
    </text>
  </svg>`
}

self.addEventListener("fetch", async (event) => {
  const url = new URL(event.request.url);
  if (url.pathname.startsWith("/render")) {
    const body = await render(url.searchParams);
    const bodyz = pako.gzip(new TextEncoder().encode(body));
    event.respondWith(
      new Response(bodyz, {
        status: 200,
        headers: {
          "Content-Type": "image/svg+xml",
          "Content-Encoding": "gzip"
        },
      }),
    );
  } else {
    const response = await fetch(new URL("index.html", import.meta.url));
    const body = await response.text();
    const bodyz = pako.gzip(new TextEncoder().encode(body));
    event.respondWith(
      new Response(bodyz, {
        status: 200,
        headers: {
          "Content-Type": "text/html",
          "Content-Encoding": "gzip"
        },
      }),
    );
  }
});
