import { useState, useEffect } from 'react';
import { TextField, Box, Button, Accordion, AccordionSummary, AccordionDetails, Typography, MenuItem } from '@mui/material';
import { Clear, FilterList } from '@mui/icons-material';
import { GROUP_OPTIONS } from '../../constants/userGroups';
/*
opções de filtro de funcionário
id, integer | (integer | null) - Filtrar por ID
nome, string | (string | null) - Filtrar por nome
matricula, string | (string | null) - Filtrar por matrícula
cpf, string | (string | null) - Filtrar por CPF exato (somente dígitos)
telefone, string | (string | null) - Filtrar por telefone exato (somente dígitos)
grupo, integer | (integer | null) - Filtrar por grupo
*/
const FuncionarioFilters = ({ onFilter, onClear, filters: externalFilters = {} }) => {
  const [filters, setFilters] = useState({ id: '', nome: '', matricula: '', cpf: '', telefone: '', grupo: '' });
  // Sincronizar estado local com props externas
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      ...externalFilters
    }));
  }, [externalFilters]);
  const handleInputChange = (field) => (event) => {
    const value = event.target.value;
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };
  const handleFilter = () => {
    // Limpar valores vazios antes de enviar
    const cleanedFilters = Object.keys(filters).reduce((acc, key) => {
      const value = filters[key];
      if (value !== '' && value !== null && value !== undefined) {
        acc[key] = key === 'cpf' || key === 'telefone' ? value.replace(/\D/g, '') : value;
      }
      return acc;
    }, {});
    onFilter(cleanedFilters);
  };
  const handleClear = () => {
    setFilters({ id: '', nome: '', matricula: '', cpf: '', telefone: '', grupo: '' });
    onClear();
  };
  const hasActiveFilters = Object.values(filters).some(value => value !== '');
  return (
    <Accordion>
      <AccordionSummary expandIcon={<FilterList />}>
        <Typography variant="h6" component="div">
          Opções de Filtros {hasActiveFilters && '(ativos)'}
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Box sx={{ width: '100%' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2 }}>
            <Box>
              <TextField fullWidth label="ID" value={filters.id} onChange={handleInputChange('id')} placeholder="Buscar por ID..." type="number" size="small" />
            </Box>
            <Box>
              <TextField fullWidth label="Nome" value={filters.nome} onChange={handleInputChange('nome')} placeholder="Buscar por nome..." size="small" />
            </Box>
            <Box>
              <TextField fullWidth label="Matrícula" value={filters.matricula} onChange={handleInputChange('matricula')} placeholder="Buscar por matrícula..." size="small" />
            </Box>
            <Box>
              <TextField fullWidth label="CPF" value={filters.cpf} onChange={handleInputChange('cpf')} placeholder="Buscar por CPF..." size="small" />
            </Box>
            <Box>
              <TextField fullWidth label="Telefone" value={filters.telefone} onChange={handleInputChange('telefone')} placeholder="Buscar por telefone..." size="small" />
            </Box>
            <Box>
              <TextField fullWidth select label="Grupo" value={filters.grupo} onChange={handleInputChange('grupo')} size="small">
                <MenuItem value="">Todos</MenuItem>
                {GROUP_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                ))}
              </TextField>
            </Box>
            <Box sx={{ gridColumn: { xs: '1 / -1', md: 'auto' }, display: 'flex', gap: 1, justifyContent: 'flex-end', alignItems: 'center' }}>
              <Button variant="outlined" startIcon={<Clear />} onClick={handleClear} disabled={!hasActiveFilters} size="small">
                Limpar
              </Button>
              <Button variant="contained" onClick={handleFilter} size="small">
                Filtrar
              </Button>
            </Box>
          </Box>
        </Box>
      </AccordionDetails>
    </Accordion>
  );
};
export default FuncionarioFilters;
