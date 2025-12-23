// src/services/planService.ts

import { getToken } from "./authService";

export interface Plan {
  id?: string;
  name: string;
  price: number;
  durationDays: number;
  createdAt?: string;
  updatedAt?: string;
}

const BASE_URL = "https://java-app-9trd.onrender.com/api/v1/plans";

const getAuthHeaders = (isFormData = false) => {
  const token = getToken();
  const headers: HeadersInit = {};

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

/**
 * Lấy danh sách plan (endpoint: GET /list)
 */
export const getPlans = async (): Promise<Plan[]> => {
  const res = await fetch(`${BASE_URL}/list`, { headers: getAuthHeaders() });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch plans: ${text}`);
  }

  const data = await res.json();
  if (!data || !Array.isArray(data.data)) return [];

  // The API returns { data: [ { id, name, price, durationDays, ... }, ... ] }
  return data.data.map((p: any) => ({
    id: p.id ?? p._id,
    name: p.name,
    price: Number(p.price),
    durationDays: Number(p.durationDays),
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }));
};

/**
 * Lấy 1 plan theo ID (endpoint: GET /getId/:id)
 */
export const getPlanById = async (id: string): Promise<Plan> => {
  const res = await fetch(`${BASE_URL}/getId/${id}`, { headers: getAuthHeaders() });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch plan ${id}: ${text}`);
  }

  const data = await res.json();
  const p = data.data;
  return {
    id: p.id ?? p._id,
    name: p.name,
    price: Number(p.price),
    durationDays: Number(p.durationDays),
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
};

/**
 * Cập nhật plan (PUT /update/:id) — backend may be added later
 */
export const updatePlan = async (id: string, payload: Partial<Plan>): Promise<Plan> => {
  const res = await fetch(`${BASE_URL}/update/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to update plan ${id}: ${text}`);
  }

  const data = await res.json();
  const p = data.data;
  return {
    id: p.id ?? p._id,
    name: p.name,
    price: Number(p.price),
    durationDays: Number(p.durationDays),
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
};

/**
 * Tạo plan mới (POST /create)
 */
export const createPlan = async (payload: Partial<Plan>): Promise<Plan> => {
  const res = await fetch(`${BASE_URL}/create`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to create plan: ${text}`);
  }

  const data = await res.json();
  const p = data.data;
  return {
    id: p.id ?? p._id,
    name: p.name,
    price: Number(p.price),
    durationDays: Number(p.durationDays),
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
};

/**
 * Xóa plan theo id (DELETE /delete/:id) — backend may be added later
 */
export const deletePlan = async (id: string): Promise<{ message?: string }> => {
  const res = await fetch(`${BASE_URL}/delete/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to delete plan ${id}: ${text}`);
  }

  const data = await res.json();
  return data;
};
