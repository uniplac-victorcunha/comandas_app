import api from './api';
import { API_ENDPOINTS } from '../config/apiConfig';
// Extrair apenas endpoints utilizados no service
const { RECEBIMENTO } = API_ENDPOINTS;
// Serviços de recebimento (Caixa)
const recebimentoService = {
  // Dashboard com todas as comandas abertas
  dashboard: async () => {
    const response = await api.get(RECEBIMENTO.DASHBOARD);
    return response.data;
  },
  // Detalhar uma ou mais comandas selecionadas para conferência
  detalhe: async (comandasIds) => {
    const ids = comandasIds.join(',');
    const response = await api.get(RECEBIMENTO.DETALHE.replace(':ids', ids));
    return response.data;
  },
  // Processar o recebimento completo (com desconto/acréscimo)
  receber: async (recebimentoData) => {
    const response = await api.post(RECEBIMENTO.RECEBER, recebimentoData);
    return response.data;
  },
  // Gerar comprovante de um recebimento já realizado
  comprovante: async (recebimentoId) => {
    const response = await api.get(RECEBIMENTO.COMPROVANTE.replace(':id', recebimentoId));
    return response.data;
  }
};
export default recebimentoService;
