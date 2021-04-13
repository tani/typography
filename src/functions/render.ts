import type { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'
import type { CanvasKit } from 'canvaskit-wasm'
import { CanvasKitInit } from 'canvaskit-wasm'
import { readFile } from 'fs/promises'

type ColorName = Exclude<{ [K in keyof CanvasKit]: CanvasKit[K] extends Float32Array ? K : never }[keyof CanvasKit], undefined>

type AlignStyle =  Exclude<keyof CanvasKit["TextAlign"], "values">

interface Parameters {
    text: string;
    width: number;
    height: number;
    family: string;
    size: `${number}px`;
    color: ColorName;
    align: AlignStyle;
}

export const defaultParameters: Parameters = {
    text: "",
    width: 100,
    height: 100,
    family: "Noto Sans",
    size: "10px",
    color: "BLACK",
    align: "Left",
}

export async function render(parameters: Parameters, contentType: string): Promise<APIGatewayProxyResult["body"]> {
    const [CanvasKit, buffer] = await Promise.all([
        await CanvasKitInit({ locateFile: (file) => `/node_modules/canvaskit-wasm/bin/${file}` }),
        await readFile('')
    ])
    const canvas = CanvasKit.MakeCanvas(parameters.width, parameters.height)
    canvas.loadFont(buffer, {
        family: "DummyFont",
        style: "normal",
        weight: "400"
    })
    const context = canvas.getContext('2d')
    context!.font = `${parameters.size} "${parameters.family}"`
    context!.fillText(parameters.text, 0, 0)
    return canvas.toDataURL(contentType)
}

export const handler: APIGatewayProxyHandler = async (event) => {
    const contentType = event.headers['Content-Type'] || 'image/png'
    const parameters: Parameters = { 
        ...defaultParameters,
        ...event.queryStringParameters
    }
    parameters.height = parseInt(event.queryStringParameters?.height || parameters.height.toString())
    parameters.width = parseInt(event.queryStringParameters?.width || parameters.width.toString())
    return {
        statusCode: 200,
        headers: {
            'Content-Type': contentType 
        },
        body: await render(parameters, contentType)
    } as APIGatewayProxyResult
}