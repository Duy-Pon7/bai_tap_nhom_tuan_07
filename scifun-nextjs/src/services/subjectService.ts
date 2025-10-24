// src/services/subjectService.ts

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
 * Lấy danh sách môn học (có phân trang)
 */
export const getSubjects = async (page = 1, limit = 10, search = ''): Promise<SubjectAPIResponse> => {
  const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
  const res = await fetch(`${BASE_URL}/get-subjects?page=${page}&limit=${limit}${searchParam}`);
  
  if (!res.ok) throw new Error("Failed to fetch subjects");

  const data = await res.json();
  return data.data || { subjects: [], totalPages: 0, total: 0, page: 1, limit: 10 };
};

/**
 * Tạo mới môn học
 */
export const addSubject = async (subject: Omit<Subject, "id">): Promise<Subject> => {
  const res = await fetch(`${BASE_URL}/create-subject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subject),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to create subject: ${errorText}`);
  }

  const data = await res.json();
  return data.data;
};

/**
 * Cập nhật thông tin môn học
 */
export const updateSubject = async (
  id: string,
  subject: Partial<Omit<Subject, "id">>
): Promise<Subject> => {
  const res = await fetch(`${BASE_URL}/update-subject/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subject),
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
  const res = await fetch(`${BASE_URL}/get-subjectById/${id}`);
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
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to delete subject: ${errorText}`);
  }

  const data = await res.json();
  return data; // Trả về thông báo hoặc dữ liệu từ server (thường là { message: "Deleted successfully" })
};
