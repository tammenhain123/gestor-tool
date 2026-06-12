import React from "react";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import FormControlLabel from "@mui/material/FormControlLabel";
import DeleteIcon from "@mui/icons-material/Delete";
import { useTranslation } from "react-i18next";
import AttachmentControl from "../../../common/AttachmentControl";
import { DocumentItem } from "../../../../types/compliance";

interface DocumentValidationRowProps {
  item: DocumentItem;
  onUpdate: (updates: Partial<DocumentItem>) => void;
  onFileChange: (file: File | null) => void;
  onDelete?: () => void;
  readOnly?: boolean;
  label?: string;
  projectId?: string;
  editableLabel?: boolean;
  historyLabelKey?: string | null;
}

const DocumentValidationRow: React.FC<DocumentValidationRowProps> = ({
  item,
  onUpdate,
  onFileChange,
  onDelete,
  readOnly = false,
  label,
  projectId,
  editableLabel = false,
  historyLabelKey,
}) => {
  const { t } = useTranslation();
  const labelValue =
    label ||
    item.description ||
    item.name ||
    t("compliance.documentDescription", "Descrição do documento");

  const handleValidationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStatus =
      e.target.value === "VALIDATED" ? "VALIDATED" : "NOT_VALIDATED";
    const updates: Partial<DocumentItem> = { status: newStatus };
    if (newStatus !== "VALIDATED" && item.validationDate) {
      updates.validationDate = undefined;
    }
    onUpdate(updates);
  };

  const handleValidationDateChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const date = e.target.value;
    onUpdate({
      validationDate: date,
      status: date ? "VALIDATED" : item.status,
    });
  };

  return (
    <Paper sx={{ p: 1, mb: 1, bgcolor: "background.paper", border: "1px solid #e0e0e0" }}>
      <Grid container columnSpacing={1} rowSpacing={0.75} alignItems="center">
        <Grid item xs={12} md={3}>
          {editableLabel ? (
            <TextField
              fullWidth
              size="small"
              value={labelValue}
              onChange={(e) =>
                onUpdate({ description: e.target.value, name: e.target.value })
              }
              disabled={readOnly}
              variant="outlined"
            />
          ) : (
            <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.25 }}>
              {labelValue}
            </Typography>
          )}
        </Grid>

        <Grid item xs={12} md={3}>
          <AttachmentControl
            projectId={projectId}
            file={(item as any).file || null}
            fileName={item.originalName || null}
            s3Key={(item as any).s3Key || null}
            historyLabelKey={historyLabelKey}
            disabled={readOnly}
            buttonLabel={t("compliance.attachButton", "Anexar")}
            accept=".pdf,.jpg,.jpeg,.png,.docx"
            compact
            uploadedBy={(item as any).uploadedBy || null}
            uploadedAt={
              (item as any).uploadDate ||
              (item as any).createdAt ||
              (item as any).updatedAt ||
              null
            }
            onChange={(file) => {
              onFileChange(file);
              if (file) {
                onUpdate({
                  originalName: file.name,
                  mimeType: file.type,
                  size: file.size,
                });
              }
            }}
          />
        </Grid>

        <Grid item xs={12} md={3}>
          <RadioGroup
            row
            value={item.status || ""}
            onChange={handleValidationChange}
            aria-disabled={readOnly}
            sx={{
              pointerEvents: readOnly ? "none" : "auto",
              opacity: readOnly ? 0.6 : 1,
              gap: 0.5,
              "& .MuiFormControlLabel-root": { mr: 0.5 },
              "& .MuiFormControlLabel-label": { fontSize: "0.8125rem" },
            }}
          >
            <FormControlLabel
              value="VALIDATED"
              control={<Radio size="small" />}
              label={t("compliance.validated", "Validado")}
              disabled={readOnly}
            />
            <FormControlLabel
              value="NOT_VALIDATED"
              control={<Radio size="small" />}
              label={t("compliance.notValidated", "Não Validado")}
              disabled={readOnly}
            />
          </RadioGroup>
        </Grid>

        <Grid item xs={12} md={2}>
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

        {onDelete && !readOnly && (
          <Grid item xs={12} md={1} sx={{ display: "flex", justifyContent: { xs: "flex-start", md: "flex-end" } }}>
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
