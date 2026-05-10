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
import { PatrimonialGood, Currency } from "../../types/compliance";
import { useTranslation } from "react-i18next";

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
  const [formData, setFormData] = React.useState<PatrimonialGood>(
    item || {
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
    },
  );

  const handleChange =
    (field: string) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | { name?: string; value: unknown }
      >,
    ) => {
      setFormData((prev) => ({
        ...prev,
        data: {
          ...prev.data,
          [field]: e.target.value,
        },
      }));
    };

  const handleOcupanteChange =
    (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({
        ...prev,
        data: {
          ...prev.data,
          ocupante: {
            ...prev.data.ocupante,
            [field]: e.target.value,
          },
        },
      }));
    };

  const handleAttachmentChange =
    (attachmentType: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        // In real scenario, upload to S3 first, then save key
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
    onSave(formData);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        {t("compliance.patrimonialGood", "Bem Patrimonial")}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 3 }}>
          {/* Seção: Apresentação */}
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
                  label={t(
                    "compliance.physicalPresentation",
                    "Apresentação Física do Bem",
                  )}
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
                  label={t(
                    "compliance.historicalPresentation",
                    "Apresentação Histórica do Bem",
                  )}
                  value={formData.data.presentacaoHistorica || ""}
                  onChange={handleChange("presentacaoHistorica")}
                  disabled={readOnly}
                  variant="outlined"
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Seção: Valores Monetários */}
          <Paper sx={{ p: 2, bgcolor: "#f5f5f5" }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
              {t("compliance.monetaryValues", "Valores Monetários")}
            </Typography>
            <Typography
              variant="caption"
              sx={{ display: "block", mb: 2, color: "#999" }}
            >
              {t("compliance.selectCurrency", "Selecione: Real, Dólar ou Euro")}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>{t("compliance.currency", "Moeda")}</InputLabel>
                  <Select
                    value={formData.data.currency}
                    label={t("compliance.currency", "Moeda")}
                    onChange={handleChange("currency")}
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
                  type="number"
                  inputProps={{ step: "0.01" }}
                  label={t("compliance.currentValue", "Valor Atual")}
                  value={formData.data.valorAtual || ""}
                  onChange={handleChange("valorAtual")}
                  disabled={readOnly}
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  inputProps={{ step: "0.01" }}
                  label={t(
                    "compliance.projectedValue5y",
                    "Valor Projetado 5 anos",
                  )}
                  value={formData.data.valorProjetado5anos || ""}
                  onChange={handleChange("valorProjetado5anos")}
                  disabled={readOnly}
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  inputProps={{ step: "0.01" }}
                  label={t(
                    "compliance.historicalValue5y",
                    "Valor Histórico 5 anos",
                  )}
                  value={formData.data.valorHistorico5anos || ""}
                  onChange={handleChange("valorHistorico5anos")}
                  disabled={readOnly}
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  inputProps={{ step: "0.01" }}
                  label={t("compliance.purchaseValue", "Valor na Compra")}
                  value={formData.data.valorNaCompra || ""}
                  onChange={handleChange("valorNaCompra")}
                  disabled={readOnly}
                  variant="outlined"
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Seção: Datas e Informações */}
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
                  label={t(
                    "compliance.lastEvaluationDate",
                    "Data Última Avaliação",
                  )}
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

          {/* Seção: Ocupante */}
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
                  value={formData.data.ocupante?.cpfCnpj || ""}
                  onChange={handleOcupanteChange("cpfCnpj")}
                  disabled={readOnly}
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label={t("compliance.phone", "Telefone")}
                  value={formData.data.ocupante?.telefone || ""}
                  onChange={handleOcupanteChange("telefone")}
                  disabled={readOnly}
                  variant="outlined"
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Seção: Anexos */}
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
                    <input
                      type="file"
                      hidden
                      onChange={handleAttachmentChange(key)}
                    />
                  </Button>
                  {formData.data.attachments?.[key as keyof any] && (
                    <Typography
                      variant="caption"
                      sx={{ display: "block", mt: 0.5, color: "#666" }}
                    >
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
