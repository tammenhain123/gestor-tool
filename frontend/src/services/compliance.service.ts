import { api } from "./api";
import {
  ComplianceValidation,
  OrganogramDocument,
  ReportItem,
  PatrimonialGood,
  BankStatement,
} from "../types/compliance";

// ========== COMPLIANCE VALIDATION ==========

export async function getCompliance(
  projectId: string,
): Promise<ComplianceValidation | null> {
  try {
    const res = await api.get<ComplianceValidation>(
      `/projects/${projectId}/compliance`,
    );
    return res.data;
  } catch (err: any) {
    if (err?.response?.status === 404) {
      return null;
    }
    throw err;
  }
}

export async function saveCompliance(
  projectId: string,
  payload: Partial<ComplianceValidation>,
): Promise<ComplianceValidation> {
  console.log("=== SAVING COMPLIANCE ===");
  console.log("Full payload being sent:", JSON.stringify(payload, null, 2)); // DEBUG - Detailed
  console.log("Reports in payload:", payload.reports); // DEBUG
  if (payload.reports) {
    payload.reports.forEach((rep, idx) => {
      console.log(`Report ${idx}:`, {
        id: rep.id,
        type: rep.type,
        status: rep.status,
        validationDate: rep.validationDate,
        description: rep.description,
      });
    });
  }
  if (payload.organograms) {
    payload.organograms.forEach((org, idx) => {
      console.log(`Organogram ${idx}:`, {
        id: org.id,
        name: org.name,
        status: org.status,
        validationDate: org.validationDate,
        description: org.description,
      });
    });
  }

  const res = await api.post<ComplianceValidation>(
    `/projects/${projectId}/compliance`,
    payload,
  );
  console.log("=== COMPLIANCE SAVED RESPONSE ===");
  console.log("Response reports:", res.data.reports); // DEBUG
  if (res.data.reports) {
    res.data.reports.forEach((rep, idx) => {
      console.log(`Response Report ${idx}:`, {
        id: rep.id,
        type: rep.type,
        status: rep.status,
        validationDate: rep.validationDate,
        description: rep.description,
      });
    });
  }
  if (res.data.organograms) {
    res.data.organograms.forEach((org, idx) => {
      console.log(`Response Organogram ${idx}:`, {
        id: org.id,
        name: org.name,
        status: org.status,
        validationDate: org.validationDate,
        description: org.description,
      });
    });
  }
  return res.data;
}

export async function addOrganogram(
  projectId: string,
  name: string,
  description?: string,
): Promise<ComplianceValidation> {
  const res = await api.post<ComplianceValidation>(
    `/projects/${projectId}/compliance/organogram`,
    {
      name,
      description,
    },
  );
  return res.data;
}

export async function saveOrganogram(
  projectId: string,
  data: OrganogramDocument,
): Promise<ComplianceValidation> {
  const payload = {
    ...data,
    file: undefined,
  };

  const res = await api.post<ComplianceValidation>(
    `/projects/${projectId}/compliance/organogram/upsert`,
    payload,
  );
  return res.data;
}

export async function deleteOrganogram(
  projectId: string,
  organogramId: string,
): Promise<ComplianceValidation> {
  const res = await api.delete<ComplianceValidation>(
    `/projects/${projectId}/compliance/organogram/${organogramId}`,
  );
  return res.data;
}

export async function validateOrganogram(
  projectId: string,
  organogramId: string,
  status: "VALIDATED" | "NOT_VALIDATED",
): Promise<ComplianceValidation> {
  const res = await api.put<ComplianceValidation>(
    `/projects/${projectId}/compliance/organogram/${organogramId}/validate`,
    { status },
  );
  return res.data;
}

export async function addReport(
  projectId: string,
  type: string,
  description?: string,
): Promise<ComplianceValidation> {
  const res = await api.post<ComplianceValidation>(
    `/projects/${projectId}/compliance/report`,
    {
      type,
      description,
    },
  );
  return res.data;
}

export async function saveReport(
  projectId: string,
  data: ReportItem,
): Promise<ComplianceValidation> {
  const payload = {
    ...data,
    file: undefined,
  };

  const res = await api.post<ComplianceValidation>(
    `/projects/${projectId}/compliance/report/upsert`,
    payload,
  );
  return res.data;
}

export async function validateReport(
  projectId: string,
  reportId: string,
  status: "VALIDATED" | "NOT_VALIDATED",
): Promise<ComplianceValidation> {
  const res = await api.put<ComplianceValidation>(
    `/projects/${projectId}/compliance/report/${reportId}/validate`,
    { status },
  );
  return res.data;
}

export async function getComplianceAuditLog(projectId: string): Promise<any[]> {
  try {
    const res = await api.get<any[]>(
      `/projects/${projectId}/compliance/audit-log`,
    );
    return res.data;
  } catch {
    return [];
  }
}

// ========== PATRIMONIAL GOODS ==========

export async function getPatrimonialGoods(
  projectId: string,
): Promise<PatrimonialGood[]> {
  try {
    const res = await api.get<PatrimonialGood[]>(
      `/projects/${projectId}/patrimonial-goods`,
    );
    return res.data;
  } catch {
    return [];
  }
}

export async function getPatrimonialGood(
  projectId: string,
  id: string,
): Promise<PatrimonialGood> {
  const res = await api.get<PatrimonialGood>(
    `/projects/${projectId}/patrimonial-goods/${id}`,
  );
  return res.data;
}

export async function createPatrimonialGood(
  projectId: string,
  data: any,
): Promise<PatrimonialGood> {
  const res = await api.post<PatrimonialGood>(
    `/projects/${projectId}/patrimonial-goods`,
    data,
  );
  return res.data;
}

export async function updatePatrimonialGood(
  projectId: string,
  id: string,
  data: any,
): Promise<PatrimonialGood> {
  const res = await api.put<PatrimonialGood>(
    `/projects/${projectId}/patrimonial-goods/${id}`,
    data,
  );
  return res.data;
}

export async function deletePatrimonialGood(
  projectId: string,
  id: string,
): Promise<void> {
  await api.delete(`/projects/${projectId}/patrimonial-goods/${id}`);
}

export async function addAttachmentToPatrimonialGood(
  projectId: string,
  goodId: string,
  attachmentType: string,
  s3Key: string,
): Promise<PatrimonialGood> {
  const res = await api.post<PatrimonialGood>(
    `/projects/${projectId}/patrimonial-goods/${goodId}/attachment`,
    { attachmentType, s3Key },
  );
  return res.data;
}

// ========== BANK STATEMENTS (existing, but can be enhanced) ==========

export async function getBankStatements(
  projectId: string,
  capacityId?: string,
): Promise<BankStatement[]> {
  try {
    const params = capacityId ? { capacityId } : {};
    const res = await api.get<BankStatement[]>(
      `/projects/${projectId}/bank-entries`,
      { params },
    );
    // Transform validatorName -> validator for frontend consistency
    return res.data.map((entry: any) => ({
      ...entry,
      validator: entry.validatorName || entry.validator,
    }));
  } catch {
    return [];
  }
}

export async function saveBankStatement(
  projectId: string,
  data: BankStatement,
): Promise<BankStatement> {
  // Transform validator -> validatorName for backend compatibility
  const payload = {
    ...data,
    validatorName: data.validator,
    validator: undefined,
  };

  console.log("Saving bank statement:", { data, payload }); // DEBUG

  if (data.id) {
    const res = await api.put<BankStatement>(
      `/projects/${projectId}/bank-entries/${data.id}`,
      payload,
    );
    return res.data;
  } else {
    const res = await api.post<BankStatement>(
      `/projects/${projectId}/bank-entries`,
      payload,
    );
    return res.data;
  }
}

export async function deleteBankStatement(
  projectId: string,
  id: string,
): Promise<void> {
  await api.delete(`/projects/${projectId}/bank-entries/${id}`);
}
