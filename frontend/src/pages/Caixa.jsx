import { useState, useEffect } from 'react';
import {
  Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, TableContainer,
  Paper, Checkbox, Button, Card, CardContent, Divider, TextField, CircularProgress, Avatar
} from '@mui/material';
import { PointOfSale, Receipt as ReceiptIcon, Print as PrintIcon } from '@mui/icons-material';
import PageLayout from '../components/common/PageLayout';
import recebimentoService from '../services/recebimentoService';
import showSnackbar from '../utils/snackbar';
import { useAuth } from '../context/AuthContext';
// Definição do componente Caixa
const Caixa = () => {
  // Hook de autenticação
  const { user } = useAuth();
  // Estados do componente
  const [comandas, setComandas] = useState([]); // Comandas abertas do dashboard
  const [loading, setLoading] = useState(true); // Carregamento inicial do dashboard
  const [selecionadas, setSelecionadas] = useState([]); // IDs das comandas selecionadas pelo caixa
  const [detalhe, setDetalhe] = useState(null); // Detalhe das comandas selecionadas (conferência)
  const [loadingDetalhe, setLoadingDetalhe] = useState(false); // Carregamento da conferência
  const [clienteId, setClienteId] = useState(''); // Cliente informado no recebimento (opcional)
  const [descontoValor, setDescontoValor] = useState(''); // Valor de desconto
  const [acrescimoValor, setAcrescimoValor] = useState(''); // Valor de acréscimo
  const [processando, setProcessando] = useState(false); // Estado de processamento do recebimento
  const [comprovante, setComprovante] = useState(null); // Comprovante gerado após o recebimento
  // Funções utilitárias
  const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  // Carregar dashboard de comandas abertas
  const carregarDashboard = async () => {
    try {
      setLoading(true);
      const data = await recebimentoService.dashboard();
      setComandas(data);
    } catch (error) {
      const mensagem = error.apiMessage || 'Erro ao carregar comandas abertas';
      showSnackbar(mensagem, 'error');
    } finally {
      setLoading(false);
    }
  };
  // Efeito para carregar o dashboard ao montar o componente
  useEffect(() => {
    const carregarDashboardInicial = async () => {
      await carregarDashboard();
    };
    carregarDashboardInicial();
  }, []);
  // Função para selecionar/desmarcar uma comanda do dashboard
  const handleToggleSelecionada = (id) => {
    setSelecionadas((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
    setDetalhe(null);
  };
  // Função para conferir as comandas selecionadas antes do recebimento
  const handleConferir = async () => {
    if (selecionadas.length === 0) {
      showSnackbar('Selecione ao menos uma comanda para conferência', 'warning');
      return;
    }
    try {
      setLoadingDetalhe(true);
      const data = await recebimentoService.detalhe(selecionadas);
      setDetalhe(data);
    } catch (error) {
      const mensagem = error.apiMessage || 'Erro ao conferir comandas selecionadas';
      showSnackbar(mensagem, 'error');
    } finally {
      setLoadingDetalhe(false);
    }
  };
  // Valor total das comandas em conferência
  const totalGeral = (detalhe || []).reduce((acc, comanda) => acc + Number(comanda.total), 0);
  // Valor final, considerando desconto e acréscimo informados
  const valorFinal = totalGeral - (parseFloat(descontoValor) || 0) + (parseFloat(acrescimoValor) || 0);
  // Função para finalizar o recebimento das comandas em conferência
  const handleFinalizarRecebimento = async () => {
    setProcessando(true);
    try {
      const payload = {
        comandas_ids: selecionadas,
        cliente_id: clienteId ? parseInt(clienteId) : null,
        funcionario_id: user?.id,
        desconto_valor: descontoValor ? parseFloat(descontoValor) : null,
        acrescimo_valor: acrescimoValor ? parseFloat(acrescimoValor) : null
      };
      const resultado = await recebimentoService.receber(payload);
      showSnackbar(resultado.mensagem || 'Recebimento realizado com sucesso!', 'success');
      const comprovanteData = await recebimentoService.comprovante(resultado.recebimento_id);
      setComprovante(comprovanteData);
      // Limpar seleção e formulário após concluir
      setSelecionadas([]);
      setDetalhe(null);
      setClienteId('');
      setDescontoValor('');
      setAcrescimoValor('');
      carregarDashboard();
    } catch (error) {
      const mensagem = error.apiMessage || 'Erro ao processar recebimento';
      showSnackbar(mensagem, 'error');
    } finally {
      setProcessando(false);
    }
  };
  // Função para iniciar um novo recebimento, voltando ao dashboard
  const handleNovoRecebimento = () => {
    setComprovante(null);
  };
  // Renderizar loading inicial
  if (loading) {
    return (
      <PageLayout title="Caixa">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </PageLayout>
    );
  }
  // Renderizar comprovante após recebimento concluído
  if (comprovante) {
    return (
      <PageLayout title="Comprovante de Recebimento">
        <Box sx={{ maxWidth: 500, mx: 'auto' }}>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h6" align="center" sx={{ fontWeight: 700 }}>
              {comprovante.cabecalho.sistema}
            </Typography>
            <Typography variant="body2" align="center" color="text.secondary" gutterBottom>
              {comprovante.cabecalho.titulo}
            </Typography>
            <Typography variant="body2" align="center" color="text.secondary">
              Recebimento Nº {comprovante.cabecalho.recebimento_id}
            </Typography>
            <Typography variant="body2" align="center" color="text.secondary" gutterBottom>
              {new Date(comprovante.cabecalho.data_hora).toLocaleString('pt-BR')}
            </Typography>
            <Divider sx={{ my: 2 }} />
            {comprovante.cliente && (
              <Typography variant="body2" gutterBottom>Cliente: {comprovante.cliente.nome}</Typography>
            )}
            <Typography variant="body2" gutterBottom>Funcionário: {comprovante.funcionario.nome}</Typography>
            <Divider sx={{ my: 2 }} />
            {comprovante.comandas.map((comandaPaga) => (
              <Box key={comandaPaga.comanda_id} sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Comanda {comandaPaga.comanda}
                </Typography>
                <Table size="small">
                  <TableBody>
                    {comandaPaga.itens.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell sx={{ pl: 0, border: 0 }}>{item.quantidade}x {item.nome}</TableCell>
                        <TableCell align="right" sx={{ pr: 0, border: 0 }}>{formatCurrency(item.valor_total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Subtotal</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatCurrency(comandaPaga.subtotal)}</Typography>
                </Box>
              </Box>
            ))}
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">Subtotal Geral</Typography>
              <Typography variant="body2">{formatCurrency(comprovante.resumo_valores.subtotal_geral)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">Desconto</Typography>
              <Typography variant="body2" color="error.main">- {formatCurrency(comprovante.resumo_valores.desconto_total)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">Acréscimo</Typography>
              <Typography variant="body2" color="success.main">+ {formatCurrency(comprovante.resumo_valores.acrescimo_total)}</Typography>
            </Box>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h6">Total</Typography>
              <Typography variant="h6" color="success.main">{formatCurrency(comprovante.resumo_valores.valor_final)}</Typography>
            </Box>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body2" align="center" color="text.secondary">
              {comprovante.rodape.mensagem}
            </Typography>
          </Paper>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3 }}>
            <Button variant="outlined" startIcon={<PrintIcon />} onClick={() => window.print()}>Imprimir</Button>
            <Button variant="contained" onClick={handleNovoRecebimento}>Novo Recebimento</Button>
          </Box>
        </Box>
      </PageLayout>
    );
  }
  // Renderizar dashboard do caixa - return
  return (
    <PageLayout title="Caixa">
      <Typography variant="h6" sx={{ mb: 2 }}>Comandas Abertas</Typography>
      {comandas.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
          Nenhuma comanda aberta no momento
        </Typography>
      ) : (
        <>
          {/* Tabela Desktop */}
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <TableContainer component={Paper} sx={{ mb: 3 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox" />
                    <TableCell>Comanda</TableCell>
                    <TableCell>Cliente</TableCell>
                    <TableCell>Itens</TableCell>
                    <TableCell>Total</TableCell>
                    <TableCell>Abertura</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {comandas.map((comanda) => (
                    <TableRow key={comanda.id} hover selected={selecionadas.includes(comanda.id)} onClick={() => handleToggleSelecionada(comanda.id)} sx={{ cursor: 'pointer' }}>
                      <TableCell padding="checkbox">
                        <Checkbox checked={selecionadas.includes(comanda.id)} onChange={() => handleToggleSelecionada(comanda.id)} onClick={(e) => e.stopPropagation()} />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{comanda.comanda}</TableCell>
                      <TableCell>{comanda.cliente?.nome || '-'}</TableCell>
                      <TableCell>{comanda.quantidade_produtos}</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: 'success.main' }}>{formatCurrency(comanda.total)}</TableCell>
                      <TableCell>{new Date(comanda.data_hora).toLocaleString('pt-BR')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
          {/* Cards Mobile */}
          <Box sx={{ display: { xs: 'block', md: 'none' } }}>
            {comandas.map((comanda) => (
              <Card
                key={comanda.id}
                sx={{ mb: 2, border: selecionadas.includes(comanda.id) ? '2px solid' : '1px solid transparent', borderColor: selecionadas.includes(comanda.id) ? 'primary.main' : 'transparent', cursor: 'pointer' }}
                onClick={() => handleToggleSelecionada(comanda.id)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>Comanda {comanda.comanda}</Typography>
                      <Typography variant="body2" color="text.secondary">{comanda.cliente?.nome || 'Cliente não identificado'}</Typography>
                      <Typography variant="body2" color="text.secondary">{comanda.quantidade_produtos} item(ns)</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Checkbox checked={selecionadas.includes(comanda.id)} onChange={() => handleToggleSelecionada(comanda.id)} onClick={(e) => e.stopPropagation()} />
                      <Typography variant="body1" sx={{ fontWeight: 700, color: 'success.main' }}>{formatCurrency(comanda.total)}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </>
      )}
      {/* Botão de conferência das comandas selecionadas */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button variant="contained" startIcon={<ReceiptIcon />} disabled={selecionadas.length === 0 || loadingDetalhe} onClick={handleConferir}>
          {loadingDetalhe ? 'Conferindo...' : `Conferir Selecionadas (${selecionadas.length})`}
        </Button>
      </Box>
      {/* Conferência das comandas selecionadas e formulário de recebimento */}
      {detalhe && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Conferência</Typography>
          {detalhe.map((comandaDetalhe) => (
            <Paper key={comandaDetalhe.id} variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Comanda {comandaDetalhe.comanda} {comandaDetalhe.cliente ? `- ${comandaDetalhe.cliente.nome}` : ''}
              </Typography>
              <TableContainer sx={{ mt: 1 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Foto</TableCell>
                      <TableCell>Produto</TableCell>
                      <TableCell>Qtd</TableCell>
                      <TableCell>Valor Unit.</TableCell>
                      <TableCell>Subtotal</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {comandaDetalhe.produtos.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Avatar src={item.produto?.foto || undefined} variant="rounded" sx={{ width: 40, height: 40 }}>
                            {!item.produto?.foto && (item.produto?.nome?.charAt(0) || '?')}
                          </Avatar>
                        </TableCell>
                        <TableCell>{item.produto?.nome || `Produto #${item.produto_id}`}</TableCell>
                        <TableCell>{item.quantidade}</TableCell>
                        <TableCell>{formatCurrency(item.valor_unitario)}</TableCell>
                        <TableCell>{formatCurrency(item.quantidade * item.valor_unitario)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>Total da Comanda: {formatCurrency(comandaDetalhe.total)}</Typography>
              </Box>
            </Paper>
          ))}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Typography variant="h6">Valor Total: {formatCurrency(totalGeral)}</Typography>
          </Box>
          {/* Formulário de recebimento */}
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Recebimento</Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
              <TextField label="Cliente (ID, opcional)" type="number" value={clienteId} onChange={(e) => setClienteId(e.target.value)} sx={{ minWidth: 200 }} disabled={processando} />
              <TextField label="Desconto (R$)" type="number" value={descontoValor} onChange={(e) => setDescontoValor(e.target.value)} sx={{ minWidth: 200 }} disabled={processando} />
              <TextField label="Acréscimo (R$)" type="number" value={acrescimoValor} onChange={(e) => setAcrescimoValor(e.target.value)} sx={{ minWidth: 200 }} disabled={processando} />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="body1">Valor Final</Typography>
              <Typography variant="h6" color="success.main">{formatCurrency(valorFinal)}</Typography>
            </Box>
            <Button variant="contained" color="success" startIcon={<PointOfSale />} fullWidth disabled={processando} onClick={handleFinalizarRecebimento}>
              {processando ? 'Processando...' : 'Finalizar Recebimento'}
            </Button>
          </Paper>
        </Box>
      )}
    </PageLayout>
  );
};
export default Caixa;
