// Dispara o evento global 'showSnackbar', escutado pelo SnackbarGlobal
const showSnackbar = (message, severity = 'info') => {
  window.dispatchEvent(new CustomEvent('showSnackbar', {
    detail: { message, severity }
  }));
};
export default showSnackbar;
