import React from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Stack from "@mui/material/Stack";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import DeleteIcon from "@mui/icons-material/Delete";
import Radio from "@mui/material/Radio";
import FormControlLabel from "@mui/material/FormControlLabel";
import RadioGroup from "@mui/material/RadioGroup";
import { BankStatement } from "../../types/compliance";
import { useTranslation } from "react-i18next";

interface BankStatementRowProps {
  item: BankStatement;
  onUpdate: (updates: Partial<BankStatement>) => void;
  onFileChange: (file: File | null) => void;
  onDelete: () => void;
  readOnly?: boolean;
  index: number;
}

const BankStatementRow: React.FC<BankStatementRowProps> = ({
  item,
  onUpdate,
  onFileChange,
  onDelete,
  readOnly = false,
  index,
}) => {
  const { t } = useTranslation();

  const handleChange =
    (field: string) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | { name?: string; value: unknown }
      >,
    ) => {
      onUpdate({ [field]: e.target.value });
    };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onFileChange(file);
    if (file) {
      onUpdate({
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
      });
    }
  };

  const handleValidationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({
      status: e.target.value as "VALIDADO" | "NAO_VALIDADO" | "PENDENTE",
    });
  };

  return (
    <Paper sx={{ p: 2, mb: 2, border: "1px solid #e0e0e0" }}>
      <Grid container spacing={2} alignItems="center">
        {/* Banco */}
        <Grid item xs={12} sm={2}>
          <TextField
            fullWidth
            size="small"
            label={t("compliance.bank", "Banco")}
            value={item.banco || ""}
            onChange={handleChange("banco")}
            disabled={readOnly}
            variant="outlined"
          />
        </Grid>

        {/* Número Conta */}
        <Grid item xs={12} sm={2}>
          <TextField
            fullWidth
            size="small"
            label={t("compliance.accountNumber", "Nº Conta")}
            value={item.numeroConta || ""}
            onChange={handleChange("numeroConta")}
            disabled={readOnly}
            variant="outlined"
          />
        </Grid>

        {/* Agência */}
        <Grid item xs={12} sm={2}>
          <TextField
            fullWidth
            size="small"
            label={t("compliance.agency", "Agência")}
            value={item.agencia || ""}
            onChange={handleChange("agencia")}
            disabled={readOnly}
            variant="outlined"
          />
        </Grid>

        {/* Ano */}
        <Grid item xs={12} sm={1}>
          <TextField
            fullWidth
            size="small"
            label={t("compliance.year", "Ano")}
            type="number"
            value={item.ano || ""}
            onChange={handleChange("ano")}
            disabled={readOnly}
            variant="outlined"
          />
        </Grid>

        {/* Mês */}
        <Grid item xs={12} sm={1}>
          <TextField
            fullWidth
            size="small"
            label={t("compliance.month", "Mês")}
            type="number"
            inputProps={{ min: "1", max: "12" }}
            value={item.mes || ""}
            onChange={handleChange("mes")}
            disabled={readOnly}
            variant="outlined"
          />
        </Grid>

        {/* Upload Button */}
        <Grid item xs={12} sm={2}>
          <Button
            variant="outlined"
            component="label"
            disabled={readOnly}
            startIcon={<AttachFileIcon />}
            fullWidth
            sx={{ textTransform: "none" }}
          >
            {t("compliance.attachButton", "Anexar")}
            <input
              type="file"
              hidden
              accept=".pdf"
              onChange={handleFileChange}
            />
          </Button>
          {item.originalName && (
            <Box sx={{ fontSize: "0.75rem", color: "#666", mt: 0.5 }}>
              {item.originalName}
            </Box>
          )}
        </Grid>

        {/* Validation Status */}
        <Grid item xs={12}>
          <RadioGroup
            row
            value={item.status || "PENDENTE"}
            onChange={handleValidationChange}
          >
            <FormControlLabel
              value="VALIDADO"
              control={<Radio size="small" />}
              label={t("compliance.validated", "Validado")}
              disabled={readOnly}
            />
            <FormControlLabel
              value="NAO_VALIDADO"
              control={<Radio size="small" />}
              label={t("compliance.notValidated", "Não Validado")}
              disabled={readOnly}
            />
          </RadioGroup>
        </Grid>

        {/* Validation date and validator (read-only) */}
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            size="small"
            label={t("compliance.validationDate", "Data Validação")}
            type="date"
            value={item.validationDate || ""}
            InputLabelProps={{ shrink: true }}
            disabled
            variant="outlined"
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            size="small"
            label={t("compliance.validator", "Validador")}
            value={item.validator || ""}
            disabled
            variant="outlined"
          />
        </Grid>

        {/* Delete Button */}
        {!readOnly && (
          <Grid item xs={12} sm="auto">
            <IconButton color="error" onClick={onDelete} size="small">
              <DeleteIcon />
            </IconButton>
          </Grid>
        )}
      </Grid>
    </Paper>
  );
};

export default BankStatementRow;
