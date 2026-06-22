import { useForm, Controller } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { TextField, Button, Box, CircularProgress, Typography } from '@mui/material';
import PageLayout from "../components/common/PageLayout";
import { useValidationRules } from '../hooks/useValidationRules';
import { useMasks } from '../hooks/useMasks';
import { clienteService } from '../services/clienteService';
import showSnackbar from '../utils/snackbar';
import UniqueValidator, { useFieldValidation } from '../components/common/UniqueValidator';
// Definição do componente ClienteForm
const ClienteForm = () => {
  // Hooks de navegação e parâmetros
  const { id, opr } = useParams(); // Parâmetros da URL: id e operação (edit/view)
  const navigate = useNavigate(); // Navegação entre páginas
  // Hook de formulário
  const { control, handleSubmit, formState: { errors, dirtyFields }, reset } = useForm();
  // Estados do componente
  const [loading, setLoading] = useState(false); // Estado de carregamento durante salvamento
  const [loadingData, setLoadingData] = useState(true); // Estado de carregamento de dados iniciais
  // Configurações e validações
  const validationRules = useValidationRules(); // Regras de validação dos campos
  const { applyCpfMask, applyPhoneMask, cleanCpf, cleanPhone } = useMasks();
  const isReadOnly = opr === 'view'; // Modo somente leitura para visualização
  const title = opr === 'view' ? `Visualizar Cliente: ${id}` : id ? `Editar Cliente: ${id}` : 'Novo Cliente'; // Título dinâmico
  // Hook de validação de CPF reutilizável
  const { dialog: cpfDialog, validateField: validateCpf, closeDialog, clearField } = useFieldValidation(clienteService, id, 'checkCpfExists');
  // Funções do diálogo de CPF existente
  const handleDialogCancel = () => {
    closeDialog();
    clearField();
    // Limpa o campo CPF
    reset(prev => ({ ...prev, cpf: '' }));
  };
  const handleDialogView = (cliente) => {
    closeDialog();
    navigate(`/cliente/view/${cliente.id}`);
  };
  const handleDialogEdit = (cliente) => {
    closeDialog();
    navigate(`/cliente/edit/${cliente.id}`);
  };

  // Funções de navegação
  const handleCancel = () => {
    navigate('/clientes');
  };
  // Função de envio do formulário
  const onSubmit = async (data) => {
    try {
      setLoading(true);
      let retorno;
      if (id) {
        // Utiliza dirtyFields para extrair apenas campos alterados
        const changedData = {};
        Object.keys(dirtyFields).forEach(key => {
          if (dirtyFields[key]) {
            changedData[key] = data[key];
          }
        });
        if (Object.keys(changedData).length === 0) {
          showSnackbar('Nenhuma alteração detectada', 'info');
          return;
        }
        console.log('Campos alterados:', changedData);
        retorno = await clienteService.update(id, changedData);
        showSnackbar('Cliente atualizado com sucesso!', 'success');
      } else {
        retorno = await clienteService.create(data);
        showSnackbar('Cliente criado com sucesso!', 'success');
      }
      if (!retorno?.id) {
        throw new Error(retorno.detail || "Erro ao salvar cliente.");
      }
      navigate('/clientes');
    } catch (error) {
      const mensagem = error.apiMessage || 'Erro ao salvar cliente';
      showSnackbar(mensagem, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Efeito para carregar dados do cliente
  useEffect(() => {
    const loadCliente = async () => {
      if (id) {
        try {
          setLoadingData(true);
          const data = await clienteService.getById(id); // Pesquisa cliente pelo id
          reset(data); // Preenche formulário com dados existentes
        } catch (error) {
          showSnackbar('Erro ao carregar cliente', 'error');
          navigate('/clientes');
        } finally {
          setLoadingData(false);
        }
      } else {
        setLoadingData(false);
      }
    };
    loadCliente();
  }, [id, navigate]);

  // Renderiza o formulário
  return (
    <PageLayout title={title}>
      {loadingData ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          {opr === 'view' && (
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Todos os campos estão em modo somente leitura.
            </Typography>
          )}
          <Controller
            name="nome" control={control} defaultValue="" rules={validationRules.nome}
            render={({ field }) => (
              <TextField {...field} disabled={isReadOnly} label="Nome" fullWidth margin="normal" error={!!errors.nome} helperText={errors.nome?.message} />
            )}
          />
          <Controller
            name="cpf" control={control} rules={validationRules.cpf} defaultValue=""
            render={({ field }) => (
              <TextField
                {...field} disabled={isReadOnly} label="CPF" fullWidth margin="normal" error={!!errors.cpf} helperText={errors.cpf?.message}
                onChange={(e) => { const value = cleanCpf(e.target.value); field.onChange(value); }}
                onBlur={() => {
                  if (!isReadOnly) {
                    validateCpf(field.value);
                  }
                }}
                value={field.value ? applyCpfMask(field.value) : ''}
              />
            )}
          />
          <Controller
            name="telefone" control={control} rules={validationRules.telefone} defaultValue=""
            render={({ field }) => (
              <TextField
                {...field} disabled={isReadOnly} label="Telefone" fullWidth margin="normal" error={!!errors.telefone} helperText={errors.telefone?.message}
                onChange={(e) => { const value = cleanPhone(e.target.value); field.onChange(value); }}
                value={field.value ? applyPhoneMask(field.value) : ''}
              />
            )}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button sx={{ mr: 1 }} onClick={handleCancel} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? 'Salvando...' : (id ? 'Atualizar' : 'Cadastrar')}
            </Button>
          </Box>
        </Box>
      )}
      {/* Diálogo de CPF existente - Componente Reutilizável */}
      <UniqueValidator open={cpfDialog.open} onClose={handleDialogCancel} existingRecord={cpfDialog.record} recordType="cliente" onView={handleDialogView}
        onEdit={handleDialogEdit} />
    </PageLayout>
  );
};
export default ClienteForm;
