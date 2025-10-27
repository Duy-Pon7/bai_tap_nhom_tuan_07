// src/services/quizzService.ts

import { getToken } from "./authService";
import { Topic } from "./topicsService";

export interface Quiz {
  id: string;
  title: string;
  description?: string | null; // description can be null
  topic: string | Topic | null; // Can be just an ID, a populated Topic object, or null
  uniqueUserCount: number;
  duration: number; // Added duration field
  lastAttemptAt?: Date | string | null;
  favoriteCount: number;
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

const BASE_URL = "http://localhost:5000/api/v1/quiz";

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
  const mappedQuizzes = json.data.quizzes.map((quiz: any) => {
    const { _id, ...rest } = quiz;
    return {
      ...rest,
      id: _id,
      topic: rest.topic ?? null, // Ensure topic is null if not provided
      description: rest.description ?? null, // Ensure description is null if not provided
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
    topic: quizData.topic ?? null, // Handle null topic
    uniqueUserCount: quizData.uniqueUserCount,
    duration: quizData.duration, // Map duration
    lastAttemptAt: quizData.lastAttemptAt,
    favoriteCount: quizData.favoriteCount,
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
    uniqueUserCount: createdQuiz.uniqueUserCount,
    duration: createdQuiz.duration, // Map duration
    lastAttemptAt: createdQuiz.lastAttemptAt ?? null, // Ensure null if not provided
    favoriteCount: createdQuiz.favoriteCount,
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
    topic: updatedQuiz.topic ?? null,
    uniqueUserCount: updatedQuiz.uniqueUserCount,
    duration: updatedQuiz.duration, // Map duration
    lastAttemptAt: updatedQuiz.lastAttemptAt,
    favoriteCount: updatedQuiz.favoriteCount,
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
      topic: deletedQuiz.topic ?? null,
      uniqueUserCount: deletedQuiz.uniqueUserCount,
      duration: deletedQuiz.duration, // Map duration
      lastAttemptAt: deletedQuiz.lastAttemptAt ? new Date(deletedQuiz.lastAttemptAt) : null,
      favoriteCount: deletedQuiz.favoriteCount,
      createdAt: deletedQuiz.createdAt ? new Date(deletedQuiz.createdAt) : undefined,
      updatedAt: deletedQuiz.updatedAt ? new Date(deletedQuiz.updatedAt) : undefined,
    },
  };
};
