// Add this function to handle cleanup on window close
window.addEventListener('beforeunload', function() {
  // Clear any stored auth tokens or login state
  localStorage.removeItem('authToken');
  sessionStorage.removeItem('authToken');
  // Clear any other auth-related data you might be storing
  localStorage.removeItem('user');
  sessionStorage.clear();
});

// Modify your login check function to not auto-login
const checkLoginStatus = () => {
  // Remove the sessionStorage check since we don't want any auto-login
  return false;  // Default to not logged in
}

// Add a specific login function that will be called when user clicks sign in
const handleLogin = (credentials) => {
  // Verify credentials here
  if (validCredentials) {
    sessionStorage.setItem('authToken', token);
    // Don't automatically redirect - let the login component handle navigation
    return true;
  }
  return false;
} 