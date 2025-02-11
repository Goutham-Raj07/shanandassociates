// Create a utility for consistent error handling
export function handleError(error: any) {
  console.error('Error:', error)
  
  if (error.code === 'PGRST301') {
    return 'Authentication required. Please sign in again.'
  }
  
  if (error.code === '23505') {
    return 'This record already exists.'
  }
  
  if (error.code === '23503') {
    return 'Related record not found.'
  }

  return error.message || 'An unexpected error occurred'
} 