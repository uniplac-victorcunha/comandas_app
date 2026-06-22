// Remove tudo que não for dígito
export const cleanCpf = (value = '') => value.replace(/\D/g, '').slice(0, 11);
export const cleanPhone = (value = '') => value.replace(/\D/g, '').slice(0, 11);
// Aplica máscara de CPF: 000.000.000-00
export const applyCpfMask = (value = '') => {
  const digits = cleanCpf(value);
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};
// Aplica máscara de Telefone: (00) 0000-0000 ou (00) 00000-0000
export const applyPhoneMask = (value = '') => {
  const digits = cleanPhone(value);
  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d{1,4})$/, '$1-$2');
  }
  return digits
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
};
// Hook reutilizável para máscaras de CPF e Telefone
export const useMasks = () => ({
  applyCpfMask,
  applyPhoneMask,
  cleanCpf,
  cleanPhone,
});
export default useMasks;
