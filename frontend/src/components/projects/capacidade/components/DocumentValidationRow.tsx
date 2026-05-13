import React from "react";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Radio from "@mui/material/Radio";
import FormControlLabel from "@mui/material/FormControlLabel";
import RadioGroup from "@mui/material/RadioGroup";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import DeleteIcon from "@mui/icons-material/Delete";
import { DocumentItem } from "../../../../types/compliance";
import { useTranslation } from "react-i18next";

interface DocumentValidationRowProps {
  item: DocumentItem;
  onUpdate: (updates: Partial<DocumentItem>) => void;
  onFileChange: (file: File | null) => void;
  onDelete?: () => void;
  readOnly?: boolean;
  label?: string;
}

const DocumentValidationRow: React.FC<DocumentValidationRowProps> = ({
  item,
  onUpdate,
  onFileChange,
  onDelete,
  readOnly = false,
  label,
}) => {
  const { t } = useTranslation();

  const handleCheckChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ isRequested: e.target.checked });
  };

  const allowEdit = readOnly ? false : item.isRequested;

  const handleDescChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!allowEdit) return;
    onUpdate({ description: e.target.value });
  };

  const handleValidationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!allowEdit) return;
    const newStatus =
      e.target.value === "VALIDATED" ? "VALIDATED" : "NOT_VALIDATED";
    const updates: Partial<DocumentItem> = { status: newStatus };
    if (newStatus !== "VALIDATED" && item.validationDate) {
      updates.validationDate = undefined;
    }
    onUpdate(updates);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!allowEdit) return;
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

  const handleValidationDateChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (!allowEdit) return;
    const date = e.target.value;
    onUpdate({
      validationDate: date,
      status: date ? "VALIDATED" : item.status,
    });
  };

  const isDisabled = !allowEdit;
  const canEditValidationFields = allowEdit;

  return (
    <Paper
      sx={{
        p: 2,
        mb: 2,
        bgcolor: item.isRequested ? "background.paper" : "#f5f5f5",
        border: "1px solid #e0e0e0",
      }}
    >
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm="auto">
          <FormControlLabel
            control={
              <Checkbox
                checked={item.isRequested}
                onChange={handleCheckChange}
                disabled={readOnly}
              />
            }
            label={t("compliance.selectLabel", "Solicitar")}
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            size="small"
            placeholder={
              label ||
              t("compliance.documentDescription", "Descrição do documento")
            }
            value={item.description || ""}
            onChange={handleDescChange}
            disabled={isDisabled}
            variant="outlined"
          />
        </Grid>

        <Grid item xs={12} sm="auto">
          <Button
            variant="outlined"
            component="label"
            disabled={isDisabled}
            startIcon={<AttachFileIcon />}
            sx={{ textTransform: "none" }}
          >
            {t("compliance.attachButton", "Anexar")}
            <input
              type="file"
              hidden
              accept=".pdf,.jpg,.jpeg,.png,.docx"
              onChange={handleFileChange}
            />
          </Button>
          {item.originalName && (
            <Box sx={{ fontSize: "0.75rem", color: "#666", mt: 0.5 }}>
              {t("compliance.uploadedFile", "Arquivo: {{name}}", {
                name: item.originalName,
              })}
            </Box>
          )}
        </Grid>

        <Grid item xs={12} sm="auto">
          <RadioGroup
            row
            value={item.status || ""}
            onChange={handleValidationChange}
            aria-disabled={isDisabled}
            sx={{
              pointerEvents: isDisabled ? "none" : "auto",
              opacity: isDisabled ? 0.6 : 1,
            }}
          >
            <FormControlLabel
              value="VALIDATED"
              control={<Radio size="small" />}
              label={t("compliance.validated", "Validado")}
              disabled={isDisabled}
            />
            <FormControlLabel
              value="NOT_VALIDATED"
              control={<Radio size="small" />}
              label={t("compliance.notValidated", "Não Validado")}
              disabled={isDisabled}
            />
          </RadioGroup>
        </Grid>

        <Grid item xs={12} sm={3}>
          <Tooltip
            title={
              canEditValidationFields
                ? t(
                    "compliance.validationDateHelper",
                    "Data em que foi validado",
                  )
                : t(
                    "compliance.validationDateHelperDisabled",
                    "Selecione o documento e uma opção de validação",
                  )
            }
          >
            <span>
              <TextField
                fullWidth
                size="small"
                label={t("compliance.validationDate", "Data Validação")}
                type="date"
                value={item.validationDate || ""}
                onChange={handleValidationDateChange}
                InputLabelProps={{ shrink: true }}
                disabled={!canEditValidationFields}
                variant="outlined"
              />
            </span>
          </Tooltip>
        </Grid>

        {onDelete && !readOnly && (
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

export default DocumentValidationRow;
