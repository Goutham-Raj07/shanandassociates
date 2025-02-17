const handleSignIn = async (e) => {
  e.preventDefault();
  
  // Verify credentials
  const loginSuccess = await handleLogin(credentials);
  
  if (loginSuccess) {
    // Only navigate after explicit sign in
    navigate('/admin-dashboard');  // or whatever your dashboard route is
  }
} 