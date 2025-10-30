import { getToken } from "./authService";
import { Topic } from "./topicsService";

export interface VideoLesson {
  id: string;
  title: string;
  url: string;
  duration: number;
  topic: string | Topic | null; // Can be just an ID, a populated Topic object, or null
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface VideoLessonAPIResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  data: VideoLesson[];
}

const BASE_URL = "http://localhost:5000/api/v1/video-lesson";

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
 * Lấy danh sách video (phân trang, lọc)
 * Endpoint: GET /api/v1/video-lesson/get-video-lessons?page=1&limit=10&topicId=...
 */
export const getVideoLessons = async (
  page = 1,
  limit = 10,
  topicId?: string
): Promise<VideoLessonAPIResponse> => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (topicId) params.append("topicId", topicId);

  const res = await fetch(`${BASE_URL}/list?${params.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch video lessons: ${errorText}`);
  }

  const json = await res.json();
  // Map _id from backend to id on frontend for each video
  const mappedVideos = json.data.data.map((video: any) => {
    const { _id, ...rest } = video;
    return {
      ...rest,
      id: _id,
      topic: rest.topic ?? null, // Ensure topic is null if not provided
    };
  });

  return {
    ...json.data,
    data: mappedVideos,
  };
};

/**
 * Lấy chi tiết video theo ID
 * Endpoint: GET /api/v1/video-lesson/get-video-lesson-by-id/:id
 */
export const getVideoLessonById = async (id: string): Promise<VideoLesson> => {
  const res = await fetch(`${BASE_URL}/get-video-lesson-by-id/${id}`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch video with id ${id}: ${errorText}`);
  }

  const json = await res.json();
  const videoData = json.data;

  return {
    id: videoData._id,
    title: videoData.title,
    url: videoData.url,
    duration: videoData.duration,
    topic: videoData.topic ?? null,
    createdAt: videoData.createdAt,
    updatedAt: videoData.updatedAt,
  };
};
/**
 * Tạo mới video
 * Endpoint: POST /api/v1/video-lesson/create
 */
export const addVideoLesson = async (video: {
  title: string;
  url: string;
  duration: number;
  topic: string;
}): Promise<VideoLesson> => {
  const res = await fetch(`${BASE_URL}/create`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(video),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to create video: ${errorText}`);
  }

  const json = await res.json();
  const createdVideo = json.data;

  // Chuẩn hóa topic trả về từ backend
  let normalizedTopic: string | Topic | null = null;
  if (createdVideo.topic) {
    if (typeof createdVideo.topic === "object" && createdVideo.topic._id) {
      const { _id, ...restOfTopic } = createdVideo.topic;
      normalizedTopic = { id: _id, ...restOfTopic };
    } else {
      normalizedTopic = createdVideo.topic;
    }
  }

  // Explicitly map properties from the backend response to the frontend Quiz interface
  // to ensure consistency and handle potential _id to id conversion.
  return {
    id: createdVideo._id,
    title: createdVideo.title,
    url: createdVideo.url,
    duration: createdVideo.duration,
    topic: normalizedTopic,
    createdAt: createdVideo.createdAt,
    updatedAt: createdVideo.updatedAt,
  };
};

/**
 * Cập nhật video
 * Endpoint: PUT /api/v1/video-lesson/update-video-lesson/:id
 */
export const updateVideoLesson = async (
  id: string,
  video: Partial<Omit<VideoLesson, "id">>
): Promise<VideoLesson> => {
  const res = await fetch(`${BASE_URL}/update/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(video),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to update video: ${errorText}`);
  }

  const json = await res.json();
  const updatedVideo = json.data;

  return {
    id: updatedVideo._id,
    title: updatedVideo.title,
    url: updatedVideo.url,
    duration: updatedVideo.duration,
    topic: updatedVideo.topic ?? null,
    createdAt: updatedVideo.createdAt,
    updatedAt: updatedVideo.updatedAt,
  };
};

/**
 * Xóa video theo ID
 * Endpoint: DELETE /api/v1/video-lesson/delete/:id
 */
export const deleteVideoLesson = async (
  id: string
): Promise<{ message: string; videoLesson: VideoLesson }> => {
  const res = await fetch(`${BASE_URL}/delete/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to delete video: ${errorText}`);
  }

  const json = await res.json();
  const { _id, ...rest } = json.data;
  return { message: json.message, videoLesson: { id: _id, ...rest } };
};
