/**
 * useDeleteConfirmation - Hook for handling delete confirmations with error handling
 */

import { showDeleteConfirmation, showErrorAlert } from '@/lib/utils/alerts'
import { useCallback } from 'react'

type ItemType = 'program' | 'exercise'

type DeleteFunction = (id: string) => Promise<void>

/**
 * Hook that returns a function to show delete confirmation and handle deletion
 */
export function useDeleteConfirmation(
  itemType: ItemType,
  deleteFn: DeleteFunction
) {
  const handleDelete = useCallback(
    (id: string, itemName: string) => {
      showDeleteConfirmation(itemType, itemName, async () => {
        try {
          await deleteFn(id)
        } catch (error) {
          showErrorAlert("Couldn't delete", error)
        }
      })
    },
    [itemType, deleteFn]
  )

  return handleDelete
}
