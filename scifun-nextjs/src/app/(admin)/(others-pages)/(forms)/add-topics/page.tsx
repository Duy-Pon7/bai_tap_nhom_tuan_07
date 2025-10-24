"use client";

import React, { useState, useEffect } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import { addTopic } from "@/services/topicsService"; // ✅ đúng file service
import { getSubjects } from "@/services/subjectService"; // Import the getSubjects function

export default function CreateTopicPage() {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    subject: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({
    name: "",
    description: "",
    subject: "",
  });

  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]); // State for subjects

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await getSubjects(); // Fetch subjects
        const subjectOptions = response.subjects.map((subject) => ({ // Corrected access
          id: subject.id,
          name: subject.name,
        }));
        setSubjects(subjectOptions); // Set subjects state
      } catch (error) {
        console.error("Error fetching subjects:", error);
      }
    };

    fetchSubjects();
  }, []);

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field in errors) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async () => {
    // ✅ validate đầu vào
    const newErrors = {
      name: formData.name ? "" : "Tên chủ đề là bắt buộc.",
      description: formData.description ? "" : "Mô tả là bắt buộc.",
      subject: formData.subject ? "" : "Mã môn học (subject ID) là bắt buộc.",
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some((err) => err)) {
      setMessage("⚠️ Vui lòng điền đầy đủ thông tin!");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      // ✅ Gửi đúng payload backend cần
      const payload = {
        name: formData.name,
        description: formData.description,
        subject: formData.subject,
      };

      const created = await addTopic(payload);

      setMessage(`✅ Đã tạo thành công chủ đề: ${created.name}`);
      setFormData({ name: "", description: "", subject: "" });
    } catch (error: any) {
      console.error("[handleSubmit] Error creating topic:", error);
      setMessage("❌ Tạo chủ đề thất bại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Tạo chủ đề" />
      <div className="max-w-3xl mx-auto mt-6 space-y-6">
        {/* Subject ID (dropdown) */}
        <div>
          <h3 className="text-lg font-semibold mb-2">
            Subject ID <span className="text-red-500">*</span>
          </h3>

          <div className="relative">
            <select
              value={formData.subject}
              onChange={(e) => handleChange("subject", e.target.value)}
              className="w-full appearance-none border rounded-lg px-3 py-2 bg-white dark:bg-dark-900"
            >
              <option value="">-- Chọn subject --</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>

            <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
              </svg>
            </span>
          </div>

          {errors.subject && <p className="text-sm text-red-600 mt-1">{errors.subject}</p>}
        </div>
        {/* Tên chủ đề */}
        <div>
          <h3 className="text-lg font-semibold mb-2">
            Tên chủ đề <span className="text-red-500">*</span>
          </h3>
          <Input
            type="text"
            value={formData.name}
            placeholder="Nhập tên chủ đề, ví dụ: Văn học nước ngoài"
            maxLength={100}
            onChange={(e) => handleChange("name", e.target.value)}
            error={!!errors.name}
            hint={errors.name}
          />
        </div>

        {/* Mô tả */}
        <div>
          <h3 className="text-lg font-semibold mb-2">
            Mô tả <span className="text-red-500">*</span>
          </h3>
          <TextArea
            rows={6}
            placeholder="Nhập mô tả ngắn gọn về chủ đề"
            value={formData.description}
            onChange={(value: string) => handleChange("description", value)}
            error={!!errors.description}
            hint={errors.description}
          />
        </div>

  

        {/* Thông báo */}
        {message && (
          <p
            className={`text-sm mt-2 text-center ${
              message.includes("❌") ? "text-red-600" : "text-green-600"
            }`}
          >
            {message}
          </p>
        )}

        {/* Nút tạo */}
        <div className="pt-4 text-center">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "Đang tạo..." : "Tạo chủ đề"}
          </button>
        </div>
      </div>
    </div>
  );
}
