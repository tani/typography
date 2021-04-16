# ![Typography](https://typography.deno.dev/render?text=Typography&size=30&family=Lobster&weight=400)

The typography project serves formatted text with web fonts as a svg image.
The service is running on [Deno deploy](https://deno.com/deploy).

On some web pages such as GitHub, we can't use enough CSS for user content, especially font settings. Our project converts the text into an image typeset in the specified font.

Technically, we typeset by downloading the specified font from Google Fonts and embedding it in SVG along with the text. These software are then deployed on the edge network by Deno Deploy to serve images on demand.

## API

You can use any font listed on [Google Fonts](https://fonts.google.com/). You just hitted the URL like;

```ts
`https://typography.deno.dev/render?text=${text as string}&size=${size as number}&family=${family as string}&weight=${weight as number}`
```

## Preview

Please visit https://typography.deno.dev/ . You can explore your favorite fonts!

## License and Copyright

Copyright &copy; 2021 TANIGUCHI Masaya All Rights Reserved.

This software is licensed under ther MIT license.
