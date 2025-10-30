"use client";

import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
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
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<{
    name: string;
    description: string;
    maxTopics: string;
    image: string;
  }>({
    name: "",
    description: "",
    maxTopics: "",
    image: "",
  });

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
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setErrors((prev) => ({ ...prev, image: "" }));
  };

  const handleSubmit = async () => {
    const newErrors = {
      name: formData.name ? "" : "Tên môn học là bắt buộc.",
      description: formData.description ? "" : "Mô tả là bắt buộc.",
      maxTopics:
        formData.maxTopics > 0 ? "" : "Số chủ đề tối đa phải lớn hơn 0.",
      image: imageFile ? "" : "Ảnh minh họa là bắt buộc.",
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some((error) => error !== "")) {
      setMessage("Vui lòng điền đầy đủ thông tin!");
      toast.warn("⚠️ Vui lòng điền đầy đủ thông tin!");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        maxTopics: Number(formData.maxTopics),
        image: imageFile,
      };

      const created = await addSubject(payload);

      toast.success(`Đã tạo thành công môn học: ${created.name}`);

      setTimeout(() => {
        setFormData({ name: "", description: "", maxTopics: 0 });
        setImageFile(null);
        setImagePreview(null);
      }, 500);
    } catch (error: any) {
      console.error("[handleSubmit] Error creating subject:", error);
      toast.error("Tạo môn học thất bại!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  return (
    <div>
      {/* Toast */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        style={{ zIndex: 999999 }}
      />

      {/* Breadcrumb */}
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
            Ảnh minh họa <span className="text-red-500">*</span>
          </h3>
          {imagePreview && (
            <div className="mt-4 mb-4">
              <img
                src={imagePreview}
                alt="Xem trước ảnh"
                className="max-h-60 w-auto rounded-lg object-cover"
              />
            </div>
          )}
          <div className="mt-2">
            <DropzoneComponent
              onFileAccepted={handleFileAccepted}
              error={!!errors.image}
            />
            {errors.image && (
              <p className="text-red-500 text-sm mt-1">{errors.image}</p>
            )}
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
            {loading ? "Đang tạo..." : "Tạo môn học"}
          </button>
        </div>
      </div>
    </div>
  );
}
