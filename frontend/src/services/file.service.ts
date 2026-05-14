import api from "./api";

export async function presign(
  projectId: string,
  filename: string,
  projectName?: string,
  tabName?: string,
  fieldName?: string,
) {
  const body: any = { filename };
  if (projectName) body.projectName = projectName;
  if (tabName) body.tabName = tabName;
  if (fieldName) body.fieldName = fieldName;
  const res = await api.post(`/projects/${projectId}/files/presign`, body);
  return res.data as { key: string; url: string };
}

export async function uploadViaBackend(
  projectId: string,
  file: File,
  projectName?: string,
  tabName?: string,
  fieldName?: string,
) {
  const form = new FormData();
  form.append("file", file);
  if (projectName) form.append("projectName", projectName);
  if (tabName) form.append("tabName", tabName);
  if (fieldName) form.append("fieldName", fieldName);
  const res = await api.post(`/projects/${projectId}/files`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function list(projectId: string) {
  const res = await api.get(`/projects/${projectId}/files`);
  return res.data as any[];
}

export async function saveMetadata(
  projectId: string,
  payload: {
    key: string;
    originalName: string;
    mimeType?: string;
    size?: number;
    uploadedBy?: string;
    qualificationId?: string;
    capacityId?: string;
    companyId?: string;
    replaceOriginalName?: string;
    labelKey?: string;
  },
) {
  const res = await api.post(`/projects/${projectId}/files/metadata`, payload);
  return res.data;
}

export async function presignGet(projectId: string, key: string) {
  const res = await api.get(
    `/projects/${projectId}/files/presign-get?key=${encodeURIComponent(key)}`,
  );
  return res.data as { url: string };
}

export default { presign, saveMetadata, presignGet, list, uploadViaBackend };
