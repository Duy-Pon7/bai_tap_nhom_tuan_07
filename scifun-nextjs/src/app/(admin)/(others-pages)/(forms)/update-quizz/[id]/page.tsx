"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import { addQuiz, getQuizById, updateQuiz, deleteQuiz } from "@/services/quizzService";
import { getTopics } from "@/services/topicsService";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Topic } from "@/services/topicsService";

export default function UpdateQuizPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string | undefined;

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    topic: "",
    duration: 0,
  });

  const [errors, setErrors] = useState({
    title: "",
    description: "",
    topic: "",
    duration: "",
  });

  const [topics, setTopics] = useState<Topic[]>([]);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);

  // Fetch all topics for dropdown
  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const response = await getTopics();
        setTopics(response.topics);
      } catch (error) {
        console.error("Error fetching topics:", error);
        toast.error("❌ Không thể tải danh sách chủ đề.");
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
          topic: typeof quiz.topic === "string" ? quiz.topic : quiz.topic?.id ?? "",
          duration: quiz.duration ?? 0,
        });
      } catch (error: any) {
        console.error("Error fetching quiz:", error);
        toast.error("❌ Không thể tải dữ liệu quiz.");
      } finally {
        setLoadingSubmit(false);
      }
    };

    fetchQuiz();
  }, [id, router]);

  const handleChange = (field: keyof typeof formData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async () => {
    // Validate form
    const newErrors = {
      title: formData.title ? "" : "Tên quiz là bắt buộc.",
      description: formData.description ? "" : "Mô tả là bắt buộc.",
      topic: formData.topic ? "" : "Chọn chủ đề là bắt buộc.",
      duration: formData.duration > 0 ? "" : "Thời lượng phải là một số dương.",
    };
    setErrors(newErrors);

    if (Object.values(newErrors).some(err => err)) {
      toast.warn("⚠️ Vui lòng điền đầy đủ thông tin!");
      return;
    }

    try {
      setLoadingSubmit(true);

      const payload = {
        title: formData.title,
        description: formData.description,
        topic: formData.topic,
        duration: Number(formData.duration),
      };

      if (id) {
        const updated = await updateQuiz(id, payload);
        toast.success(`✅ Cập nhật thành công: ${updated.title}`);
      } else {
        const created = await addQuiz(payload);
        toast.success(`✅ Tạo mới thành công: ${created.title}`);
        setTimeout(() => {
          setFormData({ title: "", description: "", topic: "", duration: 0 });
        }, 500);
      }
    } catch (error: any) {
      console.error("[handleSubmit] Error:", error);
      toast.error(`❌ Thao tác thất bại: ${error?.message || "Không xác định"}`);
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
      const res = await deleteQuiz(id);
      toast.success(`🗑️ ${res.message}`);

      // Redirect to quiz list after delete
      setTimeout(() => router.push("/admin/quizzes"), 1000);
    } catch (error: any) {
      console.error("[handleDelete] Error:", error);
      toast.error(`❌ Xóa thất bại: ${error?.message || "Không xác định"}`);
    } finally {
      setLoadingDelete(false);
    }
  };

  return (
    <div>
      {/* Toast container */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        pauseOnHover
        closeOnClick
        draggable
        style={{ zIndex: 999999 }}
      />
      <PageBreadcrumb pageTitle={id ? "Cập nhật quiz" : "Tạo quiz"} />
      <div className="max-w-3xl mx-auto mt-6 space-y-6">
        {/* Topic dropdown */}
        <div>
          <h3 className="text-lg font-semibold mb-2">
            Chủ đề <span className="text-red-500">*</span>
          </h3>
          <select
            value={formData.topic}
            onChange={(e) => handleChange("topic", e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
          >
            <option value="">-- Chọn chủ đề --</option>
            {topics.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.name}
              </option>
            ))}
          </select>
          {errors.topic && <p className="text-red-600 text-sm mt-1">{errors.topic}</p>}
        </div>

        {/* Title */}
        <div>
          <h3 className="text-lg font-semibold mb-2">
            Tên quiz <span className="text-red-500">*</span>
          </h3>
          <Input
            type="text"
            value={formData.title}
            placeholder="Nhập tên quiz"
            onChange={(e) => handleChange("title", e.target.value)}
            error={!!errors.title}
            hint={errors.title}
          />
        </div>

        {/* Description */}
        <div>
          <h3 className="text-lg font-semibold mb-2">
            Mô tả <span className="text-red-500">*</span>
          </h3>
          <TextArea
            rows={6}
            value={formData.description}
            onChange={(value: string) => handleChange("description", value)}
            error={!!errors.description}
            hint={errors.description}
          />
        </div>

        {/* Duration */}
        <div>
          <h3 className="text-lg font-semibold mb-2">
            Thời lượng (phút) <span className="text-red-500">*</span>
          </h3>
          <Input
            type="number"
            value={formData.duration}
            placeholder="Nhập thời lượng quiz (phút)"
            min={1}
            onChange={e => handleChange("duration", parseInt(e.target.value, 10) || 0)}
            error={!!errors.duration}
            hint={errors.duration}
          />
        </div>

        {/* Buttons */}
        <div className="pt-4 flex justify-center gap-4">
          <button
            onClick={handleSubmit}
            disabled={loadingSubmit}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loadingSubmit ? (id ? "Đang cập nhật..." : "Đang tạo...") : id ? "Cập nhật quiz" : "Tạo quiz"}
          </button>

          {id && (
            <button
              onClick={handleDelete}
              disabled={loadingDelete}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loadingDelete ? "Đang xóa..." : "Xóa quiz"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
