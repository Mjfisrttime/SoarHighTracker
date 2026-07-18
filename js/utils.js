/* Helper Utils */
const Utils = {
    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString();
    },
    showToast(message, type = 'info') {
        alert(`${type.toUpperCase()}: ${message}`);
    }
};
