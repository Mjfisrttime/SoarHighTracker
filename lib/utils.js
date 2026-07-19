export function formatDate(dateString) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString();
}

export function showToast(message, type = 'info') {
  // For MVP, we use alert. You can upgrade this to react-hot-toast or similar later.
  if (typeof window !== 'undefined') {
    alert(`${type.toUpperCase()}: ${message}`);
  }
}
