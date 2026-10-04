import { wordListFetcher } from './wordListFetcher'
import type { Word } from '@/typings'

/** 按优先级排列，靠前词库的释义会覆盖靠后的 */
const LOOKUP_DICT_URLS = ['/dicts/coca20000.json', '/dicts/Oxford5000.json']

/** 部分词库把词形变化也塞进了 trans，这类条目对打字练习没有意义 */
const TRANS_METADATA_PATTERN = /^(时态|名\s*词|形容词|副\s*词|动\s*词|复数|过去式|第三人称)\s*[:：]/

let lookupMapPromise: Promise<Map<string, Word>> | undefined

function normalizeKey(name: string) {
  return name.trim().toLowerCase()
}

function sanitizeTrans(trans: Word['trans']) {
  if (!Array.isArray(trans)) return []
  return trans.filter((item) => typeof item === 'string' && item.trim() !== '' && !TRANS_METADATA_PATTERN.test(item))
}

async function buildLookupMap(): Promise<Map<string, Word>> {
  const map = new Map<string, Word>()

  for (const url of LOOKUP_DICT_URLS) {
    try {
      const words = await wordListFetcher(url)
      words.forEach((word) => {
        const key = normalizeKey(word.name)
        if (key && !map.has(key)) {
          map.set(key, word)
        }
      })
    } catch (error) {
      console.error(`加载释义词库 ${url} 失败：`, error)
    }
  }

  return map
}

export function preloadWordLookup() {
  if (!lookupMapPromise) {
    lookupMapPromise = buildLookupMap()
  }
  return lookupMapPromise
}

/** 释义词库体积较大，用完后释放掉引用 */
export function releaseWordLookup() {
  lookupMapPromise = undefined
}

export type LookupResult = {
  word: Word
  matched: boolean
}

/**
 * 在本地词库中反查释义与音标，查不到的词返回只有拼写的空壳
 */
export async function lookupWords(names: string[]): Promise<LookupResult[]> {
  const map = await preloadWordLookup()

  return names.map((name) => {
    const hit = map.get(normalizeKey(name))
    if (!hit) {
      return { word: { name, trans: [], usphone: '', ukphone: '' }, matched: false }
    }

    const trans = sanitizeTrans(hit.trans)
    return {
      // 保留用户录入的大小写，释义和音标取词库的
      word: { name, trans, usphone: hit.usphone ?? '', ukphone: hit.ukphone ?? '' },
      matched: trans.length > 0,
    }
  })
}
