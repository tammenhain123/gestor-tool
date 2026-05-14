import { api } from "./api";
import {
  Project,
  CreateProjectPayload,
  UpdateProjectPayload,
} from "../types/project";

export type ProjectType = "SAAS" | "OFERTA" | "DEMANDA";

const BASE = "/projects";

// In dev, allow localStorage-based mock so frontend can be tested without backend
const DEV_MOCK =
  typeof import.meta !== "undefined" && !!(import.meta as any).env?.DEV;
const mockKey = (projectId: string) => `mock:qualification:${projectId}`;

export async function getProjects(): Promise<Project[]> {
  try {
    const dbId = localStorage.getItem("db_user_id");
    if (dbId) {
      const userResp = await api.get(`/users/${dbId}`);
      const dbUser = userResp.data as any;
      const role = String(dbUser?.role ?? "").toUpperCase();
      const tenant = dbUser?.company?.id ?? dbUser?.tenantId ?? null;

      // If ADMIN or MASTER, request tenant-scoped projects
      if ((role === "ADMIN" || role === "MASTER") && tenant) {
        const res = await api.get<Project[]>(`${BASE}?tenantId=${tenant}`);
        return res.data;
      }

      // If USER, request plain /projects and backend will return only member projects
      if (role === "USER") {
        const res = await api.get<Project[]>(BASE);
        return res.data;
      }
    }
  } catch (e) {
    // ignore and fallback
  }

  const res = await api.get<Project[]>(BASE);
  return res.data;
}

export async function getProject(id: string): Promise<Project> {
  const res = await api.get<Project>(`${BASE}/${id}`);
  return res.data;
}

export async function getQualification(projectId: string): Promise<any> {
  if (DEV_MOCK) {
    try {
      const raw = localStorage.getItem(mockKey(projectId));
      if (raw) return JSON.parse(raw);
    } catch (e) {
      // ignore
    }
  }
  const res = await api.get<any>(`${BASE}/${projectId}/qualification`);
  return res.data;
}

export async function getCapacity(projectId: string): Promise<any> {
  const res = await api.get<any>(`${BASE}/${projectId}/capacity`);
  return res.data;
}

export async function getRequirements(projectId: string): Promise<any> {
  const res = await api.get<any>(`${BASE}/${projectId}/requisitos`);
  return res.data;
}

export async function getStrategy(projectId: string): Promise<any> {
  const res = await api.get<any>(`${BASE}/${projectId}/strategy`);
  return res.data;
}

export async function getIndicators(projectId: string): Promise<any> {
  const res = await api.get<any>(`${BASE}/${projectId}/indicators`);
  return res.data;
}

export async function saveQualification(
  projectId: string,
  payload: any,
): Promise<any> {
  if (DEV_MOCK) {
    try {
      // create a lightweight saved object with an id so frontend can consume it
      const id = String(Date.now());
      const saved = { id, ...payload };
      localStorage.setItem(mockKey(projectId), JSON.stringify(saved));
      return saved;
    } catch (e) {
      // fallback to real API
    }
  }
  const res = await api.put<any>(`${BASE}/${projectId}/qualification`, payload);
  return res.data;
}

export async function saveCapacity(
  projectId: string,
  payload: any,
): Promise<any> {
  const res = await api.put<any>(`${BASE}/${projectId}/capacity`, payload);
  return res.data;
}

export async function saveStrategy(
  projectId: string,
  payload: any,
): Promise<any> {
  const res = await api.put<any>(`${BASE}/${projectId}/strategy`, payload);
  return res.data;
}

export async function saveIndicators(
  projectId: string,
  payload: any,
): Promise<any> {
  const res = await api.put<any>(`${BASE}/${projectId}/indicators`, payload);
  return res.data;
}

export async function saveRequirements(
  projectId: string,
  payload: any,
): Promise<any> {
  const res = await api.put<any>(`${BASE}/${projectId}/requisitos`, payload);
  return res.data;
}

export async function createProject(
  payload: CreateProjectPayload,
): Promise<Project> {
  const creatorId = localStorage.getItem("db_user_id") || undefined;
  const body = { ...payload, ...(creatorId ? { creatorId } : {}) };
  const res = await api.post<Project>(BASE, body);
  return res.data;
}

export async function updateProject(
  id: string,
  payload: UpdateProjectPayload,
): Promise<Project> {
  const res = await api.put<Project>(`${BASE}/${id}`, payload);
  return res.data;
}

export async function deleteProject(id: string): Promise<void> {
  await api.delete(`${BASE}/${id}`);
}

export default {
  getProjects,
  getProject,
  getRequirements,
  createProject,
  updateProject,
  deleteProject,
};
