"use client";

import React, { useState, useEffect } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import { getTopics } from "@/services/topicsService";
import { addQuiz } from "@/services/quizzService";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function CreateQuizPage() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    topic: "",
    duration: 0,
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    title: "",
    description: "",
    topic: "",
    duration: "",
  });

  const [topics, setTopics] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const response = await getTopics();
        const topicOptions = response.topics.map((topic: any) => ({
          id: topic.id!,
          name: topic.name,
        }));
        setTopics(topicOptions);
      } catch (error) {
        console.error("Error fetching topics:", error);
        toast.error("❌ Lỗi khi tải danh sách chủ đề!");
      }
    };

    fetchTopics();
  }, []);

  const handleChange = (
    field: keyof typeof formData,
    value: string | number
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field in errors) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async () => {
    const newErrors = {
      title: formData.title ? "" : "Tiêu đề quiz là bắt buộc.",
      description: formData.description ? "" : "Mô tả là bắt buộc.",
      topic: formData.topic ? "" : "Chủ đề là bắt buộc.",
      duration:
        formData.duration > 0 ? "" : "Thời lượng phải là một số dương.",
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some((err) => err)) {
      toast.warn("⚠️ Vui lòng điền đầy đủ thông tin!");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        duration: Number(formData.duration),
        topic: formData.topic,
      };

      const created = await addQuiz(payload);

      toast.success(`✅ Đã tạo thành công quiz: ${created.title}`);
      
      // Reset form sau 0.5s
      setTimeout(() => {
        setFormData({ title: "", description: "", topic: "", duration: 0 });
      }, 500);
    } catch (error: any) {
      console.error("[handleSubmit] Error creating quiz:", error);
      toast.error("❌ Tạo quiz thất bại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Toast góc phải */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        pauseOnHover
        closeOnClick
        draggable
        style={{ zIndex: 999999 }}
      />

      <PageBreadcrumb pageTitle="Tạo Quiz" />

      <div className="max-w-3xl mx-auto mt-6 space-y-6">
        {/* Topic Dropdown */}
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
          {errors.topic && <p className="text-sm text-red-600 mt-1">{errors.topic}</p>}
        </div>

        {/* Tiêu đề Quiz */}
        <div>
          <h3 className="text-lg font-semibold mb-2">
            Tiêu đề Quiz <span className="text-red-500">*</span>
          </h3>
          <Input
            type="text"
            value={formData.title}
            placeholder="Nhập tiêu đề quiz"
            maxLength={100}
            onChange={(e) => handleChange("title", e.target.value)}
            error={!!errors.title}
            hint={errors.title}
          />
        </div>

        {/* Mô tả */}
        <div>
          <h3 className="text-lg font-semibold mb-2">
            Mô tả <span className="text-red-500">*</span>
          </h3>
          <TextArea
            rows={6}
            placeholder="Nhập mô tả về quiz"
            value={formData.description}
            onChange={(value: string) => handleChange("description", value)}
            error={!!errors.description}
            hint={errors.description}
          />
        </div>

        {/* Thời lượng */}
        <div>
          <h3 className="text-lg font-semibold mb-2">
            Thời lượng (phút) <span className="text-red-500">*</span>
          </h3>
          <Input
            type="number"
            value={formData.duration}
            placeholder="Nhập thời lượng quiz (phút)"
            min={1}
            onChange={(e) =>
              handleChange("duration", parseInt(e.target.value, 10) || 0)
            }
            error={!!errors.duration}
            hint={errors.duration}
          />
        </div>

        {/* Nút tạo */}
        <div className="pt-4 text-center">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2 mx-auto"
          >
            {loading && (
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                ></path>
              </svg>
            )}
            {loading ? "Đang tạo..." : "Tạo Quiz"}
          </button>
        </div>
      </div>
    </div>
  );
}
