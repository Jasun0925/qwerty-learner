import { db } from '.'
import type { Dictionary, LanguageCategoryType, LanguageType, Word } from '@/typings'
import { calcChapterCount } from '@/utils'

export const CUSTOM_DICT_ID_PREFIX = 'custom_'
export const CUSTOM_DICT_URL_PREFIX = 'custom:'
export const CUSTOM_DICT_CATEGORY = '我的词库'
export const CUSTOM_DICT_TAG = '自定义'

export interface ICustomDict {
  id: string
  name: string
  description: string
  language: LanguageType
  languageCategory: LanguageCategoryType
  words: Word[]
  createTime: number
  updateTime: number
}

export function isCustomDictId(id: string) {
  return id.startsWith(CUSTOM_DICT_ID_PREFIX)
}

export function isCustomDictUrl(url: string) {
  return url.startsWith(CUSTOM_DICT_URL_PREFIX)
}

export function getCustomDictIdFromUrl(url: string) {
  return url.slice(CUSTOM_DICT_URL_PREFIX.length)
}

export function generateCustomDictId(): string {
  return `${CUSTOM_DICT_ID_PREFIX}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}

export function customDictToDictionary(customDict: ICustomDict): Dictionary {
  return {
    id: customDict.id,
    name: customDict.name,
    description: customDict.description || '自定义词库',
    category: CUSTOM_DICT_CATEGORY,
    tags: [CUSTOM_DICT_TAG],
    url: `${CUSTOM_DICT_URL_PREFIX}${customDict.id}`,
    length: customDict.words.length,
    language: customDict.language,
    languageCategory: customDict.languageCategory,
    chapterCount: calcChapterCount(customDict.words.length),
    isCustom: true,
  }
}

export function getCustomDicts(): Promise<ICustomDict[]> {
  return db.customDicts.orderBy('createTime').toArray()
}

export function getCustomDict(id: string): Promise<ICustomDict | undefined> {
  return db.customDicts.get(id)
}

export async function getCustomDictWords(id: string): Promise<Word[]> {
  const dict = await db.customDicts.get(id)
  return dict?.words ?? []
}

export async function saveCustomDict(dict: ICustomDict): Promise<void> {
  await db.customDicts.put(dict)
}

/**
 * 删除自定义词库时一并清掉它的练习记录，避免留下无法溯源的孤儿数据
 */
export async function deleteCustomDict(id: string): Promise<void> {
  await db.transaction('rw', db.customDicts, db.wordRecords, db.chapterRecords, db.reviewRecords, async () => {
    await db.customDicts.delete(id)
    await db.wordRecords.where('dict').equals(id).delete()
    await db.chapterRecords.where('dict').equals(id).delete()
    await db.reviewRecords.where('dict').equals(id).delete()
  })
}
