import React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import { PatrimonialGood } from "../../../../types/compliance";
import { useTranslation } from "react-i18next";
import { maskCpfCnpj,
  maskPhone,
  maskCurrency,
  parseCurrency,
  currencyToDisplay,
  onlyDigits, } from "../../../../utils/masks";

type Currency = "BRL" | "USD" | "EUR";

interface PatrimonialGoodFormProps {
  item?: PatrimonialGood;
  open: boolean;
  onClose: () => void;
  onSave: (item: PatrimonialGood) => void;
  readOnly?: boolean;
}

const PatrimonialGoodForm: React.FC<PatrimonialGoodFormProps> = ({
  item,
  open,
  onClose,
  onSave,
  readOnly = false,
}) => {
  const { t } = useTranslation();

  const createEmptyForm = React.useCallback(
    (): PatrimonialGood => ({
      data: {
        presentacaoFisica: "",
        presentacaoHistorica: "",
        currency: "BRL",
        valorAtual: undefined,
        valorProjetado5anos: undefined,
        valorHistorico5anos: undefined,
        valorNaCompra: undefined,
        dataCompra: "",
        dataUltimaAvaliacao: "",
        matricula: "",
        ocupante: {
          cpfCnpj: "",
          telefone: "",
        },
        attachments: {},
      },
    }),
    [],
  );

  const [formData, setFormData] = React.useState<PatrimonialGood>(
    item || createEmptyForm(),
  );

  // Estado separado apenas para exibição dos campos mascarados
  const [display, setDisplay] = React.useState({
    cpfCnpj: "",
    telefone: "",
    valorAtual: "",
    valorProjetado5anos: "",
    valorHistorico5anos: "",
    valorNaCompra: "",
  });

  React.useEffect(() => {
    if (!open) return;
    const source = item || createEmptyForm();
    setFormData(source);

    const cur = (source.data.currency || "BRL") as Currency;

    // Popula o display formatado ao abrir (útil no modo edição)
    setDisplay({
      cpfCnpj: maskCpfCnpj(source.data.ocupante?.cpfCnpj || ""),
      telefone: maskPhone(source.data.ocupante?.telefone || ""),
      valorAtual: currencyToDisplay(source.data.valorAtual, cur),
      valorProjetado5anos: currencyToDisplay(source.data.valorProjetado5anos, cur),
      valorHistorico5anos: currencyToDisplay(source.data.valorHistorico5anos, cur),
      valorNaCompra: currencyToDisplay(source.data.valorNaCompra, cur),
    });
  }, [item, open, createEmptyForm]);

  // Handler genérico para campos simples (sem máscara)
  const handleChange =
    (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
      setFormData((prev) => ({
        ...prev,
        data: { ...prev.data, [field]: e.target.value },
      }));
    };

  // CPF / CNPJ — atualiza display com máscara, salva só dígitos no formData
  const handleCpfCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskCpfCnpj(e.target.value);
    setDisplay((prev) => ({ ...prev, cpfCnpj: masked }));
    setFormData((prev) => ({
      ...prev,
      data: {
        ...prev.data,
        ocupante: { ...prev.data.ocupante, cpfCnpj: onlyDigits(masked) },
      },
    }));
  };

  // Telefone — atualiza display com máscara, salva só dígitos no formData
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskPhone(e.target.value);
    setDisplay((prev) => ({ ...prev, telefone: masked }));
    setFormData((prev) => ({
      ...prev,
      data: {
        ...prev.data,
        ocupante: { ...prev.data.ocupante, telefone: onlyDigits(masked) },
      },
    }));
  };

  // Valores monetários — factory reutilizável para os 4 campos
  const handleMoneyChange =
    (field: "valorAtual" | "valorProjetado5anos" | "valorHistorico5anos" | "valorNaCompra") =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const cur = (formData.data.currency || "BRL") as Currency;
      const masked = maskCurrency(e.target.value, cur);
      setDisplay((prev) => ({ ...prev, [field]: masked }));
      setFormData((prev) => ({
        ...prev,
        data: { ...prev.data, [field]: parseCurrency(masked) },
      }));
    };

  // Moeda — ao trocar, reformata os valores já digitados no display
  const handleCurrencyChange = (e: React.ChangeEvent<{ value: unknown }>) => {
    const cur = e.target.value as Currency;
    setFormData((prev) => ({ ...prev, data: { ...prev.data, currency: cur } }));
    setDisplay((prev) => ({
      ...prev,
      valorAtual: currencyToDisplay(formData.data.valorAtual, cur),
      valorProjetado5anos: currencyToDisplay(formData.data.valorProjetado5anos, cur),
      valorHistorico5anos: currencyToDisplay(formData.data.valorHistorico5anos, cur),
      valorNaCompra: currencyToDisplay(formData.data.valorNaCompra, cur),
    }));
  };

  const handleAttachmentChange =
    (attachmentType: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setFormData((prev) => ({
          ...prev,
          data: {
            ...prev.data,
            attachments: {
              ...prev.data.attachments,
              [attachmentType]: `file-${Date.now()}`,
            },
          },
        }));
      }
    };

  const handleSave = () => {
    onSave(formData); // formData sempre com valores crus (sem máscara)
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        {t("compliance.patrimonialGood", "Bem Patrimonial")}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 3 }}>
          <Paper sx={{ p: 2, bgcolor: "#f5f5f5" }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
              {t("compliance.presentation", "Apresentação")}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label={t("compliance.physicalPresentation", "Apresentação Física do Bem")}
                  value={formData.data.presentacaoFisica}
                  onChange={handleChange("presentacaoFisica")}
                  disabled={readOnly}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label={t("compliance.historicalPresentation", "Apresentação Histórica do Bem")}
                  value={formData.data.presentacaoHistorica || ""}
                  onChange={handleChange("presentacaoHistorica")}
                  disabled={readOnly}
                  variant="outlined"
                />
              </Grid>
            </Grid>
          </Paper>

          <Paper sx={{ p: 2, bgcolor: "#f5f5f5" }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
              {t("compliance.monetaryValues", "Valores Monetários")}
            </Typography>
            <Typography variant="caption" sx={{ display: "block", mb: 2, color: "#999" }}>
              {t("compliance.selectCurrency", "Selecione: Real, Dólar ou Euro")}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>{t("compliance.currency", "Moeda")}</InputLabel>
                  <Select
                    value={formData.data.currency}
                    label={t("compliance.currency", "Moeda")}
                    onChange={handleCurrencyChange} 
                    disabled={readOnly}
                  >
                    <MenuItem value="BRL">BRL (Real)</MenuItem>
                    <MenuItem value="USD">USD (Dólar)</MenuItem>
                    <MenuItem value="EUR">EUR (Euro)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  size="small"
                  inputProps={{ inputMode: "numeric" }} 
                  label={t("compliance.currentValue", "Valor Atual")}
                  value={display.valorAtual}             
                  onChange={handleMoneyChange("valorAtual")}
                  disabled={readOnly}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  size="small"
                  inputProps={{ inputMode: "numeric" }}
                  label={t("compliance.projectedValue5y", "Valor Projetado 5 anos")}
                  value={display.valorProjetado5anos}
                  onChange={handleMoneyChange("valorProjetado5anos")}
                  disabled={readOnly}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  size="small"
                  inputProps={{ inputMode: "numeric" }}
                  label={t("compliance.historicalValue5y", "Valor Histórico 5 anos")}
                  value={display.valorHistorico5anos}
                  onChange={handleMoneyChange("valorHistorico5anos")}
                  disabled={readOnly}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  size="small"
                  inputProps={{ inputMode: "numeric" }}
                  label={t("compliance.purchaseValue", "Valor na Compra")}
                  value={display.valorNaCompra}
                  onChange={handleMoneyChange("valorNaCompra")}
                  disabled={readOnly}
                  variant="outlined"
                />
              </Grid>
            </Grid>
          </Paper>

          <Paper sx={{ p: 2, bgcolor: "#f5f5f5" }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
              {t("compliance.datesAndInfo", "Datas e Informações")}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label={t("compliance.purchaseDate", "Data de Compra")}
                  value={formData.data.dataCompra || ""}
                  onChange={handleChange("dataCompra")}
                  disabled={readOnly}
                  InputLabelProps={{ shrink: true }}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label={t("compliance.lastEvaluationDate", "Data Última Avaliação")}
                  value={formData.data.dataUltimaAvaliacao || ""}
                  onChange={handleChange("dataUltimaAvaliacao")}
                  disabled={readOnly}
                  InputLabelProps={{ shrink: true }}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  size="small"
                  label={t("compliance.matricula", "Matrícula")}
                  value={formData.data.matricula || ""}
                  onChange={handleChange("matricula")}
                  disabled={readOnly}
                  variant="outlined"
                />
              </Grid>
            </Grid>
          </Paper>

          <Paper sx={{ p: 2, bgcolor: "#f5f5f5" }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
              {t("compliance.occupant", "Dados do Ocupante (se houver)")}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label={t("compliance.cpfCnpj", "CPF/CNPJ")}
                  value={display.cpfCnpj}               
                  onChange={handleCpfCnpjChange}         
                  inputProps={{ inputMode: "numeric" }}
                  disabled={readOnly}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label={t("compliance.phone", "Telefone")}
                  value={display.telefone}              
                  onChange={handlePhoneChange}            
                  inputProps={{ inputMode: "numeric" }}
                  disabled={readOnly}
                  variant="outlined"
                />
              </Grid>
            </Grid>
          </Paper>

          <Paper sx={{ p: 2, bgcolor: "#f5f5f5" }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
              {t("compliance.attachments", "Anexos do Bem")}
            </Typography>
            <Grid container spacing={2}>
              {[
                { key: "apresentacaoBem", label: "Apresentação do Bem" },
                { key: "matricula", label: "Matrícula" },
                { key: "itr", label: "ITR" },
                { key: "car", label: "CAR" },
                { key: "topografia", label: "Topografia" },
              ].map(({ key, label }) => (
                <Grid item xs={12} sm={6} key={key}>
                  <Button
                    variant="outlined"
                    component="label"
                    fullWidth
                    disabled={readOnly}
                    startIcon={<AttachFileIcon />}
                    sx={{ textTransform: "none" }}
                  >
                    {t("compliance.attach", "Anexar")} {label}
                    <input type="file" hidden onChange={handleAttachmentChange(key)} />
                  </Button>
                  {formData.data.attachments?.[key as keyof any] && (
                    <Typography variant="caption" sx={{ display: "block", mt: 0.5, color: "#666" }}>
                      ✓ {label}
                    </Typography>
                  )}
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("common.cancel", "Cancelar")}</Button>
        <Button variant="contained" onClick={handleSave} disabled={readOnly}>
          {t("common.save", "Salvar")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PatrimonialGoodForm;