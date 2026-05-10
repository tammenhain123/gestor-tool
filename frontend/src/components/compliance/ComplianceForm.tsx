import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Grid from "@mui/material/Grid";
import Divider from "@mui/material/Divider";
import Alert from "@mui/material/Alert";
import AddIcon from "@mui/icons-material/Add";
import { useAuth } from "../../auth/AuthProvider";
import DocumentValidationRow from "./DocumentValidationRow";
import BankStatementRow from "./BankStatementRow";
import PatrimonialGoodForm from "./PatrimonialGoodForm";
import {
  getCompliance,
  saveCompliance,
  getPatrimonialGoods,
  createPatrimonialGood,
  updatePatrimonialGood,
  deletePatrimonialGood,
  saveBankStatement,
  getBankStatements,
} from "../../services/compliance.service";
import {
  ComplianceValidation,
  OrganogramDocument,
  ReportItem,
  BankStatement,
  PatrimonialGood,
} from "../../types/compliance";

type Props = {
  projectId?: string;
  projectName?: string;
};

const ComplianceForm: React.FC<Props> = ({ projectId, projectName }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isReadOnly = String(user?.role || "").toUpperCase() === "USER";

  // Compliance state
  const [compliance, setCompliance] = useState<ComplianceValidation | null>(
    null,
  );
  const [organograms, setOrganograms] = useState<OrganogramDocument[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);

  // Bank statements
  const [bankEntries, setBankEntries] = useState<BankStatement[]>([
    { banco: "", numeroConta: "", agencia: "", ano: "", mes: "" },
  ]);

  // Patrimonial goods
  const [patrimonialGoods, setPatrimonialGoods] = useState<PatrimonialGood[]>(
    [],
  );
  const [selectedGood, setSelectedGood] = useState<PatrimonialGood | null>(
    null,
  );
  const [dialogOpen, setDialogOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const projectIdToUse = projectId || "";

  // Load data on mount
  useEffect(() => {
    if (!projectIdToUse) return;
    (async () => {
      try {
        setLoading(true);

        // Load compliance
        const compData = await getCompliance(projectIdToUse);
        if (compData) {
          setCompliance(compData);
          setOrganograms(compData.organograms || []);
          setReports(compData.reports || []);
        }

        // Load bank statements
        const banks = await getBankStatements(projectIdToUse);
        if (banks.length > 0) {
          setBankEntries(banks);
        }

        // Load patrimonial goods
        const goods = await getPatrimonialGoods(projectIdToUse);
        setPatrimonialGoods(goods);
      } catch (err) {
        console.error("Error loading compliance data:", err);
        setMessage({
          type: "error",
          text: t("compliance.loadError", "Erro ao carregar dados"),
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [projectIdToUse, t]);

  // ========== ORGANOGRAM HANDLERS ==========
  const updateOrganogram = (
    index: number,
    updates: Partial<OrganogramDocument>,
  ) => {
    setOrganograms((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  };

  const updateOrganogramFile = (index: number, file: File | null) => {
    setOrganograms((prev) => {
      const next = [...prev];
      (next[index] as any).file = file;
      return next;
    });
  };

  // ========== REPORT HANDLERS ==========
  const updateReport = (index: number, updates: Partial<ReportItem>) => {
    setReports((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  };

  const updateReportFile = (index: number, file: File | null) => {
    setReports((prev) => {
      const next = [...prev];
      (next[index] as any).file = file;
      return next;
    });
  };

  // ========== BANK ENTRY HANDLERS ==========
  const updateBankEntry = (index: number, updates: Partial<BankStatement>) => {
    setBankEntries((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  };

  const updateBankEntryFile = (index: number, file: File | null) => {
    setBankEntries((prev) => {
      const next = [...prev];
      (next[index] as any).file = file;
      return next;
    });
  };

  const addBankEntry = () => {
    setBankEntries((prev) => [
      ...prev,
      { banco: "", numeroConta: "", agencia: "", ano: "", mes: "" },
    ]);
  };

  const deleteBankEntry = (index: number) => {
    setBankEntries((prev) => prev.filter((_, i) => i !== index));
  };

  // ========== PATRIMONIAL GOOD HANDLERS ==========
  const openGoodDialog = (good?: PatrimonialGood) => {
    setSelectedGood(good || null);
    setDialogOpen(true);
  };

  const savePatrimonialGood = async (good: PatrimonialGood) => {
    try {
      if (good.id) {
        const updated = await updatePatrimonialGood(
          projectIdToUse,
          good.id,
          good.data,
        );
        setPatrimonialGoods((prev) =>
          prev.map((g) => (g.id === updated.id ? updated : g)),
        );
      } else {
        const created = await createPatrimonialGood(projectIdToUse, good.data);
        setPatrimonialGoods((prev) => [...prev, created]);
      }
      setMessage({
        type: "success",
        text: t("compliance.goodSaved", "Bem patrimonial salvo com sucesso"),
      });
    } catch (err) {
      setMessage({
        type: "error",
        text: t("compliance.goodSaveError", "Erro ao salvar bem patrimonial"),
      });
    }
  };

  const deletePatrimonialGoodHandler = async (id: string) => {
    if (
      !window.confirm(
        t("compliance.confirmDelete", "Tem certeza que deseja deletar?"),
      )
    )
      return;

    try {
      await deletePatrimonialGood(projectIdToUse, id);
      setPatrimonialGoods((prev) => prev.filter((g) => g.id !== id));
      setMessage({
        type: "success",
        text: t("compliance.goodDeleted", "Bem patrimonial deletado"),
      });
    } catch (err) {
      setMessage({
        type: "error",
        text: t("compliance.goodDeleteError", "Erro ao deletar bem"),
      });
    }
  };

  // ========== SAVE ALL ==========
  const handleSaveAll = async () => {
    if (!projectIdToUse) return;

    try {
      setSaving(true);

      // Save compliance (organograms + reports)
      const payload: Partial<ComplianceValidation> = {
        organograms: organograms.map(({ file, ...rest }: any) => rest),
        reports: reports.map(({ file, ...rest }: any) => rest),
      };

      await saveCompliance(projectIdToUse, payload);

      // Save bank entries
      for (const entry of bankEntries) {
        if (entry.banco) {
          // Only save if has banco (required field)
          await saveBankStatement(projectIdToUse, entry as any);
        }
      }

      setMessage({
        type: "success",
        text: t("compliance.savedSuccess", "Dados salvos com sucesso"),
      });
    } catch (err) {
      console.error("Save error:", err);
      setMessage({
        type: "error",
        text: t("compliance.saveError", "Erro ao salvar"),
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>{t("common.loading", "Carregando...")}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {message && (
        <Alert
          severity={message.type}
          onClose={() => setMessage(null)}
          sx={{ mb: 2 }}
        >
          {message.text}
        </Alert>
      )}

      {/* BLOCO 1: ORGANOGRAMA */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
          {t("compliance.organogram", "ORGANOGRAMA DE CARGOS E FUNÇÕES")}
        </Typography>
        <Divider sx={{ mb: 2 }} />

        {organograms.length === 0 ? (
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            {t("compliance.noDocuments", "Nenhum documento adicionado")}
          </Typography>
        ) : (
          organograms.map((item, idx) => (
            <DocumentValidationRow
              key={idx}
              item={item}
              onUpdate={(updates) => updateOrganogram(idx, updates)}
              onFileChange={(file) => updateOrganogramFile(idx, file)}
              readOnly={isReadOnly}
              label={item.description}
            />
          ))
        )}

        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => {
            setOrganograms((prev) => [
              ...prev,
              {
                type: "organogram",
                name: `Organograma ${prev.length + 1}`,
                isRequested: false,
              },
            ]);
          }}
          disabled={isReadOnly}
          sx={{ mt: 2 }}
        >
          {t("compliance.addOrganogram", "Add Novo Organograma")}
        </Button>
      </Paper>

      {/* BLOCO 2: EXTRATOS BANCÁRIOS */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
          {t("compliance.bankStatements", "EXTRATOS BANCÁRIOS")}
        </Typography>
        <Divider sx={{ mb: 2 }} />

        {bankEntries.map((item, idx) => (
          <BankStatementRow
            key={idx}
            item={item}
            index={idx}
            onUpdate={(updates) => updateBankEntry(idx, updates)}
            onFileChange={(file) => updateBankEntryFile(idx, file)}
            onDelete={() => deleteBankEntry(idx)}
            readOnly={isReadOnly}
          />
        ))}

        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={addBankEntry}
          disabled={isReadOnly}
          sx={{ mt: 2 }}
        >
          {t("compliance.addBankEntry", "Add Novo Extrato Bancário")}
        </Button>
      </Paper>

      {/* BLOCO 3: RELATÓRIOS */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
          {t("compliance.reports", "RELATÓRIOS")}
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Grid container spacing={2} sx={{ mb: 2 }}>
          {[
            {
              key: "relatorio-endividamento",
              label: "Relatório de Endividamento",
            },
            { key: "relatorio-scr", label: "Relatório SCR - BACEN" },
            { key: "relatorio-recebiveis", label: "Relatório de Recebíveis" },
            { key: "relatorio-estoque", label: "Relatório de Estoque" },
            { key: "relatorio-ativo", label: "Relatório de Ativo" },
            {
              key: "relatorio-alienacao",
              label: "Relatório de Alienação/Gravames",
            },
          ].map(({ key, label }) => {
            const existing = reports.find((r) => r.type === (key as any));
            return (
              <Grid item xs={12} key={key}>
                <DocumentValidationRow
                  item={
                    (existing as any) || {
                      name: label,
                      type: key as any,
                      isRequested: false,
                    }
                  }
                  onUpdate={(updates) => {
                    if (existing) {
                      const idx = reports.findIndex(
                        (r) => r.type === (key as any),
                      );
                      updateReport(idx, updates);
                    } else {
                      setReports((prev) => [
                        ...prev,
                        {
                          name: label,
                          type: key as any,
                          ...updates,
                        } as ReportItem,
                      ]);
                    }
                  }}
                  onFileChange={(file) => {
                    if (existing) {
                      const idx = reports.findIndex(
                        (r) => r.type === (key as any),
                      );
                      updateReportFile(idx, file);
                    }
                  }}
                  readOnly={isReadOnly}
                  label={label}
                />
              </Grid>
            );
          })}
        </Grid>
      </Paper>

      {/* BLOCO 4 & 5: BENS PATRIMONIAIS */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
          {t("compliance.patrimonialGoods", "BENS PATRIMONIAIS")}
        </Typography>
        <Divider sx={{ mb: 2 }} />

        {patrimonialGoods.length === 0 ? (
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            {t("compliance.noGoods", "Nenhum bem patrimonial adicionado")}
          </Typography>
        ) : (
          <Stack spacing={2} sx={{ mb: 2 }}>
            {patrimonialGoods.map((good, idx) => (
              <Paper
                key={good.id || idx}
                sx={{
                  p: 2,
                  bgcolor: "#f9f9f9",
                  border: "1px solid #e0e0e0",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {good.data.presentacaoFisica}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {good.data.currency} - Matrícula:{" "}
                    {good.data.matricula || "-"}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => openGoodDialog(good)}
                  >
                    {t("common.edit", "Editar")}
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    onClick={() =>
                      good.id && deletePatrimonialGoodHandler(good.id)
                    }
                    disabled={isReadOnly}
                  >
                    {t("common.delete", "Deletar")}
                  </Button>
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}

        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => openGoodDialog()}
          disabled={isReadOnly}
          sx={{ mt: 2 }}
        >
          {t("compliance.addPatrimonialGood", "Add Novo Bem Patrimonial")}
        </Button>
      </Paper>

      {/* Save Button */}
      <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end", mt: 3 }}>
        <Button
          variant="contained"
          onClick={handleSaveAll}
          disabled={isReadOnly || saving}
        >
          {saving
            ? t("common.saving", "Salvando...")
            : t("common.save", "Salvar")}
        </Button>
      </Box>

      {/* Patrimonial Good Dialog */}
      <PatrimonialGoodForm
        item={selectedGood || undefined}
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setSelectedGood(null);
        }}
        onSave={savePatrimonialGood}
        readOnly={isReadOnly}
      />
    </Box>
  );
};

export default ComplianceForm;
