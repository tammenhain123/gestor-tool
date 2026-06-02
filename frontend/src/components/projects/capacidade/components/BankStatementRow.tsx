import React from "react";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import FormControlLabel from "@mui/material/FormControlLabel";
import DeleteIcon from "@mui/icons-material/Delete";
import { useTranslation } from "react-i18next";
import AttachmentControl from "../../../common/AttachmentControl";
import { BankStatement } from "../../../../types/compliance";

interface BankStatementRowProps {
  item: BankStatement;
  onUpdate: (updates: Partial<BankStatement>) => void;
  onFileChange: (file: File | null) => void;
  onDelete: () => void;
  readOnly?: boolean;
  index: number;
  projectId?: string;
}

const maskAccountNumber = (value: string): string => {
  return value.replace(/\D/g, "").slice(0, 20);
};

const maskAgency = (value: string): string => {
  return value.replace(/\D/g, "").slice(0, 5);
};

const formatNumeroConta = (raw: string): string => {
  const digits = raw.replace(/\D/g, "").slice(0, 20);
  if (digits.length <= 1) return digits;
  return `${digits.slice(0, -1)}-${digits.slice(-1)}`;
};

const formatAgencia = (raw: string): string => {
  const digits = raw.replace(/\D/g, "");
  if (digits.length <= 1) return digits;
  return `${digits.slice(0, -1)}-${digits.slice(-1)}`;
};

const stripMask = (masked: string): string => masked.replace(/\D/g, "");

const BankStatementRow: React.FC<BankStatementRowProps> = ({
  item,
  onUpdate,
  onFileChange,
  onDelete,
  readOnly = false,
  projectId,
}) => {
  const { t } = useTranslation();

  const handleChange =
    (field: string) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | { name?: string; value: unknown }
      >,
    ) => {
      let value = e.target.value as string;

      if (field === "numeroConta") {
        value = maskAccountNumber(value);
      } else if (field === "agencia") {
        value = maskAgency(value);
      }

      onUpdate({ [field]: value });
    };

  const handleValidationDateChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const date = e.target.value;
    onUpdate({
      validationDate: date,
      status: date ? "VALIDADO" : item.status,
    });
  };

  const handleValidationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStatus = e.target.value as
      | "VALIDADO"
      | "NAO_VALIDADO"
      | "PENDENTE";
    const updates: Partial<BankStatement> = { status: newStatus };
    if (newStatus !== "VALIDADO" && item.validationDate) {
      updates.validationDate = undefined;
    }
    onUpdate(updates);
  };

  return (
    <Paper sx={{ p: 2, mb: 2, border: "1px solid #e0e0e0" }}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} md={2}>
          <TextField
            fullWidth
            size="small"
            label={t("compliance.bank", "Banco")}
            value={item.banco || ""}
            onChange={handleChange("banco")}
            disabled={readOnly}
            variant="outlined"
            required
            error={!item.banco && item.banco === ""}
            helperText={!item.banco ? t("compliance.required", "Obrigatório") : ""}
          />
        </Grid>

        <Grid item xs={12} md={2}>
          <TextField
            fullWidth
            size="small"
            label={t("compliance.accountNumber", "Nº Conta")}
            value={formatNumeroConta(item.numeroConta || "")}
            onChange={(e) => {
              const raw = stripMask(e.target.value);
              handleChange("numeroConta")({
                ...e,
                target: { ...e.target, value: raw },
              });
            }}
            disabled={readOnly}
            variant="outlined"
            placeholder="Ex: 123456"
            inputProps={{ maxLength: 20 }}
          />
        </Grid>

        <Grid item xs={12} md={2}>
          <TextField
            fullWidth
            size="small"
            label={t("compliance.agency", "Agência")}
            value={formatAgencia(item.agencia || "")}
            onChange={(e) => {
              const raw = stripMask(e.target.value);
              handleChange("agencia")({
                ...e,
                target: { ...e.target, value: raw },
              });
            }}
            disabled={readOnly}
            variant="outlined"
            placeholder="Ex: 1234"
            inputProps={{ maxLength: 5 }}
          />
        </Grid>

        <Grid item xs={6} md={1}>
          <TextField
            fullWidth
            size="small"
            label={t("compliance.year", "Ano")}
            type="number"
            value={item.ano || ""}
            onChange={handleChange("ano")}
            disabled={readOnly}
            variant="outlined"
            inputProps={{ min: "2000", max: "2099" }}
          />
        </Grid>

        <Grid item xs={6} md={1}>
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

        <Grid item xs={12} md={4}>
          <AttachmentControl
            projectId={projectId}
            file={(item as any).file || null}
            fileName={item.originalName || null}
            s3Key={item.s3Key || null}
            disabled={readOnly}
            buttonLabel={t("compliance.attachButton", "Anexar")}
            accept=".pdf"
            uploadedBy={(item as any).uploadedBy || null}
            uploadedAt={(item as any).createdAt || (item as any).updatedAt || null}
            onChange={(file) => {
              onFileChange(file);
              if (file) onUpdate({ originalName: file.name, mimeType: file.type, size: file.size });
            }}
          />
        </Grid>

        <Grid item xs={12} md={4}>
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
            <FormControlLabel
              value="PENDENTE"
              control={<Radio size="small" />}
              label={t("compliance.pending", "Pendente")}
              disabled={readOnly}
            />
          </RadioGroup>
        </Grid>

        <Grid item xs={12} md={3}>
          <Tooltip title={t("compliance.validationDateHelper", "Data em que foi validado")}>
            <span>
              <TextField
                fullWidth
                size="small"
                label={t("compliance.validationDate", "Data Validação")}
                type="date"
                value={item.validationDate || ""}
                onChange={handleValidationDateChange}
                InputLabelProps={{ shrink: true }}
                disabled={readOnly}
                variant="outlined"
              />
            </span>
          </Tooltip>
        </Grid>

        {!readOnly && (
          <Grid item xs={12} md="auto">
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
