import React from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import HistoryIcon from "@mui/icons-material/History";
import InfoIcon from "@mui/icons-material/Info";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import FilePreview from "./FilePreview";
import { list as listProjectFiles, presignGet } from "../../services/file.service";

type Props = {
  projectId?: string;
  file?: File | null;
  fileName?: string | null;
  s3Key?: string | null;
  historyLabelKey?: string | null;
  historyQualificationId?: string | null;
  historyCapacityId?: string | null;
  historyFallbackKeys?: Array<string | null | undefined>;
  historyPrefix?: string | null;
  disabled?: boolean;
  buttonLabel?: string;
  accept?: string;
  uploadedBy?: string | null;
  uploadedAt?: string | null;
  compact?: boolean;
  onChange: (file: File | null) => void;
  onError?: (message: string) => void;
};

type ProjectFileMeta = {
  id?: string;
  s3Key?: string;
  key?: string;
  originalName?: string;
  mimeType?: string;
  size?: number;
  uploadedBy?: string;
  labelKey?: string;
  qualificationId?: string;
  capacityId?: string;
  createdAt?: string;
  updatedAt?: string;
};

const formatUploadInfo = (uploadedBy?: string | null, uploadedAt?: string | null) => {
  const user = uploadedBy || "Desconhecido";
  if (!uploadedAt) return user;

  const date = new Date(uploadedAt);
  return `${user} - ${Number.isNaN(date.getTime()) ? uploadedAt : date.toLocaleString()}`;
};

const formatBytes = (size?: number) => {
  if (!size) return "";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const getFolderPrefix = (key?: string | null) => {
  if (!key || !key.includes("/")) return "";
  return key.slice(0, key.lastIndexOf("/") + 1);
};

const isFieldScopedPrefix = (prefix: string) => {
  const parts = prefix.split("/").filter(Boolean);
  return parts.length >= 4 && parts[0] === "projects";
};

const AttachmentControl: React.FC<Props> = ({
  projectId,
  file,
  fileName,
  s3Key,
  historyLabelKey,
  historyQualificationId,
  historyCapacityId,
  historyFallbackKeys = [],
  historyPrefix,
  disabled,
  buttonLabel = "Anexar",
  accept,
  uploadedBy,
  uploadedAt,
  compact = false,
  onChange,
  onError,
}) => {
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const [historyLoading, setHistoryLoading] = React.useState(false);
  const [historyError, setHistoryError] = React.useState<string | null>(null);
  const [historyFiles, setHistoryFiles] = React.useState<ProjectFileMeta[]>([]);
  const displayName = file?.name || fileName || (s3Key ? s3Key.split("/").pop() : "");
  const hasFile = !!(file || fileName || s3Key);
  const inferredPrefix = getFolderPrefix(s3Key);
  const scopedPrefix =
    historyPrefix ||
    (isFieldScopedPrefix(inferredPrefix) ? inferredPrefix : "");
  const hasHistoryLookup = !!(
    projectId &&
    (
      historyLabelKey ||
      historyQualificationId ||
      historyCapacityId ||
      scopedPrefix ||
      historyFallbackKeys.some(Boolean) ||
      s3Key ||
      displayName
    )
  );

  const dedupeHistoryFiles = (items: ProjectFileMeta[]) => {
    const seen = new Set<string>();
    return items.filter((item) => {
      const identity =
        item.s3Key ||
        item.key ||
        item.id ||
        [item.originalName, item.createdAt || item.updatedAt, item.size].join("|");
      if (seen.has(identity)) return false;
      seen.add(identity);
      return true;
    });
  };

  const getScopedHistory = React.useCallback(
    (files: ProjectFileMeta[]) => {
      const fallbackKeys = new Set(
        [...historyFallbackKeys, s3Key].filter(Boolean).map((key) => String(key)),
      );

      const scoped = files.filter((item) => {
        const itemKey = item.s3Key || item.key || "";
        if (historyLabelKey && item.labelKey === historyLabelKey) return true;
        if (
          historyQualificationId &&
          String(item.qualificationId || "") === String(historyQualificationId)
        ) {
          return true;
        }
        if (historyCapacityId && String(item.capacityId || "") === String(historyCapacityId)) {
          return true;
        }
        if (scopedPrefix && itemKey.startsWith(scopedPrefix)) return true;
        if (itemKey && fallbackKeys.has(itemKey)) return true;
        return false;
      });

      if (scoped.length > 0) return scoped;

      if (!s3Key) return [];
      return files.filter((item) => item.s3Key === s3Key || item.key === s3Key);
    },
    [
      historyCapacityId,
      historyFallbackKeys,
      historyLabelKey,
      historyQualificationId,
      s3Key,
      scopedPrefix,
    ],
  );

  const openHistory = async () => {
    setHistoryOpen(true);
    setHistoryError(null);
    setHistoryFiles([]);

    if (!projectId) {
      setHistoryError("Projeto indisponível para carregar histórico.");
      return;
    }

    try {
      setHistoryLoading(true);
      const files = await listProjectFiles(projectId);
      const filtered = dedupeHistoryFiles(
        getScopedHistory(files || []).sort(
          (a: ProjectFileMeta, b: ProjectFileMeta) =>
            new Date(b.createdAt || b.updatedAt || 0).getTime() -
            new Date(a.createdAt || a.updatedAt || 0).getTime(),
        ),
      );
      setHistoryFiles(filtered);
    } catch (e) {
      setHistoryError("Erro ao carregar histórico de arquivos.");
      onError?.("Erro ao carregar histórico de arquivos");
    } finally {
      setHistoryLoading(false);
    }
  };

  const openHistoryFile = async (item: ProjectFileMeta) => {
    const key = item.s3Key || item.key;
    if (!projectId || !key) {
      onError?.("Visualização indisponível");
      return;
    }

    try {
      const res = await presignGet(projectId, key);
      if (res?.url) window.open(res.url, "_blank", "noopener,noreferrer");
      else onError?.("Visualização indisponível");
    } catch (e) {
      onError?.("Erro ao obter arquivo para visualização");
    }
  };

  return (
    <>
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
        <Tooltip title="Histórico de arquivos">
          <span>
            <IconButton
              size="small"
              onClick={openHistory}
              aria-label="histórico de arquivos"
              disabled={!hasHistoryLookup}
              color={hasHistoryLookup ? "primary" : undefined}
            >
              <HistoryIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title={formatUploadInfo(uploadedBy, uploadedAt)}>
          <IconButton
            aria-label="Informações"
            sx={{ color: "primary.main", p: 0.5, "& .MuiSvgIcon-root": { fontSize: 20 } }}
          >
            <InfoIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Dialog open={historyOpen} onClose={() => setHistoryOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Histórico de arquivos</DialogTitle>
        <DialogContent dividers>
          {historyLoading ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 2 }}>
              <CircularProgress size={20} />
              <Typography variant="body2">Carregando arquivos...</Typography>
            </Box>
          ) : historyError ? (
            <Alert severity="error">{historyError}</Alert>
          ) : historyFiles.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Nenhum arquivo encontrado para este campo.
            </Typography>
          ) : (
            <List disablePadding>
              {historyFiles.map((item, index) => {
                const itemDate = item.createdAt || item.updatedAt || "";
                const parsedDate = itemDate ? new Date(itemDate) : null;
                const secondary = [
                  item.uploadedBy || "Desconhecido",
                  parsedDate && !Number.isNaN(parsedDate.getTime())
                    ? parsedDate.toLocaleString()
                    : itemDate,
                  formatBytes(Number(item.size || 0)),
                ].filter(Boolean).join(" - ");

                return (
                  <React.Fragment key={item.id || item.s3Key || index}>
                    {index > 0 && <Divider component="li" />}
                    <ListItem
                      disableGutters
                      secondaryAction={
                        <Tooltip title="Abrir arquivo">
                          <IconButton edge="end" onClick={() => openHistoryFile(item)}>
                            <OpenInNewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      }
                    >
                      <ListItemText
                        primary={item.originalName || item.s3Key || "Arquivo"}
                        secondary={secondary}
                        primaryTypographyProps={{
                          sx: { pr: 4, overflowWrap: "anywhere" },
                        }}
                      />
                    </ListItem>
                  </React.Fragment>
                );
              })}
            </List>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AttachmentControl;
