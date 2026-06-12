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
  const res = await api.post<ComplianceValidation>(
    `/projects/${projectId}/compliance`,
    payload,
  );
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
