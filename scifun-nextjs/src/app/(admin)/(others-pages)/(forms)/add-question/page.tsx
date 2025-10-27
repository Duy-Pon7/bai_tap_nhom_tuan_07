"use client";

import React, { useState, useEffect } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import { addQuestion, QuestionOption } from "@/services/questionService";
import { getQuizzes, Quiz } from "@/services/quizzService";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function CreateQuestionPage() {
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

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    quiz: "",
    content: "",
    options: "",
  });

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        // Fetch all quizzes, assuming the list isn't excessively long.
        // Adjust limit if needed or implement a searchable dropdown.
        const response = await getQuizzes(1, 1000);
        setQuizzes(response.quizzes);
      } catch (error) {
        console.error("Error fetching quizzes:", error);
        toast.error("❌ Lỗi khi tải danh sách quiz!");
      }
    };

    fetchQuizzes();
  }, []);

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
      newOptions.forEach((option, i) => {
        option.isCorrect = i === index;
      });
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
        formData.options.some((opt) => opt.text) &&
        formData.options.some((opt) => opt.isCorrect)
          ? ""
          : "Cần ít nhất một lựa chọn và một đáp án đúng.",
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some((err) => err)) {
      toast.warn("⚠️ Vui lòng điền đầy đủ thông tin!");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        quiz: formData.quiz,
        content: formData.content,
        options: formData.options.filter(opt => opt.text.trim() !== ''), // Remove empty options
        explanation: formData.explanation || null,
        type: formData.type,
      };

      const created = await addQuestion(payload);

      toast.success(`Đã tạo thành công câu hỏi!`);

      // Reset form sau 0.5s để toast hiển thị trước
      setTimeout(() => {
        setFormData({
          quiz: "",
          content: "",
          options: [{ text: "", isCorrect: false }, { text: "", isCorrect: false }],
          explanation: "",
          type: "single-choice",
        });
      }, 500);
    } catch (error: any) {
      console.error("[handleSubmit] Error creating question:", error);
      toast.error(error.message || "Tạo câu hỏi thất bại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Toast container (góc phải) */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        pauseOnHover
        closeOnClick
        draggable
        style={{ zIndex: 999999 }}
      />

      <PageBreadcrumb pageTitle="Tạo câu hỏi" />

      <div className="max-w-3xl mx-auto mt-6 space-y-6">
        {/* Chọn Quiz */}
        <div>
          <h3 className="text-lg font-semibold mb-2">
            Quiz <span className="text-red-500">*</span>
          </h3>
          <div className="relative">
            <select
              value={formData.quiz}
              onChange={(e) => handleChange("quiz", e.target.value)}
              className={`w-full appearance-none border rounded-lg px-3 py-2 bg-white dark:bg-dark-900 ${
                errors.quiz ? "border-red-500" : "border-gray-300"
              }`}
            >
              <option value="">-- Chọn Quiz --</option>
              {quizzes.map((quiz) => (
                <option key={quiz.id} value={quiz.id}>
                  {quiz.title}
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
          {errors.quiz && (
            <p className="text-sm text-red-600 mt-1">{errors.quiz}</p>
          )}
        </div>

        {/* Nội dung câu hỏi */}
        <div>
          <h3 className="text-lg font-semibold mb-2">
            Nội dung câu hỏi <span className="text-red-500">*</span>
          </h3>
          <TextArea
            rows={6}
            placeholder="Nhập nội dung câu hỏi..."
            value={formData.content}
            onChange={(value: string) => handleChange("content", value)}
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
                name="questionType"
                value="single-choice"
                checked={formData.type === "single-choice"}
                onChange={() => handleChange("type", "single-choice")}
                className="form-radio h-4 w-4 text-blue-600"
              />
              <span>Một đáp án</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="questionType"
                value="multiple-choice"
                checked={formData.type === "multiple-choice"}
                onChange={() => handleChange("type", "multiple-choice")}
                className="form-radio h-4 w-4 text-blue-600"
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
          <div className="space-y-3">
            {formData.options.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type={formData.type === "single-choice" ? "radio" : "checkbox"}
                  name="correctOption"
                  checked={option.isCorrect}
                  onChange={() => handleCorrectOptionChange(index)}
                  className="form-checkbox h-5 w-5 text-blue-600 rounded"
                />
                <Input
                  type="text"
                  value={option.text}
                  placeholder={`Lựa chọn ${index + 1}`}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  className="flex-grow"
                />
                <button
                  onClick={() => removeOption(index)}
                  className="text-red-500 hover:text-red-700 p-2"
                  disabled={formData.options.length <= 2}
                >
                  Xóa
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={addOption}
            className="mt-3 px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300"
          >
            Thêm lựa chọn
          </button>
          {errors.options && (
            <p className="text-sm text-red-600 mt-1">{errors.options}</p>
          )}
        </div>

        {/* Giải thích */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Giải thích (Tùy chọn)</h3>
          <TextArea
            rows={4}
            placeholder="Nhập giải thích cho đáp án đúng..."
            value={formData.explanation}
            onChange={(value: string) => handleChange("explanation", value)}
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
            {loading ? "Đang tạo..." : "Tạo câu hỏi"}
          </button>
        </div>
      </div>
    </div>
  );
}
