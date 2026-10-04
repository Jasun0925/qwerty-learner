import { getCustomDictIdFromUrl, getCustomDictWords, isCustomDictUrl } from './db/custom-dict'
import type { Word } from '@/typings'

export async function wordListFetcher(url: string): Promise<Word[]> {
  // 自定义词库的词存在 IndexedDB 里，用 custom: 伪协议复用 SWR 的缓存 key
  if (isCustomDictUrl(url)) {
    return getCustomDictWords(getCustomDictIdFromUrl(url))
  }

  const URL_PREFIX: string = REACT_APP_DEPLOY_ENV === 'pages' ? '/qwerty-learner' : ''

  const response = await fetch(URL_PREFIX + url)
  const words: Word[] = await response.json()
  return words
}
