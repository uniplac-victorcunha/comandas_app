import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Card, CardContent, Typography, Box, Divider, Chip } from '@mui/material';
import { FiberNew } from '@mui/icons-material';
import PageLayout from "../components/common/PageLayout";
import ActionButtons from "../components/common/ActionButtons";
import FuncionarioFilters from '../components/common/FuncionarioFilters';
import Pagination from '../components/common/Pagination';
import { funcionarioService } from '../services/funcionarioService';
import { getGrupoInfo } from '../constants/userGroups';
import { useMasks } from '../hooks/useMasks';
import showSnackbar from '../utils/snackbar';
import showConfirm from '../utils/confirm';
// Definição do componente FuncionarioList
function FuncionarioList() {
  // Hook de navegação
  const navigate = useNavigate();
  // Hook de máscaras
  const { applyCpfMask, applyPhoneMask } = useMasks();
  // Estados do componente
  const [funcionarios, setFuncionarios] = useState([]); // Lista de funcionários da API
  const [loading, setLoading] = useState(true); // Estado de carregamento
  const [filters, setFilters] = useState({}); // Estados para filtros
  const [pagination, setPagination] = useState({ skip: 0, limit: 5, currentPage: 1 }); // Estados para paginação
  const [hasItems, setHasItems] = useState(true); // Controla se há itens na página atual, utilizado na paginação
  // Funções de navegação
  const handleView = (funcionario) => navigate(`/funcionario/view/${funcionario.id}`);
  const handleEdit = (funcionario) => navigate(`/funcionario/edit/${funcionario.id}`);
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
  const handleDelete = (funcionario) => {
    showConfirm('Excluir Funcionário', `Tem certeza que deseja excluir o funcionário "${funcionario.nome}"?`,
      async () => {
        try {
          await funcionarioService.delete(funcionario.id);
          showSnackbar('Funcionário excluído com sucesso!', 'success');
          const updatedFuncionarios = funcionarios.filter(f => f.id !== funcionario.id);
          setFuncionarios(updatedFuncionarios);
        } catch (error) {
          showSnackbar(error.apiMessage || 'Erro ao excluir funcionário', 'error');
        }
      }
    );
  };
  // Configuração de ações da página
  const actions = (
    <Button variant="contained" color="primary" onClick={() => navigate('/funcionario')} startIcon={<FiberNew />} sx={{ fontWeight: 600, px: 2, py: 1 }}>
      Novo
    </Button>
  );

  // Efeito para carregar funcionários
  useEffect(() => {
    const loadFuncionarios = async () => {
      try {
        setLoading(true);
        const params = { skip: pagination.skip, limit: pagination.limit, ...filters };
        const response = await funcionarioService.list(params);
        const funcionariosData = response.data || response;
        setFuncionarios(funcionariosData);
        setHasItems(funcionariosData && funcionariosData.length > 0);
      } catch (error) {
        showSnackbar('Erro ao carregar funcionários', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadFuncionarios();
  }, [pagination.skip, pagination.limit, filters]);

  const columns = [
    { field: 'id', headerName: 'ID' },
    { field: 'nome', headerName: 'Nome' },
    { field: 'matricula', headerName: 'Matrícula' },
    { field: 'cpf', headerName: 'CPF' },
    { field: 'telefone', headerName: 'Telefone' },
    { field: 'grupo', headerName: 'Grupo' },
    { field: 'actions', headerName: 'Ações', renderCell: (params) => <ActionButtons onView={handleView} onEdit={handleEdit} onDelete={handleDelete} item={params.row || {}} /> }
  ];

  // Renderização desktop: linha da tabela
  const renderDesktopRow = (funcionario) => (
    <TableRow key={funcionario.id} hover>
      {columns.map((column, index) => {
        if (column.field === 'id') return <TableCell key={index}>{funcionario.id}</TableCell>;
        if (column.field === 'nome') return <TableCell key={index} sx={{ fontWeight: 500 }}>{funcionario.nome}</TableCell>;
        if (column.field === 'matricula') return <TableCell key={index}>{funcionario.matricula}</TableCell>;
        if (column.field === 'cpf') return <TableCell key={index}>{applyCpfMask(funcionario.cpf)}</TableCell>;
        if (column.field === 'telefone') return <TableCell key={index}>{applyPhoneMask(funcionario.telefone)}</TableCell>;
        if (column.field === 'grupo') return <TableCell key={index}><Chip label={getGrupoInfo(funcionario.grupo).label} color={getGrupoInfo(funcionario.grupo).color} size="small" /></TableCell>;
        if (column.field === 'actions') return (
          <TableCell key={index}>
            <ActionButtons onView={handleView} onEdit={handleEdit} onDelete={handleDelete} item={funcionario} />
          </TableCell>
        );
        return null;
      })}
    </TableRow>
  );

  // Renderização mobile: card
  const renderMobileCard = (funcionario) => (
    <Card key={funcionario.id} sx={{ mb: 2, elevation: 2 }}>
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 600 }}>
              {funcionario.nome}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ID: {funcionario.id}
            </Typography>
          </Box>
          <Chip label={getGrupoInfo(funcionario.grupo).label} color={getGrupoInfo(funcionario.grupo).color} size="small" />
        </Box>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Matrícula:</strong> {funcionario.matricula}
          </Typography>
          <Typography variant="body2">
            <strong>CPF:</strong> {applyCpfMask(funcionario.cpf)}
          </Typography>
          <Typography variant="body2">
            <strong>Telefone:</strong> {applyPhoneMask(funcionario.telefone)}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <ActionButtons
            item={funcionario}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <PageLayout title="Funcionários" actions={actions}>
      {/* Componente de Filtros */}
      <FuncionarioFilters onFilter={handleFilter} onClear={handleClearFilters} filters={filters} />
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
              {funcionarios.map((funcionario) => renderDesktopRow(funcionario))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
      {/* Cards Mobile */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        {funcionarios.map((funcionario) => renderMobileCard(funcionario))}
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
export default FuncionarioList;
