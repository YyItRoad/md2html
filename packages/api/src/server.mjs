import http from 'node:http'
import { customizeTheme, initRenderer, modifyHtmlContent } from '@md/core'
import {
  codeBlockThemeOptions,
  colorOptions,
  defaultStyleConfig,
  fontFamilyOptions,
  fontSizeOptions,
  legendOptions,
  themeMap,
  themeOptions,
} from '@md/shared'
import { toMerged } from 'es-toolkit'
import { processHtmlForServer } from './html-processor.mjs'

const server = http.createServer(async (req, res) => {
  // Set CORS headers
  res.setHeader(`Access-Control-Allow-Origin`, `*`)
  res.setHeader(`Access-Control-Allow-Methods`, `POST, OPTIONS`)
  res.setHeader(`Access-Control-Allow-Headers`, `Content-Type`)

  if (req.method === `OPTIONS`) {
    res.writeHead(204)
    res.end()
    return
  }

  if (req.url === `/render` && req.method === `POST`) {
    console.log(`Received request for /render`)
    let statusCode = 200
    let responsePayload

    try {
      const body = await parseJSONBody(req)
      const { markdown, options } = body

      if (typeof markdown !== `string`) {
        statusCode = 400
        responsePayload = { error: `Missing or invalid "markdown" field in request body` }
        console.log(`Render request failed: Missing or invalid markdown`)
      }
      else {
        // 1. 使用 toMerged 深度合并默认配置和用户传入的配置
        const mergedOptions = toMerged(defaultStyleConfig, options || {})

        // 2. 加载基础主题
        const baseTheme = themeMap[mergedOptions.theme] || themeMap.default

        // 3. 应用颜色等自定义配置到主题中
        const customizedTheme = customizeTheme(baseTheme, { color: mergedOptions.primaryColor })

        // 4. 准备最终的渲染器选项
        const finalRendererOpts = {
          ...mergedOptions,
          theme: customizedTheme,
          fonts: mergedOptions.fontFamily,
          size: mergedOptions.fontSize,
        }

        // 5. 为本次请求创建一个全新的、隔离的渲染器实例
        const rendererAPI = initRenderer(finalRendererOpts)

        // 6. 使用 modifyHtmlContent 函数完成整个渲染流程
        const rawHtml = modifyHtmlContent(markdown, rendererAPI)

        // 7. 对 HTML 进行后处理，内联样式
        const finalHtml = processHtmlForServer(rawHtml, mergedOptions.primaryColor)

        responsePayload = { content: finalHtml }
        console.log(`Render request successful`)
      }
    }
    catch (error) {
      console.error(`Error during rendering:`, error)
      statusCode = 500
      responsePayload = { error: `An internal error occurred during rendering.` }
      console.log(`Render request failed with internal error`)
    }

    res.writeHead(statusCode, { 'Content-Type': `application/json; charset=utf-8` })
    res.end(JSON.stringify(responsePayload))
  }
  else if (req.url === `/themes` && req.method === `GET`) {
    console.log(`Received request for /themes`)
    const configOptions = {
      themes: themeOptions,
      colors: colorOptions,
      fontFamilies: fontFamilyOptions,
      fontSizes: fontSizeOptions,
      codeBlockThemes: codeBlockThemeOptions,
      legends: legendOptions,
    }
    res.writeHead(200, { 'Content-Type': `application/json; charset=utf-8` })
    res.end(JSON.stringify(configOptions))
  }
  else {
    res.writeHead(404, { 'Content-Type': `application/json` })
    res.end(JSON.stringify({ error: `Not Found` }))
  }
})

server.listen(3000, () => {
  console.log(`Markdown Render API server running on http://localhost:3000`)
})

function parseJSONBody(req) {
  return new Promise((resolve, reject) => {
    let body = ``
    req.on(`data`, (chunk) => {
      body += chunk.toString()
    })
    req.on(`end`, () => {
      try {
        // Handle empty body
        if (body === ``) {
          resolve({})
          return
        }
        resolve(JSON.parse(body))
      }
      catch (error) {
        reject(new Error(`Invalid JSON in request body`, error))
      }
    })
    req.on(`error`, (err) => {
      reject(err)
    })
  })
}
