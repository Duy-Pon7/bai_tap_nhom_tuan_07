"use client";

import React, { useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import DropzoneComponent from "@/components/form/form-elements/DropZone";
import { addSubject } from "@/services/subjectService";

export default function CreateSubjectPage() {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    maxTopics: 0,
    image: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<{
    name: string;
    description: string;
    maxTopics: string;
  }>({ name: "", description: "", maxTopics: "" });

  const handleChange = (
    field: keyof typeof formData,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (field in errors) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleFileAccepted = (file: File) => {
    setImageFile(file);
    handleChange("image", file.name);
  };

  const handleSubmit = async () => {
    const newErrors = {
      name: formData.name ? "" : "Tên môn học là bắt buộc.",
      description: formData.description ? "" : "Mô tả là bắt buộc.",
      maxTopics: formData.maxTopics > 0 ? "" : "Số chủ đề tối đa phải lớn hơn 0.",
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some((error) => error !== "")) {
      setMessage("Vui lòng điền đầy đủ thông tin!");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      let imageUrl = formData.image;

      const payload = {
        name: formData.name,
        description: formData.description,
        maxTopics: Number(formData.maxTopics),
        image: imageUrl,
      };

      const created = await addSubject(payload);

      setMessage(`✅ Đã tạo thành công môn học: ${created.name}`);
      setFormData({ name: "", description: "", maxTopics: 0, image: "" });
    } catch (error: any) {
      console.error("[handleSubmit] Error creating subject:", error);
      setMessage("❌ Tạo môn học thất bại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Tạo môn học" />
      <div className="max-w-3xl mx-auto mt-6 space-y-6">
        {/* Tên môn học */}
        <div>
          <h3 className="text-lg font-semibold mb-2">
            Tên môn học <span className="text-red-500">*</span>
          </h3>
          <Input
            type="text"
            value={formData.name}
            placeholder="Nhập tên môn học, ví dụ: Hóa"
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
            placeholder="Nhập mô tả, ví dụ: Là một môn học về những hiện tượng thú vị"
            value={formData.description}
            onChange={(value: string) => handleChange("description", value)}
            error={!!errors.description}
            hint={errors.description}
          />
        </div>

        {/* Số chủ đề tối đa */}
        <div>
          <h3 className="text-lg font-semibold mb-2">
            Số chủ đề tối đa <span className="text-red-500">*</span>
          </h3>
          <Input
            type="number"
            min="1"
            value={formData.maxTopics}
            placeholder="Ví dụ: 10"
            onChange={(e) => handleChange("maxTopics", Number(e.target.value))}
            error={!!errors.maxTopics}
            hint={errors.maxTopics}
          />
        </div>

        {/* Ảnh minh họa */}
        <div>
          <h3 className="text-lg font-semibold mb-2">
            Ảnh minh họa (link hoặc upload)
          </h3>
          <Input
            type="text"
            value={formData.image}
            placeholder="Dán link ảnh hoặc upload bên dưới"
            onChange={(e) => handleChange("image", e.target.value)}
          />
          <div className="mt-4">
            <DropzoneComponent onFileAccepted={handleFileAccepted} />
          </div>
        </div>

        {/* Thông báo */}
        {message && (
          <p className="text-sm mt-2 text-center text-gray-700">{message}</p>
        )}

        {/* Nút tạo */}
        <div className="pt-4 text-center">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "Đang tạo..." : "Tạo môn học"}
          </button>
        </div>
      </div>
    </div>
  );
}
