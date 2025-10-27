// src/services/userService.ts

import { getToken } from "./authService";
import { User } from "./authService"; // Reusing the User interface from authService

export interface UserAPIResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  users: User[];
}

const BASE_URL = "http://localhost:5000/api/v1/user";

/**
 * Helper để lấy headers kèm token
 * NOTE: This is duplicated across services. Consider moving to a shared utility file.
 */
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
 * Lấy danh sách người dùng (phân trang, tìm kiếm)
 * Endpoint: GET /api/v1/user/get-user-list?page=1&limit=10&search=...
 */
export const getUsers = async (
  page = 1,
  limit = 10,
  search = ''
): Promise<UserAPIResponse> => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (search) params.append('search', search);

  const res = await fetch(`${BASE_URL}/get-user-list?${params.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch users: ${errorText}`);
  }

  const json = await res.json();
  // Map _id from backend to id on frontend for each user
  const mappedUsers = json.data.users.map((user: any) => {
    const { _id, ...rest } = user;
    return { ...rest, id: _id };
  });

  return { ...json.data, users: mappedUsers };
};

/**
 * Tạo người dùng mới (chỉ dành cho Admin)
 * Endpoint: POST /api/v1/user/create-user
 */
export const addUser = async (
  userData: Pick<User, "email" | "role" | "fullname"> & { password: string }
): Promise<User> => {
  const res = await fetch(`${BASE_URL}/create-user`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(userData),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const errorMessage =
      errorData.message || "Tạo người dùng thất bại, vui lòng thử lại.";
    throw new Error(errorMessage);
  }

  const json = await res.json();
  const createdUser = json.data;

  // Ánh xạ _id từ backend sang id ở frontend
  const { _id, ...rest } = createdUser;
  return { ...rest, id: _id };
};