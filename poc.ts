const css = require('css')
const traverse = require('traverse')
const fetch = require('node-fetch')

async function fetchStylesheet(family, weight) {
  const url = `https://fonts.googleapis.com/css2?family=${family}:wght@${weight}&display=swap`
  const response = await fetch(url)
  return await response.text()
}

async function fetchAllFonts(urls) {
  const entriesPromised = urls.map(async (url) => {
    const response = await fetch(url)
    const buffer = await response.buffer()
    const p = /(woff2|woff|ttf|otf)$/
    const m = p.exec(url)
    const dataurl = `data:font/${m[0]};base64,${buffer.toString('base64')}`
    return [url, dataurl]
  })
  return Object.fromEntries(await Promise.all(entriesPromised))
}

function extractUrls(tree) {
  return traverse(tree).reduce(function(acc, x) {
    const p = new RegExp("https://.*\\.(?:woff2|woff|ttf|otf)")
    const m = p.exec(x)
    return acc.concat(m ? m[0] : [])
  }, [])
}

async function generateStylesheet(family, weight) {
  const stylesheet = await fetchStylesheet(family, weight)
  const tree = css.parse(stylesheet)
  const urls = extractUrls(tree)
  const urlToDataurl = await fetchAllFonts(urls)
  const newTree = traverse(tree).map(function(x) {
    const p = new RegExp("https://.*\\.(?:woff2|woff|ttf|otf)")
    const m = p.exec(x)
    if (m) {
      this.update(x.replace(m[0], urlToDataurl[m[0]]))
    }
  })
  return css.stringify(newTree, { compress: true })
}

async function generateSVG() {
  console.log(`<?xml version="1.0"?>
    <svg xmlns="http://www.w3.org/2000/svg" height='20'>
      <style type="text/css"><![CDATA[
        ${await generateStylesheet('Antonio', '100')}
      ]]></style>
      <text x="10" y="20" font-size="20" font-family="Antonio">SVG Colored Text</text>
    </svg>
  `)
}

generateSVG()
