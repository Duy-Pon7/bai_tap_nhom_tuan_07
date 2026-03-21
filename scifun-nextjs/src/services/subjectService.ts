import { getToken } from "./authService";

export interface Subject {
  id?: string;
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

type ApiEnvelope<T> = {
  status?: number;
  message?: string;
  data?: T;
};
type SubjectBackend = Subject & { _id?: string };

const BASE_URL = "https://java-app-9trd.onrender.com/api/v1/subject";

const getAuthHeaders = (isFormData = false, requireAuth = false): HeadersInit => {
  const token = getToken();
  const headers: HeadersInit = {};

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (requireAuth && !token) {
    throw new Error("Phien dang nhap da het han. Vui long dang nhap lai.");
  }

  return headers;
};

const parseApiResponse = async <T>(
  res: Response,
  fallbackMessage: string
): Promise<ApiEnvelope<T>> => {
  const raw = await res.text();
  let payload: ApiEnvelope<T> | null = null;

  if (raw) {
    try {
      payload = JSON.parse(raw) as ApiEnvelope<T>;
    } catch {
      payload = null;
    }
  }

  const statusLabel = payload?.status
    ? `[HTTP ${res.status} | API ${payload.status}]`
    : `[HTTP ${res.status}]`;

  if (!res.ok) {
    throw new Error(`${statusLabel} ${payload?.message || raw || fallbackMessage}`);
  }

  // Some backend endpoints return HTTP 200 but business status >= 400.
  if (payload && typeof payload.status === "number" && payload.status >= 400) {
    throw new Error(`${statusLabel} ${payload.message || fallbackMessage}`);
  }

  if (!payload) {
    throw new Error(fallbackMessage);
  }

  return payload;
};

const isAuthOrPermissionError = (message: string): boolean => {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("token") ||
    normalized.includes("forbidden") ||
    normalized.includes("unauthorized") ||
    normalized.includes("khong co quyen") ||
    normalized.includes("không có quyền") ||
    normalized.includes("dang nhap") ||
    normalized.includes("đăng nhập") ||
    normalized.includes("http 401") ||
    normalized.includes("http 403") ||
    normalized.includes("api 401") ||
    normalized.includes("api 403")
  );
};

const shouldRetryWithoutImage = (errorMessage: string): boolean => {
  const normalized = errorMessage.toLowerCase();
  if (!normalized || isAuthOrPermissionError(normalized)) {
    return false;
  }

  return (
    normalized.includes("image") ||
    normalized.includes("multipart") ||
    normalized.includes("form-data") ||
    normalized.includes("cloudinary") ||
    normalized.includes("payload") ||
    normalized.includes("file") ||
    normalized.includes("http 413") ||
    normalized.includes("http 415") ||
    normalized.includes("api 413") ||
    normalized.includes("api 415") ||
    normalized.includes("unsupported media")
  );
};

export const getSubjects = async (
  page = 1,
  limit = 10,
  search = ""
): Promise<SubjectAPIResponse> => {
  const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";
  const res = await fetch(
    `${BASE_URL}/get-subjects?page=${page}&limit=${limit}${searchParam}`,
    { headers: getAuthHeaders() }
  );

  const payload = await parseApiResponse<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    subjects: SubjectBackend[];
  }>(res, "Failed to fetch subjects");

  if (!payload.data) {
    return { subjects: [], totalPages: 0, total: 0, page: 1, limit: 10 };
  }

  const mappedSubjects = payload.data.subjects.map((subject) => {
    const { _id, ...rest } = subject;
    return { ...rest, id: _id };
  });

  return { ...payload.data, subjects: mappedSubjects };
};

export const addSubject = async (
  subjectData: Omit<Subject, "id" | "image"> & { image?: string | File }
): Promise<Subject> => {
  const { image, ...rest } = subjectData;
  const isFileUpload = image instanceof File;

  let body: BodyInit;
  const headers = getAuthHeaders(isFileUpload, true);

  if (isFileUpload) {
    const formData = new FormData();
    Object.entries(rest).forEach(([key, value]) => {
      formData.append(key, String(value));
    });
    formData.append("image", image);
    body = formData;
  } else {
    body = JSON.stringify({ ...rest, image: image || "" });
  }

  try {
    const res = await fetch(`${BASE_URL}/create-subject`, {
      method: "POST",
      headers,
      body,
    });

    const payload = await parseApiResponse<Subject>(res, "Khong the tao mon hoc.");
    if (!payload.data) {
      throw new Error(payload.message || "Khong nhan duoc du lieu mon hoc vua tao.");
    }

    return payload.data;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "";

    // Fallback: if image upload fails due multipart/file handling, retry without image.
    if (isFileUpload && shouldRetryWithoutImage(errorMessage)) {
      const fallbackBody = JSON.stringify({ ...rest, image: "" });
      const fallbackRes = await fetch(`${BASE_URL}/create-subject`, {
        method: "POST",
        headers: getAuthHeaders(false, true),
        body: fallbackBody,
      });

      const fallbackPayload = await parseApiResponse<Subject>(
        fallbackRes,
        "Khong the tao mon hoc (fallback khong anh)."
      );
      if (!fallbackPayload.data) {
        throw new Error(
          fallbackPayload.message || "Khong nhan duoc du lieu mon hoc vua tao."
        );
      }

      return fallbackPayload.data;
    }

    throw error;
  }
};

export const updateSubject = async (
  id: string,
  subjectData: Omit<Subject, "id" | "image"> & { image?: string | File }
): Promise<Subject> => {
  const { image, ...rest } = subjectData;
  const isFileUpload = image instanceof File;

  let body: BodyInit;
  const headers = getAuthHeaders(isFileUpload, true);

  if (isFileUpload) {
    const formData = new FormData();
    Object.entries(rest).forEach(([key, value]) => {
      formData.append(key, String(value));
    });
    formData.append("image", image);
    body = formData;
  } else {
    const bodyObj: Record<string, unknown> = { ...rest };
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

  const payload = await parseApiResponse<Subject>(res, "Khong the cap nhat mon hoc.");
  if (!payload.data) {
    throw new Error(payload.message || "Khong nhan duoc du lieu mon hoc sau khi cap nhat.");
  }

  return payload.data;
};

export const getSubjectById = async (id: string): Promise<Subject> => {
  const res = await fetch(`${BASE_URL}/get-subjectById/${id}`, {
    headers: getAuthHeaders(false, true),
  });

  const payload = await parseApiResponse<Subject>(
    res,
    `Khong the lay thong tin mon hoc co id ${id}.`
  );

  if (!payload.data) {
    throw new Error(payload.message || `Khong tim thay mon hoc co id ${id}.`);
  }

  return payload.data;
};

export const deleteSubject = async (id: string): Promise<{ message: string }> => {
  const res = await fetch(`${BASE_URL}/delete-subject/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(false, true),
  });

  const payload = await parseApiResponse<{ message?: string }>(
    res,
    "Khong the xoa mon hoc."
  );

  return {
    message: payload.message || payload.data?.message || "Xoa mon hoc thanh cong.",
  };
};

