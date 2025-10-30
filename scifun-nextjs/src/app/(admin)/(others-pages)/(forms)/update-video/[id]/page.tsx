"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Input from "@/components/form/input/InputField";
import { getTopics, Topic } from "@/services/topicsService";
import {
  getVideoLessonById,
  updateVideoLesson,
  deleteVideoLesson,
} from "@/services/videosService";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function UpdateVideoPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [formData, setFormData] = useState({
    title: "",
    url: "",
    duration: 0,
    topic: "",
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    title: "",
    url: "",
    duration: "",
    topic: "",
  });

  const [topics, setTopics] = useState<Topic[]>([]);

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const response = await getTopics(1, 1000); // Fetch all topics for dropdown
        setTopics(response.topics);
      } catch (error) {
        console.error("Error fetching topics:", error);
        toast.error("❌ Lỗi khi tải danh sách chủ đề!");
      }
    };

    fetchTopics();
  }, []);

  useEffect(() => {
    if (!id) return;

    const fetchVideo = async () => {
      try {
        setLoading(true);
        const video = await getVideoLessonById(id);
        setFormData({
          title: video.title ?? "",
          url: video.url ?? "",
          duration: video.duration ?? 0,
          topic:
            typeof video.topic === "object" && video.topic !== null
              ? (video.topic as Topic).id || ""
              : typeof video.topic === "string"
              ? video.topic
              : "",
        });
      } catch (error) {
        console.error("Error fetching video:", error);
        toast.error("❌ Không thể tải dữ liệu video.");
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();
  }, [id]);

  const handleChange = (
    field: keyof typeof formData,
    value: string | number
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field in errors) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleDelete = async () => {
    if (!id) return;

    const confirmDelete = window.confirm(
      "⚠️ Bạn có chắc chắn muốn xóa video này không?"
    );
    if (!confirmDelete) return;

    try {
      setLoading(true);
      const res = await deleteVideoLesson(id);
      toast.success(`🗑️ ${res.message}`);
      setTimeout(() => router.push("/videos"), 1000); // Redirect after delete
    } catch (error: any) {
      console.error("[handleDelete] Error:", error);
      toast.error(`❌ Xóa video thất bại! Lỗi: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    const newErrors = {
      title: formData.title ? "" : "Tiêu đề video là bắt buộc.",
      url: formData.url ? "" : "URL video là bắt buộc.",
      duration: formData.duration > 0 ? "" : "Thời lượng phải lớn hơn 0.",
      topic: formData.topic ? "" : "Chủ đề là bắt buộc.",
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some((err) => err)) {
      toast.warn("⚠️ Vui lòng điền đầy đủ và chính xác thông tin!");
      return;
    }

    setLoading(true);
    try {
      if (id) {
        const updatedVideo = await updateVideoLesson(id, formData);
        toast.success(`✅ Cập nhật thành công video: ${updatedVideo.title}`);
      }
    } catch (error: any) {
      console.error("[handleSubmit] Error:", error);
      toast.error(`❌ Thao tác thất bại! Lỗi: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        style={{ zIndex: 999999 }}
      />
      <PageBreadcrumb pageTitle="Cập nhật Video Bài Giảng" />
      <div className="max-w-3xl mx-auto mt-6 space-y-6">
        {/* Tiêu đề video */}
        <div>
          <h3 className="text-lg font-semibold mb-2">
            Tiêu đề Video <span className="text-red-500">*</span>
          </h3>
          <Input
            type="text"
            value={formData.title}
            placeholder="Nhập tiêu đề cho video"
            maxLength={150}
            onChange={(e) => handleChange("title", e.target.value)}
            error={!!errors.title}
            hint={errors.title}
          />
        </div>

        {/* URL Video */}
        <div>
          <h3 className="text-lg font-semibold mb-2">
            URL Video <span className="text-red-500">*</span>
          </h3>
          <Input
            type="text"
            value={formData.url}
            placeholder="Dán URL của video (ví dụ: YouTube)"
            onChange={(e) => handleChange("url", e.target.value)}
            error={!!errors.url}
            hint={errors.url}
          />
        </div>

        {/* Thời lượng */}
        <div>
          <h3 className="text-lg font-semibold mb-2">
            Thời lượng (giây) <span className="text-red-500">*</span>
          </h3>
          <Input
            type="number"
            value={String(formData.duration)}
            placeholder="Nhập thời lượng video tính bằng giây"
            onChange={(e) =>
              handleChange("duration", parseInt(e.target.value) || 0)
            }
            error={!!errors.duration}
            hint={errors.duration}
          />
        </div>

        {/* Chọn chủ đề */}
        <div>
          <h3 className="text-lg font-semibold mb-2">
            Chủ đề <span className="text-red-500">*</span>
          </h3>
          <div className="relative">
            <select
              value={formData.topic}
              onChange={(e) => handleChange("topic", e.target.value)}
              className={`w-full appearance-none border rounded-lg px-3 py-2 bg-white dark:bg-dark-900 ${
                errors.topic ? "border-red-500" : "border-gray-300"
              }`}
            >
              <option value="">-- Chọn chủ đề --</option>
              {topics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.name}
                </option>
              ))}
            </select>
            <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
          </div>
          {errors.topic && (
            <p className="text-sm text-red-600 mt-1">{errors.topic}</p>
          )}
        </div>

        <div className="pt-4 flex justify-center gap-4">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "Đang cập nhật..." : "Cập nhật Video"}
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
          >
            {loading ? "Đang xóa..." : "Xóa Video"}
          </button>
        </div>
      </div>
    </div>
  );
}