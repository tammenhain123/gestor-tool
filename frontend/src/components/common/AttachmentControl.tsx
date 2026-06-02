import React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import InfoIcon from "@mui/icons-material/Info";
import FilePreview from "./FilePreview";

type Props = {
  projectId?: string;
  file?: File | null;
  fileName?: string | null;
  s3Key?: string | null;
  disabled?: boolean;
  buttonLabel?: string;
  accept?: string;
  uploadedBy?: string | null;
  uploadedAt?: string | null;
  compact?: boolean;
  onChange: (file: File | null) => void;
  onError?: (message: string) => void;
};

const formatUploadInfo = (uploadedBy?: string | null, uploadedAt?: string | null) => {
  const user = uploadedBy || "Desconhecido";
  if (!uploadedAt) return user;

  const date = new Date(uploadedAt);
  return `${user} - ${Number.isNaN(date.getTime()) ? uploadedAt : date.toLocaleString()}`;
};

const AttachmentControl: React.FC<Props> = ({
  projectId,
  file,
  fileName,
  s3Key,
  disabled,
  buttonLabel = "Anexar",
  accept,
  uploadedBy,
  uploadedAt,
  compact = false,
  onChange,
  onError,
}) => {
  const displayName = file?.name || fileName || (s3Key ? s3Key.split("/").pop() : "");
  const hasFile = !!(file || fileName || s3Key);

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: compact ? 0.5 : 1, minWidth: 0 }}>
      <Button
        variant="contained"
        color="primary"
        component="label"
        disabled={disabled}
        sx={{
          color: "#ffffff",
          minWidth: compact ? 78 : 96,
          px: compact ? 1.25 : 2,
          py: compact ? 0.5 : 0.75,
          whiteSpace: "nowrap",
          textTransform: "none",
        }}
      >
        {buttonLabel}
        <input
          type="file"
          hidden
          accept={accept}
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        />
      </Button>
      <Typography
        variant="body2"
        sx={{
          maxWidth: compact ? 150 : 260,
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {displayName}
      </Typography>
      <Checkbox
        checked={hasFile}
        onClick={(e) => e.preventDefault()}
        sx={{
          p: compact ? 0.25 : 0.5,
          "&.Mui-checked": { color: (theme) => theme.palette.success.main },
          "& .MuiSvgIcon-root": { fontSize: 20 },
        }}
      />
      <FilePreview
        projectId={projectId}
        file={file}
        fileName={displayName || null}
        s3Key={s3Key || null}
        onError={onError}
      />
      <Tooltip title={formatUploadInfo(uploadedBy, uploadedAt)}>
        <IconButton
          aria-label="Informações"
          sx={{ color: "primary.main", p: 0.5, "& .MuiSvgIcon-root": { fontSize: 20 } }}
        >
          <InfoIcon />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default AttachmentControl;
