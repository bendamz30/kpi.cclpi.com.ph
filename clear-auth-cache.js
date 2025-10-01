// Simple script to clear authentication cache
// Run this in browser console to clear cached user data

console.log('Clearing authentication cache...');

// Clear localStorage
localStorage.removeItem('auth_token');
localStorage.removeItem('auth_user');

console.log('Authentication cache cleared. Please refresh the page and log in again.');

// Refresh the page
window.location.reload();
