import React, { useState } from "react";
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
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import FilePreview from "../../components/common/FilePreview";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Certidao {
  id: number;
  descricao: string;
  dataValidade: string;
  anexo: File | null;
  anexoName: string;
  anexoS3Key: string;
}

interface Obrigacao {
  id: number;
  nome: string;
  competencia: string;
  arquivo: File | null;
  arquivoName: string;
  arquivoPdf: File | null;
  arquivoPdfName: string;
  comprovante: File | null;
  comprovanteName: string;
  comprovantePdf: File | null;
  comprovantePdfName: string;
}

type Props = {
  initial?: any;
  onSave?: (data: any) => void;
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
  },
  {
    descricao: "Certidão de regularidade fiscal estadual (CND estadual)",
    dataValidade: "",
    anexo: null,
    anexoName: "",
    anexoS3Key: "",
  },
  {
    descricao: "Certidão da Receita Federal (CND da Receita Federal)",
    dataValidade: "",
    anexo: null,
    anexoName: "",
    anexoS3Key: "",
  },
  {
    descricao: "Certidão de regularidade com relação ao FGTS (CND FGTS)",
    dataValidade: "",
    anexo: null,
    anexoName: "",
    anexoS3Key: "",
  },
  {
    descricao: "Certidão Negativa de Débitos Trabalhistas (CNDT)",
    dataValidade: "",
    anexo: null,
    anexoName: "",
    anexoS3Key: "",
  },
  {
    descricao: "Certidão Negativa de Tributos Mobiliários e Imobiliários",
    dataValidade: "",
    anexo: null,
    anexoName: "",
    anexoS3Key: "",
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
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <FilePreview
          file={file}
          fileName={file?.name || fileName || null}
          s3Key={s3Key || null}
        />
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
          {file?.name || fileName}
        </Typography>
      </Box>
    )}
  </Stack>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const RequisitosForm: React.FC<Props> = ({
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
      },
    ]);

  const removeCertidao = (id: number) =>
    setCertidoes((prev) => prev.filter((c) => c.id !== id));

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
      },
    ]);

  const removeObrigacao = (id: number) =>
    setObrigacoes((prev) => prev.filter((o) => o.id !== id));

  // ── Submit ──────────────────────────────────────────────────────────────────

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (onSave) onSave({ certidoes, obrigacoes });
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <Box
      component="form"
      onSubmit={submit}
      sx={{ display: "flex", flexDirection: "column", gap: 0 }}
    >
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
                sx={{ p: 2, bgcolor: "#f9f9f9", border: "1px solid #e0e0e0" }}
              >
                <Grid container spacing={2} alignItems="center">
                  {/* Descrição */}
                  <Grid item xs={12} md={5}>
                    <TextField
                      fullWidth
                      size="small"
                      label={t("requisitos.description", "Descrição")}
                      value={c.descricao}
                      onChange={(e) =>
                        updateCertidao(c.id, "descricao", e.target.value)
                      }
                      disabled={readOnly}
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
                      disabled={readOnly}
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
                      onChange={(file) => updateCertidao(c.id, "anexo", file)}
                      disabled={readOnly}
                    />
                  </Grid>

                  {/* Comprar Emissão */}
                  <Grid item xs={12} md={2}>
                    <Button
                      variant="outlined"
                      size="small"
                      fullWidth
                      disabled={readOnly}
                      sx={{ textTransform: "none" }}
                    >
                      {t("requisitos.buyEmission", "Comprar Emissão")}
                    </Button>
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
                sx={{ p: 2, bgcolor: "#f9f9f9", border: "1px solid #e0e0e0" }}
              >
                <Grid container spacing={2} alignItems="flex-start">
                  {/* Nome */}
                  <Grid item xs={12} md={3}>
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
                      disabled={readOnly}
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
                      disabled={readOnly}
                    />
                  </Grid>

                  {/* Arquivos — 2×2 igual ao protótipo */}
                  <Grid item xs={12} md={6}>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Stack spacing={1}>
                          <FileAttachButton
                            label={t("requisitos.file", "Arquivo")}
                            file={o.arquivo}
                            fileName={o.arquivoName}
                            onChange={(f) =>
                              updateObrigacao(o.id, "arquivo", f)
                            }
                            disabled={readOnly}
                          />
                          <FileAttachButton
                            label={t("requisitos.voucher", "Comprovante")}
                            file={o.comprovante}
                            fileName={o.comprovanteName}
                            onChange={(f) =>
                              updateObrigacao(o.id, "comprovante", f)
                            }
                            disabled={readOnly}
                          />
                        </Stack>
                      </Grid>
                      <Grid item xs={6}>
                        <Stack spacing={1}>
                          <FileAttachButton
                            label={t("requisitos.filePdf", "Arquivo Pdf")}
                            file={o.arquivoPdf}
                            fileName={o.arquivoPdfName}
                            onChange={(f) =>
                              updateObrigacao(o.id, "arquivoPdf", f)
                            }
                            disabled={readOnly}
                          />
                          <FileAttachButton
                            label={t(
                              "requisitos.voucherPdf",
                              "Comprovante Pdf",
                            )}
                            file={o.comprovantePdf}
                            fileName={o.comprovantePdfName}
                            onChange={(f) =>
                              updateObrigacao(o.id, "comprovantePdf", f)
                            }
                            disabled={readOnly}
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
        <Button type="submit" variant="contained" disabled={readOnly}>
          {t("requisitos.save", "Salvar")}
        </Button>
      </Box>
    </Box>
  );
};

export default RequisitosForm;
