"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import {
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  QuestionOption,
} from "@/services/questionService";
import { getQuizzes, Quiz } from "@/services/quizzService";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function UpdateQuestionPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string | undefined;

  const [formData, setFormData] = useState({
    quiz: "",
    content: "",
    options: [
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
    ] as QuestionOption[],
    explanation: "",
    type: "single-choice" as "single-choice" | "multiple-choice",
  });

  const [errors, setErrors] = useState({
    quiz: "",
    content: "",
    options: "",
  });

  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);

  // Fetch danh sách quiz
  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const response = await getQuizzes(1, 1000);
        setQuizzes(response.quizzes);
      } catch (error) {
        console.error("Error fetching quizzes:", error);
        toast.error("❌ Không thể tải danh sách quiz!");
      }
    };
    fetchQuizzes();
  }, []);

  // Nếu có id => load câu hỏi để update
  useEffect(() => {
    if (!id) return;

    const fetchQuestion = async () => {
      try {
        setLoadingSubmit(true);
        const question = await getQuestionById(id);

        setFormData({
          quiz:
            typeof question.quiz === "object" && question.quiz !== null
              ? (question.quiz as any).id || (question.quiz as any)._id
              : typeof question.quiz === "string"
              ? question.quiz
              : "",
          content: question.content || "",
          options:
            question.options?.length > 0
              ? question.options
              : [
                  { text: "", isCorrect: false },
                  { text: "", isCorrect: false },
                ],
          explanation: question.explanation || "",
          type: question.type || "single-choice",
        });
      } catch (error) {
        console.error("Error fetching question:", error);
        toast.error("❌ Không thể tải dữ liệu câu hỏi!");
      } finally {
        setLoadingSubmit(false);
      }
    };

    fetchQuestion();
  }, [id]);

  const handleChange = (
    field: keyof typeof formData,
    value: string | QuestionOption[]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field in errors) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleOptionChange = (index: number, text: string) => {
    const newOptions = [...formData.options];
    newOptions[index].text = text;
    handleChange("options", newOptions);
  };

  const handleCorrectOptionChange = (index: number) => {
    const newOptions = [...formData.options];
    if (formData.type === "single-choice") {
      newOptions.forEach((opt, i) => (opt.isCorrect = i === index));
    } else {
      newOptions[index].isCorrect = !newOptions[index].isCorrect;
    }
    handleChange("options", newOptions);
  };

  const addOption = () => {
    handleChange("options", [...formData.options, { text: "", isCorrect: false }]);
  };

  const removeOption = (index: number) => {
    const newOptions = formData.options.filter((_, i) => i !== index);
    handleChange("options", newOptions);
  };

  const handleSubmit = async () => {
    const newErrors = {
      quiz: formData.quiz ? "" : "Quiz là bắt buộc.",
      content: formData.content ? "" : "Nội dung câu hỏi là bắt buộc.",
      options:
        formData.options.some((opt) => opt.text.trim()) &&
        formData.options.some((opt) => opt.isCorrect)
          ? ""
          : "Cần ít nhất một lựa chọn và một đáp án đúng.",
    };
    setErrors(newErrors);

    if (Object.values(newErrors).some((err) => err)) {
      toast.warn("⚠️ Vui lòng điền đầy đủ thông tin!");
      return;
    }

    try {
      setLoadingSubmit(true);
      const payload = {
        quiz: formData.quiz,
        content: formData.content,
        options: formData.options.filter((o) => o.text.trim() !== ""),
        explanation: formData.explanation || null,
        type: formData.type,
      };

      if (id) {
        const updated = await updateQuestion(id, payload);
        toast.success(`✅ Đã cập nhật câu hỏi thành công!`);
      } else {
        toast.error("❌ Không tìm thấy ID câu hỏi để cập nhật.");
      }
    } catch (error: any) {
      console.error("[handleSubmit] Error:", error);
      toast.error(error.message || "❌ Cập nhật thất bại!");
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    const confirmDelete = window.confirm("⚠️ Bạn có chắc chắn muốn xóa câu hỏi này?");
    if (!confirmDelete) return;

    try {
      setLoadingDelete(true);
      const res = await deleteQuestion(id);
      toast.success("🗑️ Đã xóa câu hỏi thành công!");
    } catch (error: any) {
      console.error("[handleDelete] Error:", error);
      toast.error(error.message || "❌ Xóa câu hỏi thất bại!");
    } finally {
      setLoadingDelete(false);
    }
  };

  return (
    <div>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
      <PageBreadcrumb pageTitle="Cập nhật câu hỏi" />

      <div className="max-w-3xl mx-auto mt-6 space-y-6">
        {/* Quiz chọn */}
        <div>
          <h3 className="text-lg font-semibold mb-2">
            Quiz <span className="text-red-500">*</span>
          </h3>
          <select
            value={formData.quiz}
            onChange={(e) => handleChange("quiz", e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
          >
            <option value="">-- Chọn quiz --</option>
            {quizzes.map((quiz) => (
              <option key={quiz.id} value={quiz.id}>
                {quiz.title}
              </option>
            ))}
          </select>
          {errors.quiz && <p className="text-sm text-red-600 mt-1">{errors.quiz}</p>}
        </div>

        {/* Nội dung */}
        <div>
          <h3 className="text-lg font-semibold mb-2">
            Nội dung câu hỏi <span className="text-red-500">*</span>
          </h3>
          <TextArea
            rows={6}
            value={formData.content}
            onChange={(val: string) => handleChange("content", val)}
            error={!!errors.content}
            hint={errors.content}
          />
        </div>

        {/* Loại câu hỏi */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Loại câu hỏi</h3>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={formData.type === "single-choice"}
                onChange={() => handleChange("type", "single-choice")}
              />
              <span>Một đáp án</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={formData.type === "multiple-choice"}
                onChange={() => handleChange("type", "multiple-choice")}
              />
              <span>Nhiều đáp án</span>
            </label>
          </div>
        </div>

        {/* Các lựa chọn */}
        <div>
          <h3 className="text-lg font-semibold mb-2">
            Các lựa chọn <span className="text-red-500">*</span>
          </h3>
          {formData.options.map((opt, index) => (
            <div key={index} className="flex items-center gap-2 mb-2">
              <input
                type={formData.type === "single-choice" ? "radio" : "checkbox"}
                checked={opt.isCorrect}
                onChange={() => handleCorrectOptionChange(index)}
              />
              <Input
                type="text"
                value={opt.text}
                placeholder={`Lựa chọn ${index + 1}`}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                className="flex-grow"
              />
              <button
                onClick={() => removeOption(index)}
                disabled={formData.options.length <= 2}
                className="text-red-500 hover:text-red-700"
              >
                Xóa
              </button>
            </div>
          ))}
          <button
            onClick={addOption}
            className="mt-2 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Thêm lựa chọn
          </button>
          {errors.options && <p className="text-sm text-red-600 mt-1">{errors.options}</p>}
        </div>

        {/* Giải thích */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Giải thích (Tùy chọn)</h3>
          <TextArea
            rows={4}
            value={formData.explanation}
            onChange={(val: string) => handleChange("explanation", val)}
          />
        </div>

        {/* Buttons */}
        <div className="pt-4 flex justify-center gap-4">
          <button
            onClick={handleSubmit}
            disabled={loadingSubmit}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loadingSubmit ? "Đang cập nhật..." : "Cập nhật câu hỏi"}
          </button>

          {id && (
            <button
              onClick={handleDelete}
              disabled={loadingDelete}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {loadingDelete ? "Đang xóa..." : "Xóa câu hỏi"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
