import CustomDictDialog from './CustomDictDialog'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { Dictionary } from '@/typings'
import type { ICustomDict } from '@/utils/db/custom-dict'
import { deleteCustomDict, getCustomDict } from '@/utils/db/custom-dict'
import type { MouseEvent } from 'react'
import { useCallback, useState } from 'react'
import IconPencil from '~icons/tabler/pencil'
import IconTrash from '~icons/tabler/trash'

type CustomDictActionsProps = {
  dictionary: Dictionary
  isSelected: boolean
}

export default function CustomDictActions({ dictionary, isSelected }: CustomDictActionsProps) {
  const [editingDict, setEditingDict] = useState<ICustomDict>()
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const onClickEdit = useCallback(
    async (e: MouseEvent) => {
      // 阻止冒泡到卡片，避免同时弹出词库详情
      e.stopPropagation()
      const dict = await getCustomDict(dictionary.id)
      if (!dict) return

      setEditingDict(dict)
      setIsEditDialogOpen(true)
    },
    [dictionary.id],
  )

  const onClickDelete = useCallback((e: MouseEvent) => {
    e.stopPropagation()
    setIsDeleteDialogOpen(true)
  }, [])

  const onConfirmDelete = useCallback(async () => {
    setIsDeleting(true)
    try {
      await deleteCustomDict(dictionary.id)
      setIsDeleteDialogOpen(false)
    } catch (error) {
      console.error('删除自定义词库失败：', error)
    } finally {
      setIsDeleting(false)
    }
  }, [dictionary.id])

  const iconClassName = `rounded p-1 transition-colors ${
    isSelected ? 'text-white hover:bg-indigo-500' : 'text-gray-400 hover:bg-indigo-100 hover:text-indigo-500 dark:hover:bg-gray-600'
  }`

  return (
    <div className="absolute right-0 top-0 flex items-center gap-1">
      <button type="button" className={iconClassName} onClick={onClickEdit} title="编辑词库">
        <IconPencil className="h-4 w-4" />
      </button>
      <button type="button" className={iconClassName} onClick={onClickDelete} title="删除词库">
        <IconTrash className="h-4 w-4" />
      </button>

      <CustomDictDialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} editingDict={editingDict} />

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="!rounded-[20px]" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle className="text-gray-800 dark:text-gray-200">删除「{dictionary.name}」</DialogTitle>
            <DialogDescription>该词库的单词和练习记录都会被一并删除，且无法恢复。</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDeleteDialogOpen(false)} disabled={isDeleting}>
              取消
            </Button>
            <Button variant="destructive" onClick={onConfirmDelete} disabled={isDeleting}>
              {isDeleting ? '删除中…' : '确认删除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
