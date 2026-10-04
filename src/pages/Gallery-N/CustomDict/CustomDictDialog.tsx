import { parseWordInput } from './parseWordInput'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { Word } from '@/typings'
import type { ICustomDict } from '@/utils/db/custom-dict'
import { generateCustomDictId, saveCustomDict } from '@/utils/db/custom-dict'
import { lookupWords, releaseWordLookup } from '@/utils/wordLookup'
import { useCallback, useEffect, useMemo, useState } from 'react'

type CustomDictDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 传入时为编辑模式 */
  editingDict?: ICustomDict
}

const inputClassName =
  'w-full select-text rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition-colors placeholder:text-gray-400 focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-900 dark:text-gray-200'

export default function CustomDictDialog({ open, onOpenChange, editingDict }: CustomDictDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [rawWords, setRawWords] = useState('')
  const [isAutoFillTrans, setIsAutoFillTrans] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!open) return

    setName(editingDict?.name ?? '')
    setDescription(editingDict?.description ?? '')
    setRawWords(
      editingDict?.words.map((word) => (word.trans.length > 0 ? `${word.name} | ${word.trans.join('；')}` : word.name)).join('\n') ?? '',
    )
    setIsAutoFillTrans(true)
    setErrorMessage('')
  }, [open, editingDict])

  const parseResult = useMemo(() => parseWordInput(rawWords), [rawWords])

  const onSubmit = useCallback(async () => {
    const trimmedName = name.trim()
    if (trimmedName === '') {
      setErrorMessage('请填写词库名称')
      return
    }
    if (parseResult.words.length === 0) {
      setErrorMessage('请至少录入一个单词')
      return
    }

    setIsSaving(true)
    setErrorMessage('')

    try {
      const existingWordMap = new Map((editingDict?.words ?? []).map((word) => [word.name.toLowerCase(), word]))

      const needLookupNames = isAutoFillTrans
        ? parseResult.words
            .filter((word) => word.trans.length === 0 && (existingWordMap.get(word.name.toLowerCase())?.trans.length ?? 0) === 0)
            .map((word) => word.name)
        : []

      const lookupResults = needLookupNames.length > 0 ? await lookupWords(needLookupNames) : []
      const lookupMap = new Map(lookupResults.map((result) => [result.word.name.toLowerCase(), result.word]))

      const words: Word[] = parseResult.words.map(({ name: wordName, trans }) => {
        const key = wordName.toLowerCase()
        const existingWord = existingWordMap.get(key)
        const lookedUpWord = lookupMap.get(key)
        const phonetic = existingWord?.usphone || existingWord?.ukphone ? existingWord : lookedUpWord

        return {
          name: wordName,
          trans: trans.length > 0 ? trans : existingWord?.trans.length ? existingWord.trans : lookedUpWord?.trans ?? [],
          usphone: phonetic?.usphone ?? '',
          ukphone: phonetic?.ukphone ?? '',
        }
      })

      const now = Date.now()
      await saveCustomDict({
        id: editingDict?.id ?? generateCustomDictId(),
        name: trimmedName,
        description: description.trim(),
        language: 'en',
        languageCategory: 'en',
        words,
        createTime: editingDict?.createTime ?? now,
        updateTime: now,
      })

      onOpenChange(false)
    } catch (error) {
      console.error('保存自定义词库失败：', error)
      setErrorMessage('保存失败，请重试')
    } finally {
      releaseWordLookup()
      setIsSaving(false)
    }
  }, [name, description, parseResult.words, isAutoFillTrans, editingDict, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[40rem] max-w-none !rounded-[20px]">
        <DialogHeader>
          <DialogTitle className="text-gray-800 dark:text-gray-200">{editingDict ? '编辑词库' : '新建词库'}</DialogTitle>
          <DialogDescription>
            一行一个单词，保存时会自动从本地词库补全释义和音标。想自己写释义就用 <code className="font-mono">单词 | 释义</code> 的格式。
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex gap-3">
            <input
              className={inputClassName}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="词库名称，如：面试高频词"
              maxLength={30}
            />
            <input
              className={inputClassName}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="描述（选填）"
              maxLength={60}
            />
          </div>

          <textarea
            className={`${inputClassName} h-72 resize-none font-mono leading-7`}
            value={rawWords}
            onChange={(e) => setRawWords(e.target.value)}
            placeholder={'cancel\nexplosive\nnumerous | 众多的'}
            spellCheck={false}
          />

          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 cursor-pointer accent-indigo-400"
                checked={isAutoFillTrans}
                onChange={(e) => setIsAutoFillTrans(e.target.checked)}
              />
              自动补全释义与音标
            </label>
            <p>
              已识别 {parseResult.words.length} 词{parseResult.duplicatedCount > 0 && `，已去重 ${parseResult.duplicatedCount} 个`}
              {parseResult.invalidLines.length > 0 && `，${parseResult.invalidLines.length} 行无法识别已忽略`}
            </p>
          </div>

          {errorMessage !== '' && <p className="text-sm text-red-500">{errorMessage}</p>}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSaving}>
            取消
          </Button>
          <Button onClick={onSubmit} disabled={isSaving}>
            {isSaving ? '正在匹配释义…' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
