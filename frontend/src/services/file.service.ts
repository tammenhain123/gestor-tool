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
  const res = await api.post(`/projects/${projectId}/files`, form);
  return res.data;
}

export async function uploadProjectFile(
  projectId: string,
  file: File,
  projectName?: string,
  tabName?: string,
  fieldName?: string,
) {
  const isLocalhost =
    typeof window !== "undefined" &&
    ["localhost", "127.0.0.1"].includes(window.location.hostname);

  if (isLocalhost) {
    const backendRes = await uploadViaBackend(projectId, file, projectName, tabName, fieldName);
    return { key: backendRes?.key, id: backendRes?.id, via: "backend" as const };
  }

  try {
    const signed = await presign(projectId, file.name, projectName, tabName, fieldName);
    const uploadRes = await fetch(signed.url, {
      method: "PUT",
      headers: { "Content-Type": file.type || "application/octet-stream" },
      body: file,
    });

    if (!uploadRes.ok) throw new Error(`S3 upload failed: ${uploadRes.status}`);

    return { key: signed.key, via: "s3" as const };
  } catch (err) {
    const backendRes = await uploadViaBackend(projectId, file, projectName, tabName, fieldName);
    return { key: backendRes?.key, id: backendRes?.id, via: "backend" as const };
  }
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

export default { presign, saveMetadata, presignGet, list, uploadViaBackend, uploadProjectFile };
