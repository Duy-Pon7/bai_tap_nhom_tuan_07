// src/services/questionService.ts

import { getToken } from "./authService";

export interface QuestionOption {
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  quiz: string; // ID of the quiz this question belongs to
  content: string;
  image?: string | null;
  options: QuestionOption[];
  explanation?: string | null;
  type: "single-choice" | "multiple-choice";
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface QuestionAPIResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  questions: Question[];
}

const BASE_URL = "http://localhost:5000/api/v1/question";

/**
 * Helper to get headers with token.
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
 * Fetch a list of questions for a specific quiz (paginated).
 * Endpoint: GET /api/v1/question/get-questions?page=...&limit=...&quizId=...
 */
export const getQuestions = async (
  page = 1,
  limit = 10,
  quizId?: string
): Promise<QuestionAPIResponse> => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (quizId) params.append("quizId", quizId);

  const res = await fetch(`${BASE_URL}/get-questions?${params.toString()}`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch questions: ${errorText}`);
  }

  const json = await res.json();

  // The API returns questions in `json.data.data` and uses different field names.
  // We need to map them to match the frontend `Question` interface.
  const mappedQuestions = (json.data.data || []).map((question: any) => {
    const { _id, text, answers, ...rest } = question;

    // Map the `answers` array to the `options` array, removing the `_id` from each option.
    const mappedOptions = (answers || []).map((option: any) => ({
      text: option.text,
      isCorrect: option.isCorrect,
    }));

    return {
      ...rest,
      id: _id,
      content: text, // Map `text` from API to `content`
      options: mappedOptions, // Use the mapped options
    };
  });

  return {
    ...json.data,
    questions: mappedQuestions, // The key in the response should be `questions`
  };
};

/**
 * Fetch a single question by its ID.
 * Endpoint: GET /api/v1/question/get-questionById/:id
 */
export const getQuestionById = async (id: string): Promise<Question> => {
  const res = await fetch(`${BASE_URL}/get-questionById/${id}`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch question with id ${id}: ${errorText}`);
  }

  const json = await res.json();
  const { _id, ...rest } = json.data;
  return { id: _id, ...rest };
};

/**
 * Create a new question.
 * Endpoint: POST /api/v1/question/create-question
 */
export const addQuestion = async (
  question: Omit<Question, "id" | "createdAt" | "updatedAt">
): Promise<Question> => {
  // Map frontend Question fields to backend API fields
  const { content, options, ...restOfQuestion } = question;
  const payload = {
    ...restOfQuestion,
    text: content, // Map `content` to `text`
    answers: options, // Map `options` to `answers`
  };

  const res = await fetch(`${BASE_URL}/create-question`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to create question: ${errorText}`);
  }
  
  const json = await res.json();
  const createdQuestion = json.data;

  // Map the response back to the frontend Question interface
  const { _id, text, answers, ...rest } = createdQuestion;
  return {
    ...rest,
    id: _id,
    content: text,
    options: answers.map(({ _id, ...opt }: any) => opt), // Remove _id from options
    quiz: question.quiz, // The response from create has quiz: null, so we use the one we sent.
  };
};

/**
 * Update an existing question.
 * Endpoint: PUT /api/v1/question/update-question/:id
 */
export const updateQuestion = async (
  id: string,
  question: Partial<Omit<Question, "id">>
): Promise<Question> => {
  const res = await fetch(`${BASE_URL}/update-question/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(question),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to update question: ${errorText}`);
  }

  const json = await res.json();
  const { _id, ...rest } = json.data;
  return { id: _id, ...rest };
};

/**
 * Delete a question by its ID.
 * Endpoint: DELETE /api/v1/question/delete-question/:id
 */
export const deleteQuestion = async (
  id: string
): Promise<{ message: string; question: Question }> => {
  const res = await fetch(`${BASE_URL}/delete-question/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to delete question: ${errorText}`);
  }

  const json = await res.json();
  const deletedQuestion = json.data.question;

  // Map _id to id for consistency
  const { _id, ...rest } = deletedQuestion;

  return {
    message: json.message || "Xóa câu hỏi thành công",
    question: { id: _id, ...rest },
  };
};