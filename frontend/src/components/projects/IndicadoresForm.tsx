import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import AddIcon from "@mui/icons-material/Add";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import DocumentValidationRow from "./capacidade/components/DocumentValidationRow";
import { DocumentItem } from "../../types/compliance";
import { api } from "../../services/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface HistoricoSection {
  rows: DocumentItem[];
}

interface IndicadoresData {
  vendasPorCliente: DocumentItem;
  historicoProdução: HistoricoSection;
  historicoPagamentos: HistoricoSection;
  historicoVendas: HistoricoSection;
  paretoVendas: DocumentItem;
  paretoFornecedores: DocumentItem;
  relatorioCusto: DocumentItem;
  relatorioCentroCusto: DocumentItem;
}

type Props = {
  projectId: string;
  projectName?: string;
  initial?: Partial<IndicadoresData>;
  onSave?: (data: IndicadoresData) => Promise<any> | void;
  readOnly?: boolean;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const emptyDoc = (description = ""): DocumentItem => ({
  name: description,
  isRequested: false,
  description,
  status: undefined,
  validationDate: undefined,
  originalName: undefined,
});

const emptyHistorico = (): HistoricoSection => ({
  rows: [emptyDoc()],
});

const buildInitial = (initial?: Partial<IndicadoresData>): IndicadoresData => ({
  vendasPorCliente:
    initial?.vendasPorCliente || emptyDoc("Relatório de Vendas por Cliente"),
  historicoProdução: initial?.historicoProdução || emptyHistorico(),
  historicoPagamentos: initial?.historicoPagamentos || emptyHistorico(),
  historicoVendas: initial?.historicoVendas || emptyHistorico(),
  paretoVendas: initial?.paretoVendas || emptyDoc("Pareto de Vendas"),
  paretoFornecedores:
    initial?.paretoFornecedores || emptyDoc("Pareto de Fornecedores"),
  relatorioCusto: initial?.relatorioCusto || emptyDoc("Relatório de Custo"),
  relatorioCentroCusto:
    initial?.relatorioCentroCusto || emptyDoc("Relatório de Centro de Custo"),
});

// ─── Main Component ───────────────────────────────────────────────────────────

const IndicadoresForm: React.FC<Props> = ({
  projectId,
  projectName,
  initial,
  onSave,
  readOnly = false,
}) => {
  const { t } = useTranslation();
  const [data, setData] = useState<IndicadoresData>(() =>
    buildInitial(initial),
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Load indicadores on mount ───────────────────────────────────────────────

  useEffect(() => {
    const loadIndicadores = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get(`/projects/${projectId}/indicators`);
        if (response.data) {
          setData(buildInitial(response.data));
        } else {
          setData(buildInitial(initial));
        }
      } catch (err: any) {
        if (err.response?.status === 404) {
          // No indicators yet
          setData(buildInitial(initial));
        } else {
          console.error("Error loading indicadores:", err);
          setError(
            err.response?.data?.message ||
              err.message ||
              "Failed to load indicadores",
          );
          setData(buildInitial(initial));
        }
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      loadIndicadores();
    }
  }, [projectId, initial]);

  // ── Simple item handlers ────────────────────────────────────────────────────

  const updateSimple = (
    field: keyof IndicadoresData,
    updates: Partial<DocumentItem>,
  ) =>
    setData((prev) => ({
      ...prev,
      [field]: { ...(prev[field] as DocumentItem), ...updates },
    }));

  const updateSimpleFile = (field: keyof IndicadoresData, file: File | null) =>
    setData((prev) => ({
      ...prev,
      [field]: {
        ...(prev[field] as DocumentItem),
        originalName: file?.name,
        mimeType: file?.type,
        size: file?.size,
      },
    }));

  // ── Historico section handlers ──────────────────────────────────────────────

  const updateHistoricoRow = (
    field: keyof IndicadoresData,
    index: number,
    updates: Partial<DocumentItem>,
  ) =>
    setData((prev) => {
      const section = prev[field] as HistoricoSection;
      const rows = section.rows.map((r, i) =>
        i === index ? { ...r, ...updates } : r,
      );
      return { ...prev, [field]: { ...section, rows } };
    });

  const updateHistoricoFile = (
    field: keyof IndicadoresData,
    index: number,
    file: File | null,
  ) =>
    setData((prev) => {
      const section = prev[field] as HistoricoSection;
      const rows = section.rows.map((r, i) =>
        i === index
          ? {
              ...r,
              originalName: file?.name,
              mimeType: file?.type,
              size: file?.size,
            }
          : r,
      );
      return { ...prev, [field]: { ...section, rows } };
    });

  const addHistoricoRow = (field: keyof IndicadoresData) =>
    setData((prev) => {
      const section = prev[field] as HistoricoSection;
      return {
        ...prev,
        [field]: { ...section, rows: [...section.rows, emptyDoc()] },
      };
    });

  const removeHistoricoRow = (field: keyof IndicadoresData, index: number) =>
    setData((prev) => {
      const section = prev[field] as HistoricoSection;
      return {
        ...prev,
        [field]: {
          ...section,
          rows: section.rows.filter((_, i) => i !== index),
        },
      };
    });

  // ── Submit ──────────────────────────────────────────────────────────────────

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (readOnly) return;

    try {
      setSaving(true);
      setError(null);

      await api.put(`/projects/${projectId}/indicators`, data);

      if (onSave) {
        await onSave(data);
      }
    } catch (err: any) {
      console.error("Error saving indicadores:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to save indicadores",
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
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* ── Relatório de Vendas por Cliente ── */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
          RELATÓRIO DE VENDAS POR CLIENTE
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <DocumentValidationRow
          item={data.vendasPorCliente}
          onUpdate={(u) => updateSimple("vendasPorCliente", u)}
          onFileChange={(f) => updateSimpleFile("vendasPorCliente", f)}
          readOnly={readOnly}
          label="Relatório de Vendas por Cliente"
        />
      </Paper>

      {/* ── Histórico de Produção ── */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
          HISTÓRICO DE PRODUÇÃO
        </Typography>
        <Divider sx={{ mb: 2 }} />
        {data.historicoProdução.rows.map((row, idx) => (
          <DocumentValidationRow
            key={idx}
            item={row}
            onUpdate={(u) => updateHistoricoRow("historicoProdução", idx, u)}
            onFileChange={(f) =>
              updateHistoricoFile("historicoProdução", idx, f)
            }
            onDelete={
              data.historicoProdução.rows.length > 1
                ? () => removeHistoricoRow("historicoProdução", idx)
                : undefined
            }
            readOnly={readOnly}
            label={`Relatório ${idx + 1}`}
          />
        ))}
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => addHistoricoRow("historicoProdução")}
          disabled={readOnly}
        >
          {t("indicadores.addReport", "Add Novo Relatório")}
        </Button>
      </Paper>

      {/* ── Histórico de Pagamentos ── */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
          HISTÓRICO DE PAGAMENTOS
        </Typography>
        <Divider sx={{ mb: 2 }} />
        {data.historicoPagamentos.rows.map((row, idx) => (
          <DocumentValidationRow
            key={idx}
            item={row}
            onUpdate={(u) => updateHistoricoRow("historicoPagamentos", idx, u)}
            onFileChange={(f) =>
              updateHistoricoFile("historicoPagamentos", idx, f)
            }
            onDelete={
              data.historicoPagamentos.rows.length > 1
                ? () => removeHistoricoRow("historicoPagamentos", idx)
                : undefined
            }
            readOnly={readOnly}
            label={`Relatório ${idx + 1}`}
          />
        ))}
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => addHistoricoRow("historicoPagamentos")}
          disabled={readOnly}
        >
          {t("indicadores.addReport", "Add Novo Relatório")}
        </Button>
      </Paper>

      {/* ── Histórico de Vendas ── */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
          HISTÓRICO DE VENDAS
        </Typography>
        <Divider sx={{ mb: 2 }} />
        {data.historicoVendas.rows.map((row, idx) => (
          <DocumentValidationRow
            key={idx}
            item={row}
            onUpdate={(u) => updateHistoricoRow("historicoVendas", idx, u)}
            onFileChange={(f) => updateHistoricoFile("historicoVendas", idx, f)}
            onDelete={
              data.historicoVendas.rows.length > 1
                ? () => removeHistoricoRow("historicoVendas", idx)
                : undefined
            }
            readOnly={readOnly}
            label={`Relatório ${idx + 1}`}
          />
        ))}
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => addHistoricoRow("historicoVendas")}
          disabled={readOnly}
        >
          {t("indicadores.addReport", "Add Novo Relatório")}
        </Button>
      </Paper>

      {/* ── Outros Relatórios (itens fixos) ── */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
          OUTROS RELATÓRIOS
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <DocumentValidationRow
          item={data.paretoVendas}
          onUpdate={(u) => updateSimple("paretoVendas", u)}
          onFileChange={(f) => updateSimpleFile("paretoVendas", f)}
          readOnly={readOnly}
          label="Pareto de Vendas"
        />
        <DocumentValidationRow
          item={data.paretoFornecedores}
          onUpdate={(u) => updateSimple("paretoFornecedores", u)}
          onFileChange={(f) => updateSimpleFile("paretoFornecedores", f)}
          readOnly={readOnly}
          label="Pareto de Fornecedores"
        />
        <DocumentValidationRow
          item={data.relatorioCusto}
          onUpdate={(u) => updateSimple("relatorioCusto", u)}
          onFileChange={(f) => updateSimpleFile("relatorioCusto", f)}
          readOnly={readOnly}
          label="Relatório de Custo"
        />
        <DocumentValidationRow
          item={data.relatorioCentroCusto}
          onUpdate={(u) => updateSimple("relatorioCentroCusto", u)}
          onFileChange={(f) => updateSimpleFile("relatorioCentroCusto", f)}
          readOnly={readOnly}
          label="Relatório de Centro de Custo"
        />
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
            t("common.save", "Salvar")
          )}
        </Button>
      </Box>
    </Box>
  );
};

export default IndicadoresForm;
