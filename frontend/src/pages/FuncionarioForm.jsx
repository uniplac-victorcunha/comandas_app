import { useForm, Controller } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { TextField, Button, Box, CircularProgress, Typography, MenuItem } from '@mui/material';
import PageLayout from "../components/common/PageLayout";
import { useValidationRules } from '../hooks/useValidationRules';
import { useMasks } from '../hooks/useMasks';
import { GROUP_OPTIONS } from '../constants/userGroups';
import { funcionarioService } from '../services/funcionarioService';
import showSnackbar from '../utils/snackbar';
import UniqueValidator, { useFieldValidation } from '../components/common/UniqueValidator';
// Definição do componente FuncionarioForm
const FuncionarioForm = () => {
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
  const title = opr === 'view' ? `Visualizar Funcionário: ${id}` : id ? `Editar Funcionário: ${id}` : 'Novo Funcionário'; // Título dinâmico
  // Hook de validação de CPF reutilizável
  const { dialog: cpfDialog, validateField: validateCpf, closeDialog, clearField } = useFieldValidation(funcionarioService, id, 'checkCpfExists');
  // Funções do diálogo de CPF existente
  const handleDialogCancel = () => {
    closeDialog();
    clearField();
    // Limpa o campo CPF
    reset(prev => ({ ...prev, cpf: '' }));
  };
  const handleDialogView = (funcionario) => {
    closeDialog();
    navigate(`/funcionario/view/${funcionario.id}`);
  };
  const handleDialogEdit = (funcionario) => {
    closeDialog();
    navigate(`/funcionario/edit/${funcionario.id}`);
  };

  // Funções de navegação
  const handleCancel = () => {
    navigate('/funcionarios');
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
        // Senha só é enviada se o usuário informou uma nova
        if (!changedData.senha) {
          delete changedData.senha;
        }
        if (Object.keys(changedData).length === 0) {
          showSnackbar('Nenhuma alteração detectada', 'info');
          return;
        }
        console.log('Campos alterados:', changedData);
        retorno = await funcionarioService.update(id, changedData);
        showSnackbar('Funcionário atualizado com sucesso!', 'success');
      } else {
        retorno = await funcionarioService.create(data);
        showSnackbar('Funcionário criado com sucesso!', 'success');
      }
      if (!retorno?.id) {
        throw new Error(retorno.detail || "Erro ao salvar funcionário.");
      }
      navigate('/funcionarios');
    } catch (error) {
      const mensagem = error.apiMessage || 'Erro ao salvar funcionário';
      showSnackbar(mensagem, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Efeito para carregar dados do funcionário
  useEffect(() => {
    const loadFuncionario = async () => {
      if (id) {
        try {
          setLoadingData(true);
          const data = await funcionarioService.getById(id); // Pesquisa funcionário pelo id
          reset(data); // Preenche formulário com dados existentes
        } catch (error) {
          showSnackbar('Erro ao carregar funcionário', 'error');
          navigate('/funcionarios');
        } finally {
          setLoadingData(false);
        }
      } else {
        setLoadingData(false);
      }
    };
    loadFuncionario();
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
            name="matricula" control={control} defaultValue="" rules={validationRules.matricula}
            render={({ field }) => (
              <TextField {...field} disabled={isReadOnly} label="Matrícula" fullWidth margin="normal" error={!!errors.matricula} helperText={errors.matricula?.message} />
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
          <Controller
            name="grupo" control={control} defaultValue="" rules={validationRules.grupo}
            render={({ field }) => (
              <TextField {...field} select disabled={isReadOnly} label="Grupo" fullWidth margin="normal" error={!!errors.grupo} helperText={errors.grupo?.message}>
                {GROUP_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                ))}
              </TextField>
            )}
          />
          <Controller
            name="senha" control={control} defaultValue="" rules={id ? {} : validationRules.senha}
            render={({ field }) => (
              <TextField
                {...field} type="password" disabled={isReadOnly} label={id ? 'Nova Senha (opcional)' : 'Senha'} fullWidth margin="normal"
                error={!!errors.senha} helperText={errors.senha?.message}
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
      <UniqueValidator open={cpfDialog.open} onClose={handleDialogCancel} existingRecord={cpfDialog.record} recordType="funcionário" onView={handleDialogView}
        onEdit={handleDialogEdit} />
    </PageLayout>
  );
};
export default FuncionarioForm;
