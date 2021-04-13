/// <reference path="./deployctl.d.ts" />

import { createCanvas } from "https://deno.land/x/canvas@v1.1.3/mod.ts";

function render(text: string): Uint8Array {
  const canvas = createCanvas(100, 100);
  canvas.registerFont("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", {
    family: "DejaVuSans",
  });
  const context = canvas.getContext("2d");
  context.fillStyle = "white";
  context.font = "20px DejaVuSans";
  context.fillText(text, 50, 50);
  return canvas.toBuffer();
}

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const text = url.searchParams.get("text") || "";
  const body = render(text);
  event.respondWith(
    new Response(body, {
      status: 200,
      headers: {
        "content-type": "image/png",
      },
    }),
  );
});
