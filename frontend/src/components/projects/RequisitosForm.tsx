import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import FilePreview from "../../components/common/FilePreview";
import { api } from "../../services/api";
import {
  list as listFiles,
  saveMetadata,
  presign,
  uploadViaBackend,
} from "../../services/file.service";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Certidao {
  id: number;
  descricao: string;
  dataValidade: string;
  anexo: File | null;
  anexoName: string;
  anexoS3Key: string;
  isRequested?: boolean;
}

interface Obrigacao {
  id: number;
  nome: string;
  competencia: string;
  arquivo: File | null;
  arquivoName: string;
  arquivoS3Key?: string;
  arquivoPdf: File | null;
  arquivoPdfName: string;
  arquivoPdfS3Key?: string;
  comprovante: File | null;
  comprovanteName: string;
  comprovanteS3Key?: string;
  comprovantePdf: File | null;
  comprovantePdfName: string;
  comprovantePdfS3Key?: string;
  isRequested?: boolean;
}

type Props = {
  projectId: string;
  projectName?: string;
  initial?: any;
  onSave?: (data: any) => Promise<any> | void;
  readOnly?: boolean;
};

// ─── Default certidões ────────────────────────────────────────────────────────

const DEFAULT_CERTIDOES: Omit<Certidao, "id">[] = [
  {
    descricao: "Certidão de regularidade fiscal municipal (CND municipal)",
    dataValidade: "",
    anexo: null,
    anexoName: "",
    anexoS3Key: "",
    isRequested: false,
  },
  {
    descricao: "Certidão de regularidade fiscal estadual (CND estadual)",
    dataValidade: "",
    anexo: null,
    anexoName: "",
    anexoS3Key: "",
    isRequested: false,
  },
  {
    descricao: "Certidão da Receita Federal (CND da Receita Federal)",
    dataValidade: "",
    anexo: null,
    anexoName: "",
    anexoS3Key: "",
    isRequested: false,
  },
  {
    descricao: "Certidão de regularidade com relação ao FGTS (CND FGTS)",
    dataValidade: "",
    anexo: null,
    anexoName: "",
    anexoS3Key: "",
    isRequested: false,
  },
  {
    descricao: "Certidão Negativa de Débitos Trabalhistas (CNDT)",
    dataValidade: "",
    anexo: null,
    anexoName: "",
    anexoS3Key: "",
    isRequested: false,
  },
  {
    descricao: "Certidão Negativa de Tributos Mobiliários e Imobiliários",
    dataValidade: "",
    anexo: null,
    anexoName: "",
    anexoS3Key: "",
    isRequested: false,
  },
];

let certidaoIdCounter = DEFAULT_CERTIDOES.length + 1;
let obrigacaoIdCounter = 1;

const buildDefaultCertidoes = (initial?: any[]): Certidao[] => {
  if (Array.isArray(initial) && initial.length > 0)
    return initial.map((c, i) => ({ id: i + 1, ...c }));
  return DEFAULT_CERTIDOES.map((c, i) => ({ id: i + 1, ...c }));
};

const buildDefaultObrigacoes = (initial?: any[]): Obrigacao[] => {
  if (Array.isArray(initial) && initial.length > 0)
    return initial.map((o, i) => ({ id: i + 1, ...o }));
  return [];
};

// ─── FileAttachButton ─────────────────────────────────────────────────────────

interface FileAttachButtonProps {
  label: string;
  file: File | null;
  fileName?: string;
  s3Key?: string;
  onChange: (file: File | null) => void;
  disabled?: boolean;
}

const FileAttachButton: React.FC<FileAttachButtonProps> = ({
  label,
  file,
  fileName,
  s3Key,
  onChange,
  disabled,
}) => (
  <Stack spacing={0.5}>
    <Button
      variant="outlined"
      component="label"
      size="small"
      disabled={disabled}
      startIcon={<AttachFileIcon />}
      sx={{ textTransform: "none", whiteSpace: "nowrap" }}
    >
      {label}
      <input
        type="file"
        hidden
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
    </Button>
    {(file || fileName || s3Key) && (
      <Typography
        variant="caption"
        sx={{
          color: "#666",
          maxWidth: 140,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {file?.name || fileName || s3Key}
      </Typography>
    )}
  </Stack>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const RequisitosForm: React.FC<Props> = ({
  projectId,
  projectName,
  initial,
  onSave,
  readOnly = false,
}) => {
  const { t } = useTranslation();

  const [certidoes, setCertidoes] = useState<Certidao[]>(() =>
    buildDefaultCertidoes(initial?.certidoes),
  );
  const [obrigacoes, setObrigacoes] = useState<Obrigacao[]>(() =>
    buildDefaultObrigacoes(initial?.obrigacoes),
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // ── Load requisitos on mount ────────────────────────────────────────────────

  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    const loadRequisitos = async () => {
      try {
        setLoading(true);
        setError(null);
        const [requirementsResp, filesResp] = await Promise.all([
          api.get(`/projects/${projectId}/requisitos`),
          listFiles(projectId).catch(() => []),
        ]);

        const files = Array.isArray(filesResp) ? filesResp : [];
        const byOriginalName = new Map<string, any>();
        const byKey = new Map<string, any>();
        const byLabelKey = new Map<string, any>();
        files.forEach((file: any) => {
          if (file?.originalName)
            byOriginalName.set(String(file.originalName), file);
          if (file?.s3Key) byKey.set(String(file.s3Key), file);
          if (file?.labelKey) byLabelKey.set(String(file.labelKey), file);
        });

        const incomingCertidoes = buildDefaultCertidoes(
          requirementsResp.data?.certidoes,
        ).map((certidao) => {
          const match =
            (certidao.anexoS3Key && byKey.get(String(certidao.anexoS3Key))) ||
            (certidao.anexoName &&
              byOriginalName.get(String(certidao.anexoName)));

          return {
            ...certidao,
            anexoS3Key: certidao.anexoS3Key || match?.s3Key || "",
            anexoName: certidao.anexoName || match?.originalName || "",
            anexo: null,
          };
        });

        if (requirementsResp.data) {
          setCertidoes(incomingCertidoes);

          const incomingObrigacoes = buildDefaultObrigacoes(
            requirementsResp.data?.obrigacoes,
          ).map((o) => {
            const idx = o.id;
            const arquivoLabel = `requisitos.obrigacao.${idx}.arquivo`;
            const arquivoPdfLabel = `requisitos.obrigacao.${idx}.arquivoPdf`;
            const comprovanteLabel = `requisitos.obrigacao.${idx}.comprovante`;
            const comprovantePdfLabel = `requisitos.obrigacao.${idx}.comprovantePdf`;

            const arquivoMatch =
              (o.arquivoS3Key && byKey.get(String(o.arquivoS3Key))) ||
              (o.arquivoName && byOriginalName.get(String(o.arquivoName))) ||
              byLabelKey.get(arquivoLabel);

            const arquivoPdfMatch =
              (o.arquivoPdfS3Key && byKey.get(String(o.arquivoPdfS3Key))) ||
              (o.arquivoPdfName &&
                byOriginalName.get(String(o.arquivoPdfName))) ||
              byLabelKey.get(arquivoPdfLabel);

            const comprovanteMatch =
              (o.comprovanteS3Key && byKey.get(String(o.comprovanteS3Key))) ||
              (o.comprovanteName &&
                byOriginalName.get(String(o.comprovanteName))) ||
              byLabelKey.get(comprovanteLabel);

            const comprovantePdfMatch =
              (o.comprovantePdfS3Key &&
                byKey.get(String(o.comprovantePdfS3Key))) ||
              (o.comprovantePdfName &&
                byOriginalName.get(String(o.comprovantePdfName))) ||
              byLabelKey.get(comprovantePdfLabel);

            return {
              ...o,
              arquivoName: o.arquivoName || arquivoMatch?.originalName || "",
              arquivoS3Key: o.arquivoS3Key || arquivoMatch?.s3Key || "",
              arquivo: null,
              arquivoPdfName:
                o.arquivoPdfName || arquivoPdfMatch?.originalName || "",
              arquivoPdfS3Key:
                o.arquivoPdfS3Key || arquivoPdfMatch?.s3Key || "",
              arquivoPdf: null,
              comprovanteName:
                o.comprovanteName || comprovanteMatch?.originalName || "",
              comprovanteS3Key:
                o.comprovanteS3Key || comprovanteMatch?.s3Key || "",
              comprovante: null,
              comprovantePdfName:
                o.comprovantePdfName || comprovantePdfMatch?.originalName || "",
              comprovantePdfS3Key:
                o.comprovantePdfS3Key || comprovantePdfMatch?.s3Key || "",
              comprovantePdf: null,
            } as Obrigacao;
          });

          setObrigacoes(incomingObrigacoes);
        } else {
          setCertidoes(buildDefaultCertidoes(initial?.certidoes));
          setObrigacoes(buildDefaultObrigacoes(initial?.obrigacoes));
        }
      } catch (err: any) {
        if (err.response?.status === 404) {
          // No requisitos yet
          setCertidoes(buildDefaultCertidoes(initial?.certidoes));
          setObrigacoes(buildDefaultObrigacoes(initial?.obrigacoes));
        } else {
          console.error("Error loading requisitos:", err);
          setError(
            err.response?.data?.message ||
              err.message ||
              "Failed to load requisitos",
          );
          setCertidoes(buildDefaultCertidoes(initial?.certidoes));
          setObrigacoes(buildDefaultObrigacoes(initial?.obrigacoes));
        }
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      loadRequisitos();
    }
  }, [projectId, initial]);

  // ── Certidões ───────────────────────────────────────────────────────────────

  const updateCertidao = (id: number, field: keyof Certidao, value: any) =>
    setCertidoes((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    );

  const addCertidao = () =>
    setCertidoes((prev) => [
      ...prev,
      {
        id: certidaoIdCounter++,
        descricao: "",
        dataValidade: "",
        anexo: null,
        anexoName: "",
        anexoS3Key: "",
        isRequested: false,
      },
    ]);

  const removeCertidao = (id: number) =>
    setCertidoes((prev) => prev.filter((c) => c.id !== id));

  const handleCertidaoFileChange = async (id: number, file: File | null) => {
    updateCertidao(id, "anexo", file);

    if (!file) {
      updateCertidao(id, "anexoName", "");
      updateCertidao(id, "anexoS3Key", "");
      return;
    }

    updateCertidao(id, "anexoName", file.name);

    if (!projectId) return;

    try {
      const presigned = await presign(
        projectId,
        file.name,
        projectName,
        "Requisitos",
        "Certidão",
      );

      // Try direct S3 upload first
      const uploadRes = await fetch(presigned.url, {
        method: "PUT",
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
        body: file,
      });

      if (!uploadRes.ok) throw new Error(`Upload failed: ${uploadRes.status}`);

      try {
        await saveMetadata(projectId, {
          key: presigned.key,
          originalName: file.name,
          mimeType: file.type,
          size: file.size,
          labelKey: `requisitos.certidao.${id}`,
        });
      } catch (metadataErr) {
        console.error("Error saving requisito metadata:", metadataErr);
      }

      const nextCertidoes = certidoes.map((c) =>
        c.id === id
          ? {
              ...c,
              anexo: file,
              anexoName: file.name,
              anexoS3Key: presigned.key,
            }
          : c,
      );

      updateCertidao(id, "anexoS3Key", presigned.key);

      try {
        await api.put(`/projects/${projectId}/requisitos`, {
          certidoes: nextCertidoes,
          obrigacoes,
        });
      } catch (saveErr) {
        console.error("Error persisting requisito file metadata:", saveErr);
        setToast({
          type: "error",
          message: "Arquivo enviado, mas não foi possível salvar a referência.",
        });
      }
    } catch (err) {
      // If direct S3 upload fails (CORS in dev), fallback to backend upload
      console.error("S3 upload failed, attempting backend upload:", err);
      try {
        const backendRes: any = await uploadViaBackend(
          projectId,
          file,
          projectName,
          "Requisitos",
          "Certidão",
        );

        const key = backendRes?.key;
        if (!key) throw new Error("Backend upload did not return key");

        try {
          await saveMetadata(projectId, {
            key,
            originalName: file.name,
            mimeType: file.type,
            size: file.size,
            labelKey: `requisitos.certidao.${id}`,
          });
        } catch (metadataErr) {
          console.error(
            "Error saving requisito metadata after backend upload:",
            metadataErr,
          );
        }

        const nextCertidoes = certidoes.map((c) =>
          c.id === id
            ? {
                ...c,
                anexo: file,
                anexoName: file.name,
                anexoS3Key: key,
              }
            : c,
        );

        updateCertidao(id, "anexoS3Key", key);

        try {
          await api.put(`/projects/${projectId}/requisitos`, {
            certidoes: nextCertidoes,
            obrigacoes,
          });
          setToast({
            type: "success",
            message: "Arquivo enviado via servidor.",
          });
        } catch (saveErr) {
          console.error(
            "Error persisting requisito file metadata after backend upload:",
            saveErr,
          );
          setToast({
            type: "error",
            message:
              "Arquivo enviado, mas não foi possível salvar a referência.",
          });
        }
      } catch (backendErr) {
        console.error("Backend upload failed:", backendErr);
        setToast({
          type: "error",
          message: "Falha ao enviar o arquivo. Tente novamente.",
        });
      }
    }
  };

  // ── Obrigações ──────────────────────────────────────────────────────────────

  const updateObrigacao = (id: number, field: keyof Obrigacao, value: any) =>
    setObrigacoes((prev) =>
      prev.map((o) => (o.id === id ? { ...o, [field]: value } : o)),
    );

  const addObrigacao = () =>
    setObrigacoes((prev) => [
      ...prev,
      {
        id: obrigacaoIdCounter++,
        nome: "",
        competencia: "",
        arquivo: null,
        arquivoName: "",
        arquivoPdf: null,
        arquivoPdfName: "",
        comprovante: null,
        comprovanteName: "",
        comprovantePdf: null,
        comprovantePdfName: "",
        isRequested: false,
      },
    ]);

  const removeObrigacao = (id: number) =>
    setObrigacoes((prev) => prev.filter((o) => o.id !== id));

  const handleObrigacaoFileChange = async (
    id: number,
    field: "arquivo" | "arquivoPdf" | "comprovante" | "comprovantePdf",
    file: File | null,
  ) => {
    // update local file reference
    updateObrigacao(id, field, file);

    const nameField = field === "arquivo" ? "arquivoName" : field + "Name";
    const s3KeyField =
      field === "arquivo"
        ? "arquivoS3Key"
        : field === "arquivoPdf"
          ? "arquivoPdfS3Key"
          : field === "comprovante"
            ? "comprovanteS3Key"
            : "comprovantePdfS3Key";

    if (!file) {
      updateObrigacao(id, nameField as any, "");
      updateObrigacao(id, s3KeyField as any, "");
      return;
    }

    updateObrigacao(id, nameField as any, file.name);

    if (!projectId) return;

    try {
      const presigned = await presign(
        projectId,
        file.name,
        projectName,
        "Requisitos",
        `Obrigacao.${id}.${field}`,
      );

      const uploadRes = await fetch(presigned.url, {
        method: "PUT",
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
        body: file,
      });

      if (!uploadRes.ok) throw new Error(`Upload failed: ${uploadRes.status}`);

      try {
        await saveMetadata(projectId, {
          key: presigned.key,
          originalName: file.name,
          mimeType: file.type,
          size: file.size,
          labelKey: `requisitos.obrigacao.${id}.${field}`,
        });
      } catch (metadataErr) {
        console.error("Error saving obrigacao metadata:", metadataErr);
      }

      updateObrigacao(id, s3KeyField as any, presigned.key);

      // persist requisitos
      try {
        await api.put(`/projects/${projectId}/requisitos`, {
          certidoes,
          obrigacoes: obrigacoes.map((o) => (o.id === id ? { ...o } : o)),
        });
      } catch (saveErr) {
        console.error("Error persisting obrigacao file metadata:", saveErr);
        setToast({
          type: "error",
          message: "Arquivo enviado, mas não foi possível salvar a referência.",
        });
      }
    } catch (err) {
      console.error(
        "S3 upload failed, attempting backend upload for obrigacao:",
        err,
      );
      try {
        const backendRes: any = await uploadViaBackend(
          projectId,
          file,
          projectName,
          "Requisitos",
          `Obrigacao.${id}.${field}`,
        );

        const key = backendRes?.key;
        if (!key) throw new Error("Backend upload did not return key");

        try {
          await saveMetadata(projectId, {
            key,
            originalName: file.name,
            mimeType: file.type,
            size: file.size,
            labelKey: `requisitos.obrigacao.${id}.${field}`,
          });
        } catch (metadataErr) {
          console.error(
            "Error saving obrigacao metadata after backend upload:",
            metadataErr,
          );
        }

        updateObrigacao(id, s3KeyField as any, key);

        try {
          await api.put(`/projects/${projectId}/requisitos`, {
            certidoes,
            obrigacoes: obrigacoes.map((o) => (o.id === id ? { ...o } : o)),
          });
          setToast({
            type: "success",
            message: "Arquivo enviado via servidor.",
          });
        } catch (saveErr) {
          console.error(
            "Error persisting obrigacao file metadata after backend upload:",
            saveErr,
          );
          setToast({
            type: "error",
            message:
              "Arquivo enviado, mas não foi possível salvar a referência.",
          });
        }
      } catch (backendErr) {
        console.error("Backend upload failed for obrigacao:", backendErr);
        setToast({
          type: "error",
          message: "Falha ao enviar o arquivo. Tente novamente.",
        });
      }
    }
  };

  // ── Submit ──────────────────────────────────────────────────────────────────

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (readOnly) return;

    try {
      setSaving(true);
      setError(null);

      await api.put(`/projects/${projectId}/requisitos`, {
        certidoes,
        obrigacoes,
      });

      if (onSave) {
        await onSave({ certidoes, obrigacoes });
      }
    } catch (err: any) {
      console.error("Error saving requisitos:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to save requisitos",
      );
    } finally {
      setSaving(false);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      component="form"
      onSubmit={submit}
      sx={{ display: "flex", flexDirection: "column", gap: 0 }}
    >
      <Snackbar
        open={!!toast}
        autoHideDuration={4000}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        onClose={() => setToast(null)}
      >
        <Alert
          severity={toast?.type || "success"}
          onClose={() => setToast(null)}
        >
          {toast?.message || ""}
        </Alert>
      </Snackbar>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* ══════════════════════════════════════════════════════
          SEÇÃO 1 — Lista de Certidões
      ══════════════════════════════════════════════════════ */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
          LISTA DE CERTIDÕES
        </Typography>
        <Divider sx={{ mb: 2 }} />

        {certidoes.length === 0 ? (
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            {t("compliance.noCertidoes", "Nenhuma certidão adicionada")}
          </Typography>
        ) : (
          <Stack spacing={2} sx={{ mb: 2 }}>
            {certidoes.map((c) => (
              <Paper
                key={c.id}
                sx={{
                  p: 2,
                  bgcolor: c.isRequested ? "#ffffff" : "#f3f3f3",
                  border: "1px solid #e0e0e0",
                }}
              >
                <Grid container spacing={2} alignItems="center">
                  {/* Solicitar */}
                  <Grid item xs={12} md={1}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={c.isRequested ?? false}
                          onChange={(e) =>
                            updateCertidao(
                              c.id,
                              "isRequested",
                              e.target.checked,
                            )
                          }
                          disabled={readOnly}
                        />
                      }
                      label={t("common.request", "Solicitar")}
                      sx={{ m: 0 }}
                    />
                  </Grid>

                  {/* Descrição */}
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      size="small"
                      label={t("requisitos.description", "Descrição")}
                      value={c.descricao}
                      onChange={(e) =>
                        updateCertidao(c.id, "descricao", e.target.value)
                      }
                      disabled={readOnly || !(c.isRequested ?? false)}
                    />
                  </Grid>

                  {/* Data de Validade */}
                  <Grid item xs={12} md={2}>
                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                      label={t("requisitos.validityDate", "Data de Validade")}
                      value={c.dataValidade}
                      onChange={(e) =>
                        updateCertidao(c.id, "dataValidade", e.target.value)
                      }
                      disabled={readOnly || !(c.isRequested ?? false)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>

                  {/* Anexo */}
                  <Grid item xs={12} md={2}>
                    <FileAttachButton
                      label={t("requisitos.attach", "Anexar")}
                      file={c.anexo}
                      fileName={c.anexoName}
                      s3Key={c.anexoS3Key}
                      onChange={(file) => handleCertidaoFileChange(c.id, file)}
                      disabled={readOnly || !(c.isRequested ?? false)}
                    />
                  </Grid>

                  {/* Comprar Emissão */}
                  <Grid item xs={12} md={2}>
                    <Button
                      variant="outlined"
                      size="small"
                      fullWidth
                      disabled={readOnly || !(c.isRequested ?? false)}
                      sx={{ textTransform: "none" }}
                    >
                      {t("requisitos.buyEmission", "Comprar Emissão")}
                    </Button>
                  </Grid>

                  {/* Visualizar */}
                  <Grid item xs={12} md={1}>
                    {c.isRequested &&
                      (c.anexo || c.anexoName || c.anexoS3Key) && (
                        <Box sx={{ display: "flex", justifyContent: "center" }}>
                          <FilePreview
                            projectId={projectId}
                            file={c.anexo}
                            fileName={c.anexo?.name || c.anexoName || null}
                            s3Key={c.anexoS3Key || null}
                            onError={(message) =>
                              setToast({ type: "error", message })
                            }
                          />
                        </Box>
                      )}
                  </Grid>

                  {/* Delete */}
                  <Grid
                    item
                    xs={12}
                    md={1}
                    sx={{ display: "flex", justifyContent: "flex-end" }}
                  >
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => removeCertidao(c.id)}
                      disabled={readOnly}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Grid>
                </Grid>
              </Paper>
            ))}
          </Stack>
        )}

        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={addCertidao}
          disabled={readOnly}
        >
          {t("requisitos.addCertidao", "Add Nova Certidão")}
        </Button>
      </Paper>

      {/* ══════════════════════════════════════════════════════
          SEÇÃO 2 — Obrigações Acessórios
      ══════════════════════════════════════════════════════ */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
          OBRIGAÇÕES ACESSÓRIOS
        </Typography>
        <Divider sx={{ mb: 2 }} />

        {obrigacoes.length === 0 ? (
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            {t("compliance.noObrigacoes", "Nenhuma obrigação adicionada")}
          </Typography>
        ) : (
          <Stack spacing={2} sx={{ mb: 2 }}>
            {obrigacoes.map((o) => (
              <Paper
                key={o.id}
                sx={{
                  p: 2,
                  bgcolor: o.isRequested ? "#ffffff" : "#f3f3f3",
                  border: "1px solid #e0e0e0",
                }}
              >
                <Grid container spacing={2} alignItems="flex-start">
                  {/* Solicitar */}
                  <Grid item xs={12} md={1}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={o.isRequested ?? false}
                          onChange={(e) =>
                            updateObrigacao(
                              o.id,
                              "isRequested",
                              e.target.checked,
                            )
                          }
                          disabled={readOnly}
                        />
                      }
                      label={t("common.request", "Solicitar")}
                      sx={{ m: 0, mt: 1 }}
                    />
                  </Grid>

                  {/* Nome */}
                  <Grid item xs={12} md={2}>
                    <TextField
                      fullWidth
                      size="small"
                      label={t(
                        "requisitos.obligationName",
                        "Nome da Obrigação",
                      )}
                      value={o.nome}
                      onChange={(e) =>
                        updateObrigacao(o.id, "nome", e.target.value)
                      }
                      disabled={readOnly || !(o.isRequested ?? false)}
                    />
                  </Grid>

                  {/* Competência */}
                  <Grid item xs={12} md={2}>
                    <TextField
                      fullWidth
                      size="small"
                      label={t(
                        "requisitos.competencia",
                        "Competência (Ano/Mês)",
                      )}
                      placeholder="AAAA/MM"
                      value={o.competencia}
                      onChange={(e) =>
                        updateObrigacao(o.id, "competencia", e.target.value)
                      }
                      disabled={readOnly || !(o.isRequested ?? false)}
                    />
                  </Grid>

                  {/* Arquivos — 2×2 igual ao protótipo */}
                  <Grid item xs={12} md={5}>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Stack spacing={1}>
                          <FileAttachButton
                            label={t("requisitos.file", "Arquivo")}
                            file={o.arquivo}
                            fileName={o.arquivoName}
                            s3Key={o.arquivoS3Key}
                            onChange={(f) =>
                              handleObrigacaoFileChange(o.id, "arquivo", f)
                            }
                            disabled={readOnly || !(o.isRequested ?? false)}
                          />
                          <FileAttachButton
                            label={t("requisitos.voucher", "Comprovante")}
                            file={o.comprovante}
                            fileName={o.comprovanteName}
                            s3Key={o.comprovanteS3Key}
                            onChange={(f) =>
                              handleObrigacaoFileChange(o.id, "comprovante", f)
                            }
                            disabled={readOnly || !(o.isRequested ?? false)}
                          />
                        </Stack>
                      </Grid>
                      <Grid item xs={6}>
                        <Stack spacing={1}>
                          <FileAttachButton
                            label={t("requisitos.filePdf", "Arquivo Pdf")}
                            file={o.arquivoPdf}
                            fileName={o.arquivoPdfName}
                            s3Key={o.arquivoPdfS3Key}
                            onChange={(f) =>
                              handleObrigacaoFileChange(o.id, "arquivoPdf", f)
                            }
                            disabled={readOnly || !(o.isRequested ?? false)}
                          />
                          <FileAttachButton
                            label={t(
                              "requisitos.voucherPdf",
                              "Comprovante Pdf",
                            )}
                            file={o.comprovantePdf}
                            fileName={o.comprovantePdfName}
                            s3Key={o.comprovantePdfS3Key}
                            onChange={(f) =>
                              handleObrigacaoFileChange(
                                o.id,
                                "comprovantePdf",
                                f,
                              )
                            }
                            disabled={readOnly || !(o.isRequested ?? false)}
                          />
                        </Stack>
                      </Grid>
                    </Grid>
                  </Grid>

                  {/* Delete */}
                  <Grid
                    item
                    xs={12}
                    md={1}
                    sx={{ display: "flex", justifyContent: "flex-end" }}
                  >
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => removeObrigacao(o.id)}
                      disabled={readOnly}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Grid>
                </Grid>
              </Paper>
            ))}
          </Stack>
        )}

        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={addObrigacao}
          disabled={readOnly}
        >
          {t("requisitos.addObrigacao", "Add Nova Obrigação")}
        </Button>
      </Paper>

      {/* ── Salvar ── */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
        <Button type="submit" variant="contained" disabled={readOnly || saving}>
          {saving ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              {t("common.saving", "Salvando...")}
            </>
          ) : (
            t("requisitos.save", "Salvar")
          )}
        </Button>
      </Box>
    </Box>
  );
};

export default RequisitosForm;
