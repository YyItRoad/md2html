import { JSDOM } from 'jsdom'
import juice from 'juice'

function mergeCss(html) {
  return juice(html, {
    inlinePseudoElements: true,
    preserveImportant: true,
  })
}

function modifyHtmlStructure(htmlString, document) {
  const tempDiv = document.createElement(`div`)
  tempDiv.innerHTML = htmlString

  tempDiv.querySelectorAll(`li > ul, li > ol`).forEach((originalItem) => {
    originalItem.parentElement.insertAdjacentElement(`afterend`, originalItem)
  })

  return tempDiv.innerHTML
}

function createEmptyNode(document) {
  const node = document.createElement(`p`)
  node.style.fontSize = `0`
  node.style.lineHeight = `0`
  node.style.margin = `0`
  node.innerHTML = `&nbsp;`
  return node
}

function solveWeChatImage(document) {
  const images = document.getElementsByTagName(`img`)
  Array.from(images).forEach((image) => {
    const width = image.getAttribute(`width`)
    const height = image.getAttribute(`height`)
    image.removeAttribute(`width`)
    image.removeAttribute(`height`)
    image.style.width = width
    image.style.height = height
  })
}

export function processHtmlForServer(html, primaryColor) {
  const dom = new JSDOM(`<!DOCTYPE html><body><div id="output">${html}</div></body>`)
  const { document } = dom.window
  const clipboardDiv = document.getElementById(`output`)

  // 1. 先合并 CSS 和修改 HTML 结构
  clipboardDiv.innerHTML = modifyHtmlStructure(mergeCss(clipboardDiv.innerHTML), document)

  // 2. 处理样式和颜色变量
  clipboardDiv.innerHTML = clipboardDiv.innerHTML
    .replace(/([^-])top:(.*?)em/g, `$1transform: translateY($2em)`)
    .replace(/hsl\(var\(--foreground\)\)/g, `#3f3f3f`)
    .replace(/var\(--blockquote-background\)/g, `#f7f7f7`)
    .replace(/var\(--md-primary-color\)/g, primaryColor)
    .replace(/--md-primary-color:.+?;/g, ``)
    .replace(
      /<span class="nodeLabel"([^>]*)><p[^>]*>(.*?)<\/p><\/span>/g,
      `<span class="nodeLabel"$1>$2</span>`,
    )
    .replace(
      /<span class="edgeLabel"([^>]*)><p[^>]*>(.*?)<\/p><\/span>/g,
      `<span class="edgeLabel"$1>$2</span>`,
    )

  // 3. 处理图片大小
  solveWeChatImage(document)

  // 4. 添加空白节点用于兼容 SVG 复制
  const beforeNode = createEmptyNode(document)
  const afterNode = createEmptyNode(document)
  clipboardDiv.insertBefore(beforeNode, clipboardDiv.firstChild)
  clipboardDiv.appendChild(afterNode)

  // 5. 兼容 Mermaid
  const nodes = clipboardDiv.querySelectorAll(`.nodeLabel`)
  nodes.forEach((node) => {
    const parent = node.parentElement
    const xmlns = parent.getAttribute(`xmlns`)
    const style = parent.getAttribute(`style`)
    const section = document.createElement(`section`)
    section.setAttribute(`xmlns`, xmlns)
    section.setAttribute(`style`, style)
    section.innerHTML = parent.innerHTML

    const grand = parent.parentElement
    grand.innerHTML = ``
    grand.appendChild(section)
  })

  // 6. fix: mermaid 部分文本颜色被 stroke 覆盖
  clipboardDiv.innerHTML = clipboardDiv.innerHTML
    .replace(
      /<tspan([^>]*)>/g,
      `<tspan$1 style="fill: #333333 !important; color: #333333 !important; stroke: none !important;">`,
    )

  return clipboardDiv.innerHTML
}
