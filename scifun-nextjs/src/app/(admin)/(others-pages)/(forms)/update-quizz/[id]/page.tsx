"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import { getQuizById, updateQuiz, deleteQuiz, Quiz } from "@/services/quizzService";
import { getTopics, Topic } from "@/services/topicsService";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function UpdateQuizPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string | undefined;

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    topic: "",
    duration: 0,
    accessTier: "FREE" as "PRO" | "FREE",
  });

  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [errors, setErrors] = useState({
    title: "",
    description: "",
    topic: "",
    duration: "",
  });

  const [topics, setTopics] = useState<Topic[]>([]);

  // Fetch all topics for dropdown
  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const response = await getTopics(1, 1000); // Adjust limit if needed
        setTopics(response.topics);
      } catch (error) {
        console.error("Error fetching topics:", error);
        toast.error("❌ Lỗi khi tải danh sách chủ đề!");
      }
    };
    fetchTopics();
  }, []);

  // Fetch quiz data if ID exists (edit mode)
  useEffect(() => {
    if (!id) return;

    const fetchQuiz = async () => {
      try {
        setLoadingSubmit(true);
        const quiz = await getQuizById(id);
        setFormData({
          title: quiz.title ?? "",
          description: quiz.description ?? "",
          topic: typeof quiz.topic === 'object' && quiz.topic !== null ? (quiz.topic as any).id : quiz.topic ?? "",
          duration: quiz.duration ?? 0,
          accessTier: quiz.accessTier ?? "FREE",
        });
      } catch (error: any) {
        console.error("Error fetching quiz:", error);
        toast.error("❌ Không thể tải dữ liệu quiz.");
      } finally {
        setLoadingSubmit(false);
      }
    };

    fetchQuiz();
  }, [id]);

  const handleChange = (
    field: keyof typeof formData,
    value: string | number | "PRO" | "FREE"
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field in errors) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async () => {
    const newErrors = {
      title: formData.title ? "" : "Tiêu đề quiz là bắt buộc.",
      description: formData.description ? "" : "Mô tả là bắt buộc.",
      topic: formData.topic ? "" : "Chủ đề là bắt buộc.",
      duration: formData.duration > 0 ? "" : "Thời lượng phải là một số dương.",
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some((err) => err)) {
      toast.warn("⚠️ Vui lòng điền đầy đủ thông tin!");
      return;
    }

    if (!id) {
      toast.error("Không thể cập nhật quiz: Thiếu ID.");
      return;
    }

    try {
      setLoadingSubmit(true);

      const payload = {
        title: formData.title,
        description: formData.description,
        duration: Number(formData.duration),
        topic: formData.topic,
        accessTier: formData.accessTier,
      };

      const updated = await updateQuiz(id, payload);
      toast.success(`Cập nhật quiz thành công!`);

    } catch (error: any) {
      console.error("[handleSubmit] Error:", error);
      toast.error(error.message || "Cập nhật quiz thất bại!");
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;

    const confirmDelete = window.confirm("⚠️ Bạn có chắc chắn muốn xóa quiz này?");
    if (!confirmDelete) return;

    try {
      setLoadingDelete(true);
      await deleteQuiz(id);
      toast.success(`Đã xóa quiz thành công!`);
    } catch (error: any) {
      console.error("[handleDelete] Error:", error);
      toast.error(error.message || "Xóa quiz thất bại!");
    } finally {
      setLoadingDelete(false);
    }
  };

  return (
    <div>
      {/* Toast container */}
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        pauseOnHover
        closeOnClick
        draggable
        style={{ zIndex: 999999 }}
      />

      <PageBreadcrumb pageTitle={id ? "Cập nhật Quiz" : "Tạo Quiz"} />

      <div className="max-w-3xl mx-auto mt-6 space-y-6">
        {/* Chọn Chủ đề */}
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
                <option key={topic.id} value={topic.id!}>
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

        {/* Loại Quiz (Access Tier) */}
        <div>
          <h3 className="text-lg font-semibold mb-2">
            Loại Quiz <span className="text-red-500">*</span>
          </h3>
          <div className="flex items-center space-x-6">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="accessTier"
                value="FREE"
                checked={formData.accessTier === "FREE"}
                onChange={(e) => handleChange("accessTier", e.target.value as "PRO" | "FREE")}
                className="form-radio h-5 w-5 text-blue-600"
              />
              <span className="ml-2 text-gray-700 dark:text-gray-300">Miễn phí (FREE)</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="accessTier"
                value="PRO"
                checked={formData.accessTier === "PRO"}
                onChange={(e) => handleChange("accessTier", e.target.value as "PRO" | "FREE")}
                className="form-radio h-5 w-5 text-blue-600"
              />
              <span className="ml-2 text-gray-700 dark:text-gray-300">Chuyên nghiệp (PRO)</span>
            </label>
          </div>
        </div>

        {/* Buttons */}
        <div className="pt-4 flex justify-center gap-4">
          <button
            onClick={handleSubmit}
            disabled={loadingSubmit}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loadingSubmit ? "Đang cập nhật..." : "Cập nhật Quiz"}
          </button>

          {id && (
            <button
              onClick={handleDelete}
              disabled={loadingDelete}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loadingDelete ? "Đang xóa..." : "Xóa Quiz"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}