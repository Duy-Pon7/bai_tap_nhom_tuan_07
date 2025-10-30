// src/services/subjectService.ts

import { getToken } from "./authService";

export interface Subject {
  id?: string; // chưa có khi tạo mới
  name: string;
  description: string;
  image?: string;
  maxTopics: number;
}

export interface SubjectAPIResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  subjects: Subject[];
}

const BASE_URL = "http://localhost:5000/api/v1/subject";

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
 * Lấy danh sách môn học (có phân trang)
 */
export const getSubjects = async (page = 1, limit = 10, search = ''): Promise<SubjectAPIResponse> => {
  const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
  const res = await fetch(`${BASE_URL}/get-subjects?page=${page}&limit=${limit}${searchParam}`, { headers: getAuthHeaders() });
  
  if (!res.ok) throw new Error("Failed to fetch subjects");

  const data = await res.json();
  if (!data.data) {
    return { subjects: [], totalPages: 0, total: 0, page: 1, limit: 10 };
  }

  // Map _id from backend to id on frontend.
  const mappedSubjects = data.data.subjects.map((subject: any) => {
    const { _id, ...rest } = subject;
    return { ...rest, id: _id };
  });

  return { ...data.data, subjects: mappedSubjects };
};

/**
 * Tạo mới môn học
 */
export const addSubject = async (
  subjectData: Omit<Subject, "id" | "image"> & { image?: string | File }
): Promise<Subject> => {
  const { image, ...rest } = subjectData;
  const isFileUpload = image instanceof File;

  let body: BodyInit;
  const headers = getAuthHeaders(isFileUpload);

  if (isFileUpload) {
    const formData = new FormData();
    Object.entries(rest).forEach(([key, value]) => {
      formData.append(key, String(value));
    });
    formData.append("image", image);
    body = formData;
  } else {
    body = JSON.stringify({ ...rest, image: image || '' });
  }

  const res = await fetch(`${BASE_URL}/create-subject`, {
    method: "POST",
    headers,
    body,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to create subject: ${errorText}`);
  }

  const data = await res.json();
  return data.data;
};

/**
 * Cập nhật thông tin môn học (có thể kèm ảnh)
 */
export const updateSubject = async (
  id: string,
  subjectData: Omit<Subject, "id" | "image"> & { image?: string | File }
): Promise<Subject> => {
  const { image, ...rest } = subjectData;
  const isFileUpload = image instanceof File;

  let body: BodyInit;
  const headers = getAuthHeaders(isFileUpload);

  if (isFileUpload) {
    const formData = new FormData();
    Object.entries(rest).forEach(([key, value]) => {
      formData.append(key, String(value));
    });
    formData.append("image", image);
    body = formData;
  } else {
    // 🔧 Không có ảnh mới → loại bỏ field image
    const bodyObj: any = { ...rest };
    if (image !== undefined && image !== null && image !== "") {
      bodyObj.image = image;
    }
    body = JSON.stringify(bodyObj);
  }

  const res = await fetch(`${BASE_URL}/update-subject/${id}`, {
    method: "PUT",
    headers,
    body,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to update subject: ${errorText}`);
  }

  const data = await res.json();
  return data.data;
};


/**
 * Lấy thông tin chi tiết một môn học bằng ID
 */
export const getSubjectById = async (id: string): Promise<Subject> => {
  const res = await fetch(`${BASE_URL}/get-subjectById/${id}`, { headers: getAuthHeaders() });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch subject with id ${id}: ${errorText}`);
  }
  const data = await res.json();
  return data.data;
};

/**
 * Xóa môn học theo ID
 */
export const deleteSubject = async (id: string): Promise<{ message: string }> => {
  const res = await fetch(`${BASE_URL}/delete-subject/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to delete subject: ${errorText}`);
  }

  const data = await res.json();
  return data; // Trả về thông báo hoặc dữ liệu từ server (thường là { message: "Deleted successfully" })
};
