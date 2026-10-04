import CustomDictDialog from './CustomDictDialog'
import { useState } from 'react'
import IconPlus from '~icons/tabler/plus'

export default function CreateCustomDictButton() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setIsDialogOpen(true)}
        className="flex items-center space-x-2 rounded-lg border border-indigo-200 bg-white px-4 py-2.5 text-sm font-medium text-indigo-600 shadow-sm transition-all duration-200 hover:scale-105 hover:border-indigo-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-indigo-400 dark:bg-gray-800 dark:text-indigo-400 dark:hover:bg-gray-700"
      >
        <IconPlus className="h-4 w-4" />
        <span>新建词库</span>
      </button>
      <CustomDictDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </>
  )
}
