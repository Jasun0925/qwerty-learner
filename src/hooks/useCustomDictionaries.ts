import { customDictionariesAtom, isCustomDictionariesLoadedAtom } from '@/store'
import type { Dictionary } from '@/typings'
import { db } from '@/utils/db'
import { customDictToDictionary } from '@/utils/db/custom-dict'
import { useLiveQuery } from 'dexie-react-hooks'
import { useSetAtom } from 'jotai'
import { useEffect } from 'react'

/**
 * 把 IndexedDB 中的自定义词库同步到 store，使其与内置词库一起参与 id 查找。
 * 需要在应用根组件挂载一次。
 */
export function useSyncCustomDictionaries() {
  const setCustomDictionaries = useSetAtom(customDictionariesAtom)
  const setIsLoaded = useSetAtom(isCustomDictionariesLoadedAtom)

  const customDictionaries = useLiveQuery<Dictionary[]>(async () => {
    try {
      return (await db.customDicts.orderBy('createTime').toArray()).map(customDictToDictionary)
    } catch (error) {
      console.error('读取自定义词库失败：', error)
      return []
    }
  }, [])

  useEffect(() => {
    if (!customDictionaries) return

    setCustomDictionaries(customDictionaries)
    setIsLoaded(true)
  }, [customDictionaries, setCustomDictionaries, setIsLoaded])
}
