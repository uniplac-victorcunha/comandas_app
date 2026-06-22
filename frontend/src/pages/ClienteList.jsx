import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Card, CardContent, Typography, Box, Divider } from '@mui/material';
import { FiberNew } from '@mui/icons-material';
import PageLayout from "../components/common/PageLayout";
import ActionButtons from "../components/common/ActionButtons";
import ClienteFilters from '../components/common/ClienteFilters';
import Pagination from '../components/common/Pagination';
import { clienteService } from '../services/clienteService';
import { useMasks } from '../hooks/useMasks';
import showSnackbar from '../utils/snackbar';
import showConfirm from '../utils/confirm';
// Definição do componente ClienteList
function ClienteList() {
  // Hook de navegação
  const navigate = useNavigate();
  // Hook de máscaras
  const { applyCpfMask, applyPhoneMask } = useMasks();
  // Estados do componente
  const [clientes, setClientes] = useState([]); // Lista de clientes da API
  const [loading, setLoading] = useState(true); // Estado de carregamento
  const [filters, setFilters] = useState({}); // Estados para filtros
  const [pagination, setPagination] = useState({ skip: 0, limit: 5, currentPage: 1 }); // Estados para paginação
  const [hasItems, setHasItems] = useState(true); // Controla se há itens na página atual, utilizado na paginação
  // Funções de navegação
  const handleView = (cliente) => navigate(`/cliente/view/${cliente.id}`);
  const handleEdit = (cliente) => navigate(`/cliente/edit/${cliente.id}`);
  // Funções de manipulação de filtros
  const handleFilter = (newFilters) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, skip: 0, currentPage: 1 }));
  };
  const handleClearFilters = () => {
    setFilters({});
    setPagination(prev => ({ ...prev, skip: 0, currentPage: 1 }));
  };
  // Funções de manipulação de paginação
  const handlePageChange = (newPage) => {
    const newSkip = (newPage - 1) * pagination.limit;
    setPagination(prev => ({ ...prev, skip: newSkip, currentPage: newPage }));
  };
  const handleItemsPerPageChange = (newLimit) => {
    setPagination(prev => ({ ...prev, limit: newLimit, skip: 0, currentPage: 1 }));
  };
  // Função de exclusão com confirmação
  const handleDelete = (cliente) => {
    showConfirm('Excluir Cliente', `Tem certeza que deseja excluir o cliente "${cliente.nome}"?`,
      async () => {
        try {
          await clienteService.delete(cliente.id);
          showSnackbar('Cliente excluído com sucesso!', 'success');
          const updatedClientes = clientes.filter(c => c.id !== cliente.id);
          setClientes(updatedClientes);
        } catch (error) {
          showSnackbar(error.apiMessage || 'Erro ao excluir cliente', 'error');
        }
      }
    );
  };
  // Configuração de ações da página
  const actions = (
    <Button variant="contained" color="primary" onClick={() => navigate('/cliente')} startIcon={<FiberNew />} sx={{ fontWeight: 600, px: 2, py: 1 }}>
      Novo
    </Button>
  );

  // Efeito para carregar clientes
  useEffect(() => {
    const loadClientes = async () => {
      try {
        setLoading(true);
        const params = { skip: pagination.skip, limit: pagination.limit, ...filters };
        const response = await clienteService.list(params);
        const clientesData = response.data || response;
        setClientes(clientesData);
        setHasItems(clientesData && clientesData.length > 0);
      } catch (error) {
        showSnackbar('Erro ao carregar clientes', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadClientes();
  }, [pagination.skip, pagination.limit, filters]);

  const columns = [
    { field: 'id', headerName: 'ID' },
    { field: 'nome', headerName: 'Nome' },
    { field: 'cpf', headerName: 'CPF' },
    { field: 'telefone', headerName: 'Telefone' },
    { field: 'actions', headerName: 'Ações', renderCell: (params) => <ActionButtons onView={handleView} onEdit={handleEdit} onDelete={handleDelete} item={params.row || {}} /> }
  ];

  // Renderização desktop: linha da tabela
  const renderDesktopRow = (cliente) => (
    <TableRow key={cliente.id} hover>
      {columns.map((column, index) => {
        if (column.field === 'id') return <TableCell key={index}>{cliente.id}</TableCell>;
        if (column.field === 'nome') return <TableCell key={index} sx={{ fontWeight: 500 }}>{cliente.nome}</TableCell>;
        if (column.field === 'cpf') return <TableCell key={index}>{applyCpfMask(cliente.cpf)}</TableCell>;
        if (column.field === 'telefone') return <TableCell key={index}>{applyPhoneMask(cliente.telefone)}</TableCell>;
        if (column.field === 'actions') return (
          <TableCell key={index}>
            <ActionButtons onView={handleView} onEdit={handleEdit} onDelete={handleDelete} item={cliente} />
          </TableCell>
        );
        return null;
      })}
    </TableRow>
  );

  // Renderização mobile: card
  const renderMobileCard = (cliente) => (
    <Card key={cliente.id} sx={{ mb: 2, elevation: 2 }}>
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 600 }}>
              {cliente.nome}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ID: {cliente.id}
            </Typography>
          </Box>
        </Box>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>CPF:</strong> {applyCpfMask(cliente.cpf)}
          </Typography>
          <Typography variant="body2">
            <strong>Telefone:</strong> {applyPhoneMask(cliente.telefone)}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <ActionButtons
            item={cliente}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <PageLayout title="Clientes" actions={actions}>
      {/* Componente de Filtros */}
      <ClienteFilters onFilter={handleFilter} onClear={handleClearFilters} filters={filters} />
      {/* Tabela Desktop */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                {columns.map((column, index) => (
                  <TableCell key={index} sx={{ fontWeight: 600 }}>
                    {column.headerName || column.header}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {clientes.map((cliente) => renderDesktopRow(cliente))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
      {/* Cards Mobile */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        {clientes.map((cliente) => renderMobileCard(cliente))}
      </Box>
      {/* Componente de Paginação */}
      <Pagination
        currentPage={pagination.currentPage}
        itemsPerPage={pagination.limit}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
        loading={loading}
        hasItems={hasItems}
      />
    </PageLayout>
  );
}
export default ClienteList;
