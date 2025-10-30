import Cookies from "js-cookie";
import { deleteUserById } from "./userService";

const BASE_URL = "http://localhost:5000/api/v1/user";

export interface User {
  id: string;
  email: string;
  fullname: string;
  avatar: string;
  role: "ADMIN" | "USER" | string;
  isVerified: boolean;
  sex?: number;
  dob?: string;
}

export interface LoginResponse {
  status: number;
  message: string;
  token: string;
  data: User;
}

/**
 * Helper để lấy headers kèm token
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
 * Đăng nhập người dùng
 * Endpoint: POST /api/v1/user/login
 * Body: { email, password }
 * 
 * Lưu ý: chỉ ADMIN mới được phép đăng nhập thành công
 */
export const login = async (email: string, password: string): Promise<LoginResponse> => {
  const res = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  // Nếu lỗi HTTP
if (!res.ok) {
  const errorData = await res.json().catch(() => ({}));
  const errorMessage = errorData.message || "Đăng nhập thất bại, vui lòng thử lại.";
  throw new Error(errorMessage);
}


  const json = await res.json();

  // Map dữ liệu trả về
  const user: User = {
    id: json.data._id,
    email: json.data.email,
    fullname: json.data.fullname,
    avatar: json.data.avatar,
    role: json.data.role,
    isVerified: json.data.isVerified,
    sex: json.data.sex,
    dob: json.data.dob,
  };

  // Kiểm tra quyền ADMIN
  if (user.role !== "ADMIN") {
    throw new Error("Bạn không có quyền truy cập (chỉ ADMIN mới được phép đăng nhập).");
  }

  // Trả về dữ liệu đăng nhập thành công
  return {
    status: json.status,
    message: json.message,
    token: json.token,
    data: user,
  };
};

/**
 * Đăng xuất — chỉ đơn giản là xóa token khỏi localStorage/sessionStorage
 */
export const logout = (): void => {
  Cookies.remove("token");
  localStorage.removeItem("user");
};

/**
 * Lưu token và thông tin user sau khi đăng nhập
 */
export const saveAuthData = (token: string, user: User): void => {
  // Lưu token vào cookie, hết hạn sau 7 ngày
  Cookies.set("token", token, { expires: 7, secure: true, sameSite: 'strict' });
  // Vẫn có thể lưu thông tin user vào localStorage để truy cập nhanh ở client
  localStorage.setItem("user", JSON.stringify(user));
};

/**
 * Lấy thông tin user hiện tại
 */
export const getCurrentUser = (): User | null => {
  const stored = localStorage.getItem("user");
  return stored ? JSON.parse(stored) : null;
};

/**
 * Lấy token hiện tại
 */
export const getToken = (): string | null => {
  return Cookies.get("token") || null;
};

/**
 * Lấy thông tin chi tiết người dùng bằng ID
 * Endpoint: GET /api/v1/user/get-user/:id
 */
export const getUserInfoById = async (id: string): Promise<User> => {
  const res = await fetch(`${BASE_URL}/get-user/${id}`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const errorMessage = errorData.message || `Failed to fetch user with id ${id}.`;
    throw new Error(errorMessage);
  }

  const json = await res.json();
  const userData = json.data;

  // Map _id from backend to id on frontend
  return { ...userData, id: userData._id };
};

/**
 * Xóa người dùng theo ID.
 * Hàm này gọi `deleteUserById` từ `userService` để thực hiện.
 */
export const deleteUser = async (id: string): Promise<{ message: string }> => {
  return deleteUserById(id);
};
