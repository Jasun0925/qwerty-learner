export type ParsedWord = {
  name: string
  /** 用户在 `单词 | 释义` 中手动写的释义，为空时交给自动补全 */
  trans: string[]
}

export type ParseResult = {
  words: ParsedWord[]
  invalidLines: string[]
  duplicatedCount: number
}

const CHINESE_PATTERN = /[\u4e00-\u9fa5]/

/**
 * 解析批量录入的文本，每行一个单词，可用 `单词 | 释义` 手动指定释义
 */
export function parseWordInput(input: string): ParseResult {
  const words: ParsedWord[] = []
  const invalidLines: string[] = []
  const seen = new Set<string>()
  let duplicatedCount = 0

  input.split('\n').forEach((line) => {
    const trimmedLine = line.trim()
    if (trimmedLine === '') return

    const separatorIndex = trimmedLine.indexOf('|')
    const name = (separatorIndex === -1 ? trimmedLine : trimmedLine.slice(0, separatorIndex)).trim()
    const rawTrans = separatorIndex === -1 ? '' : trimmedLine.slice(separatorIndex + 1).trim()

    if (name === '' || CHINESE_PATTERN.test(name)) {
      invalidLines.push(trimmedLine)
      return
    }

    const key = name.toLowerCase()
    if (seen.has(key)) {
      duplicatedCount += 1
      return
    }
    seen.add(key)

    words.push({
      name,
      trans: rawTrans
        .split(/[;；]/)
        .map((item) => item.trim())
        .filter((item) => item !== ''),
    })
  })

  return { words, invalidLines, duplicatedCount }
}
