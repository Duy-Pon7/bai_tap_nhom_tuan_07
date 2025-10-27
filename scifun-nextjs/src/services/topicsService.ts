// src/services/topicService.ts

import { getToken } from "./authService";

export interface Topic {
  id?: string;
  name: string;
  description: string;
  subject?: string | null; // id hoặc null
}
export interface TopicAPIResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  topics: Topic[];
}

// ✅ Khai báo BASE_URL Ở TRÊN CÙNG
const BASE_URL = "http://localhost:5000/api/v1/topic";

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
 * Lấy danh sách topic (phân trang)
 * Endpoint: GET /api/v1/topic/get-topics?page=1&limit=10&searchName=...
 */
export const getTopics = async (
  page = 1,
  limit = 10,
  topicId?: string,
  searchName = ''
): Promise<TopicAPIResponse> => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (topicId) params.append('topicId', topicId);
  if (searchName) params.append('searchName', searchName);

  const res = await fetch(`${BASE_URL}/get-topics?${params.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch topics: ${errorText}`);
  }

  const json = await res.json();
  if (!json.data || !json.data.topics) {
    // Handle cases where data or topics array might be missing
    return { topics: [], totalPages: 0, total: 0, page: page, limit: limit };
  }

  // Map _id from backend to id on frontend for each topic
  const mappedTopics = json.data.topics.map((topic: any) => {
    const { _id, ...rest } = topic;
    return { ...rest, id: _id };
  });

  // Return the full response with mapped subjects
  return { ...json.data, topics: mappedTopics };
};

/**
 * Lấy chi tiết topic theo ID
 */
export const getTopicById = async (id: string): Promise<Topic> => {
  const res = await fetch(`${BASE_URL}/get-topicById/${id}`, {
    headers: getAuthHeaders(),
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch topic with id ${id}: ${errorText}`);
  }

  const data = await res.json();

  // Đảm bảo dữ liệu trả về phù hợp với interface Topic
  const topicData = data.data;

  return {
    id: topicData._id,
    name: topicData.name,
    description: topicData.description,
    subject: topicData.subject || null,
  };
};

/**
 * Tạo mới topic
 * Endpoint: POST /api/v1/topic/create-topic
 */
/**
 * Tạo mới topic
 * Endpoint: POST /api/v1/topic/create-topic
 */
export const addTopic = async (topic: {
  name: string;
  description: string;
  subject: string;
}): Promise<Topic> => {
  const res = await fetch(`${BASE_URL}/create-topic`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(topic),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to create topic: ${errorText}`);
  }

  const data = await res.json();

  // ✅ Chuẩn hóa dữ liệu trả về
  const createdTopic = data.data;
  return {
    id: createdTopic._id,                  // ánh xạ từ _id
    name: createdTopic.name,
    description: createdTopic.description,
    subject: createdTopic.subject ?? null, // có thể là null
  };
};

/**
 * Cập nhật topic
 * Endpoint: PUT /api/v1/topic/update-topic/:id
 */
export const updateTopic = async (
  id: string,
  topic: Partial<Omit<Topic, "id">>
): Promise<Topic> => {
  const res = await fetch(`${BASE_URL}/update-topic/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(topic),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to update topic: ${errorText}`);
  }

  const data = await res.json();
  const updatedTopic = data.data;
  // Chuẩn hóa dữ liệu trả về để khớp với interface Topic của frontend
  return {
    id: updatedTopic._id,
    name: updatedTopic.name,
    description: updatedTopic.description,
    subject: updatedTopic.subject ?? null,
  };
};

/**
 * Xóa topic theo ID
 * Endpoint: DELETE /api/v1/topic/delete-topic/:id
 */
export const deleteTopic = async (id: string): Promise<{ message: string }> => {
  const res = await fetch(`${BASE_URL}/delete-topic/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to delete topic: ${errorText}`);
  }

  const data = await res.json();

  // ✅ Xử lý linh hoạt, tránh lỗi khi backend thay đổi format
  return {
    message: data?.message || "Xóa chủ đề thành công",
  };
};
