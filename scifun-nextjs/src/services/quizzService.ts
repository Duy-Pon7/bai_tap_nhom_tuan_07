// src/services/quizzService.ts

import { getToken } from "./authService";
import { Topic } from "./topicsService";

export interface Quiz {
  id: string;
  title: string;
  description?: string | null; // description can be null
  topic: string | Topic | null; // Can be just an ID, a populated Topic object, or null
  questionCount: number;
  uniqueUserCount: number;
  duration: number; // Added duration field
  lastAttemptAt?: Date | string | null;
  favoriteCount: number;
  accessTier: "PRO" | "FREE";
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface QuizAPIResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  quizzes: Quiz[];
}

const BASE_URL = "https://java-app-9trd.onrender.com/api/v1/quiz";

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

const normalizeAccessTier = (accessTier: unknown): "PRO" | "FREE" => {
  return accessTier === "PRO" ? "PRO" : "FREE";
};

const normalizeTopic = (topic: unknown): string | Topic | null => {
  if (!topic) return null;
  if (typeof topic === "string") return topic;
  if (typeof topic === "object") {
    const topicObject = topic as Record<string, unknown>;
    const topicId = topicObject._id;
    if (typeof topicId === "string") {
      return { ...topicObject, id: topicId } as unknown as Topic;
    }
    return topicObject as unknown as Topic;
  }
  return null;
};

/**
 * Lấy danh sách quiz (phân trang, lọc, tìm kiếm)
 * Endpoint: GET /api/v1/quiz/get-quizzes?page=1&limit=10&topicId=...&search=...
 */
export const getQuizzes = async (
  page = 1,
  limit = 10,
  topicId?: string,
  search = ''
): Promise<QuizAPIResponse> => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (topicId) params.append('topicId', topicId);
  if (search) params.append('search', search);

  const res = await fetch(`${BASE_URL}/get-quizzes?${params.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch quizzes: ${errorText}`);
  }

  const json = await res.json();
  // Map _id from backend to id on frontend for each quiz
  const quizzes = Array.isArray(json?.data?.quizzes) ? json.data.quizzes : [];
  const mappedQuizzes = quizzes.map((quiz: any) => {
    const { _id, ...rest } = quiz;
    return {
      ...rest,
      id: _id,
      accessTier: normalizeAccessTier(rest.accessTier),
      topic: normalizeTopic(rest.topic),
      description: rest.description ?? null, // Ensure description is null if not provided
      questionCount: Number(rest.questionCount ?? 0),
      uniqueUserCount: Number(rest.uniqueUserCount ?? 0),
      favoriteCount: Number(rest.favoriteCount ?? 0),
      duration: Number(rest.duration ?? 0),
    };
  });

  return {
    ...json.data,
    quizzes: mappedQuizzes,
  };
};

// /**
//  * Lấy chi tiết quiz theo ID
//  * Endpoint: GET /api/v1/quiz/get-quizById/:id
//  */
export const getQuizById = async (id: string): Promise<Quiz> => {
  const res = await fetch(`${BASE_URL}/get-quizById/${id}`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch quiz with id ${id}: ${errorText}`);
  }

  const json = await res.json();
  const quizData = json.data;

  return {
    id: quizData._id,
    title: quizData.title,
    description: quizData.description ?? null,
    topic: normalizeTopic(quizData.topic),
    questionCount: Number(quizData.questionCount ?? 0),
    uniqueUserCount: Number(quizData.uniqueUserCount ?? 0),
    duration: Number(quizData.duration ?? 0),
    lastAttemptAt: quizData.lastAttemptAt,
    accessTier: normalizeAccessTier(quizData.accessTier),
    favoriteCount: Number(quizData.favoriteCount ?? 0),
    createdAt: quizData.createdAt,
    updatedAt: quizData.updatedAt
  };
};
/**
 * Tạo mới quiz
 * Endpoint: POST /api/v1/quiz/create-quiz
 */
export const addQuiz = async (quiz: {
  title: string;
  description: string;
  duration: number; // Added duration to input type
  topic: string;
  accessTier?: "PRO" | "FREE";
}): Promise<Quiz> => {
  const res = await fetch(`${BASE_URL}/create-quiz`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(quiz),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to create quiz: ${errorText}`);
  }

  const json = await res.json();
  const createdQuiz = json.data;

  // Chuẩn hóa topic trả về từ backend
  let normalizedTopic: string | Topic | null = null;
  if (createdQuiz.topic) {
    if (typeof createdQuiz.topic === 'object' && createdQuiz.topic._id) {
      const { _id, ...restOfTopic } = createdQuiz.topic;
      normalizedTopic = { id: _id, ...restOfTopic };
    } else {
      normalizedTopic = createdQuiz.topic; // Giữ nguyên nếu nó là string (ID)
    }
  }

  // Explicitly map properties from the backend response to the frontend Quiz interface
  // to ensure consistency and handle potential _id to id conversion.
  return {
    id: createdQuiz._id,
    title: createdQuiz.title,
    description: createdQuiz.description ?? null,
    topic: normalizedTopic,
    questionCount: Number(createdQuiz.questionCount ?? 0),
    uniqueUserCount: Number(createdQuiz.uniqueUserCount ?? 0),
    duration: Number(createdQuiz.duration ?? 0),
    lastAttemptAt: createdQuiz.lastAttemptAt ?? null, // Ensure null if not provided
    accessTier: normalizeAccessTier(createdQuiz.accessTier),
    favoriteCount: Number(createdQuiz.favoriteCount ?? 0),
    createdAt: createdQuiz.createdAt,
    updatedAt: createdQuiz.updatedAt,
  };
};

/**
 * Cập nhật quiz
 * Endpoint: PUT /api/v1/quiz/update-quiz/:id
 */
export const updateQuiz = async (
  id: string,
  quiz: Partial<Omit<Quiz, "id">>
): Promise<Quiz> => {
  const res = await fetch(`${BASE_URL}/update-quiz/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(quiz),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to update quiz: ${errorText}`);
  }

  const json = await res.json();
  const updatedQuiz = json.data;
  // Chuẩn hóa dữ liệu trả về để khớp với interface Quiz của frontend
  return {
    id: updatedQuiz._id,
    title: updatedQuiz.title,
    description: updatedQuiz.description ?? null,
    topic: normalizeTopic(updatedQuiz.topic),
    questionCount: Number(updatedQuiz.questionCount ?? 0),
    uniqueUserCount: Number(updatedQuiz.uniqueUserCount ?? 0),
    duration: Number(updatedQuiz.duration ?? 0),
    lastAttemptAt: updatedQuiz.lastAttemptAt,
    accessTier: normalizeAccessTier(updatedQuiz.accessTier),
    favoriteCount: Number(updatedQuiz.favoriteCount ?? 0),
    createdAt: updatedQuiz.createdAt,
    updatedAt: updatedQuiz.updatedAt,
  };
};

/**
 * Xóa quiz theo ID
 * Endpoint: DELETE /api/v1/quiz/delete-quiz/:id
 */
export const deleteQuiz = async (
  id: string
): Promise<{ message: string; quiz: Quiz }> => {
  const res = await fetch(`${BASE_URL}/delete-quiz/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to delete quiz: ${errorText}`);
  }

  const json = await res.json();
  const deletedQuiz = json.data.quiz;

  return {
    message: json.data.message || "Xóa quiz thành công",
    quiz: {
      id: deletedQuiz._id,
      title: deletedQuiz.title,
      description: deletedQuiz.description ?? null,
      topic: normalizeTopic(deletedQuiz.topic),
      questionCount: Number(deletedQuiz.questionCount ?? 0),
      uniqueUserCount: Number(deletedQuiz.uniqueUserCount ?? 0),
      duration: Number(deletedQuiz.duration ?? 0),
      accessTier: normalizeAccessTier(deletedQuiz.accessTier),
      lastAttemptAt: deletedQuiz.lastAttemptAt ? new Date(deletedQuiz.lastAttemptAt) : null,
      favoriteCount: Number(deletedQuiz.favoriteCount ?? 0),
      createdAt: deletedQuiz.createdAt ? new Date(deletedQuiz.createdAt) : undefined,
      updatedAt: deletedQuiz.updatedAt ? new Date(deletedQuiz.updatedAt) : undefined,
    },
  };
};
