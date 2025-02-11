import { toast } from 'sonner'
import { handleError } from './error-handler'

export async function apiRequest<T>(
  requestFn: () => Promise<T>,
  {
    loadingMessage = 'Processing...',
    successMessage,
    errorMessage = 'Operation failed',
    showLoading = true
  }: {
    loadingMessage?: string
    successMessage?: string
    errorMessage?: string
    showLoading?: boolean
  }
): Promise<T | null> {
  const toastId = showLoading ? toast.loading(loadingMessage) : undefined

  try {
    const result = await requestFn()
    if (successMessage) {
      toast.success(successMessage)
    }
    return result
  } catch (error: any) {
    const errorMsg = handleError(error)
    toast.error(errorMessage, {
      description: errorMsg
    })
    return null
  } finally {
    if (toastId) {
      toast.dismiss(toastId)
    }
  }
} 