"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import DropzoneComponent from "@/components/form/form-elements/DropZone";
import { getSubjectById, updateSubject, deleteSubject } from "@/services/subjectService";

export default function UpdateSubjectPage() {
  const { id } = useParams();
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image: "",
    maxTopics: 0,
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Tách riêng loading cho update và delete
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);

  const [errors, setErrors] = useState({
    name: "",
    description: "",
    maxTopics: "",
  });

  // Load dữ liệu môn học khi vào trang
  useEffect(() => {
    if (!id) return;

    const fetchSubject = async () => {
      try {
        const subject = await getSubjectById(id as string);
        setFormData({
          name: subject.name || "",
          description: subject.description || "",
          image: subject.image || "",
          maxTopics: subject.maxTopics || 0,
        });
        if (subject.image) setImagePreview(subject.image);
      } catch (error) {
        console.error("❌ Lỗi khi lấy dữ liệu môn học:", error);
        toast.error("❌ Không thể tải dữ liệu môn học!");
      }
    };

    fetchSubject();
  }, [id]);
  
  // Cleanup effect for object URL
  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  // Update giá trị form
  const handleChange = (field: keyof typeof formData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field in errors) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleFileAccepted = (file: File) => {
    if (imagePreview && imagePreview.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  // Submit cập nhật
  const handleSubmit = async () => {
    const newErrors = {
      name: formData.name ? "" : "Tên môn học là bắt buộc.",
      description: formData.description ? "" : "Mô tả là bắt buộc.",
      maxTopics: formData.maxTopics > 0 ? "" : "Số lượng chủ đề tối đa phải lớn hơn 0.",
    };

    setErrors(newErrors);
    if (Object.values(newErrors).some((err) => err)) {
      toast.warn("⚠️ Vui lòng điền đầy đủ thông tin!");
      return;
    }

    try {
      setLoadingUpdate(true);
      const payload = {
        name: formData.name,
        description: formData.description,
        maxTopics: Number(formData.maxTopics),
        image: imageFile, // Gửi file mới nếu có
      };

      const updated = await updateSubject(id as string, payload);
      toast.success(`✅ Cập nhật thành công môn học: ${updated.name}`);
    } catch (error) {
      console.error("[handleSubmit] Error updating subject:", error);
      toast.error("❌ Cập nhật môn học thất bại!");
    } finally {
      setLoadingUpdate(false);
    }
  };

  // Xóa môn học
  const handleDelete = async () => {
    if (!id) return;

    if (!window.confirm("Bạn có chắc chắn muốn xóa môn học này không? Hành động này không thể hoàn tác.")) return;

    try {
      setLoadingDelete(true);
      await deleteSubject(id as string);
      toast.success("✅ Xóa môn học thành công! Đang chuyển hướng...");
      setTimeout(() => router.push("/list-subjects"), 2000);
    } catch (error) {
      console.error("[handleDelete] Error deleting subject:", error);
      toast.error("❌ Xóa môn học thất bại!");
      setLoadingDelete(false);
    }
  };

  return (
    <div>
      {/* Toast */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        style={{ zIndex: 999999 }}
      />

      <PageBreadcrumb pageTitle="Cập nhật môn học" />

      <div className="max-w-3xl mx-auto mt-6 space-y-6">
        {/* Tên môn học */}
        <div>
          <h3 className="text-lg font-semibold mb-2">
            Tên môn học <span className="text-red-500">*</span>
          </h3>
          <Input
            type="text"
            value={formData.name}
            placeholder="Nhập tên môn học"
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
            placeholder="Nhập mô tả môn học"
            value={formData.description}
            onChange={(value: string) => handleChange("description", value)}
            error={!!errors.description}
            hint={errors.description}
          />
        </div>

        {/* Hình ảnh */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Ảnh minh họa (tuỳ chọn)</h3>
          {imagePreview && (
            <div className="mt-4 mb-4">
              <p className="text-sm mb-2 text-gray-600">
                {imageFile ? "Ảnh mới:" : "Ảnh hiện tại:"}
              </p>
              <img
                src={imagePreview}
                alt="Xem trước ảnh"
                className="max-h-60 w-auto rounded-lg object-cover"
              />
            </div>
          )}
          <div className="mt-2">
            <DropzoneComponent onFileAccepted={handleFileAccepted} />
          </div>
        </div>

        {/* Số lượng chủ đề */}
        <div>
          <h3 className="text-lg font-semibold mb-2">
            Số lượng chủ đề tối đa <span className="text-red-500">*</span>
          </h3>
          <Input
            type="number"
            value={formData.maxTopics}
            onChange={(e) => handleChange("maxTopics", Number(e.target.value))}
            error={!!errors.maxTopics}
            hint={errors.maxTopics}
          />
        </div>

        {/* Nút hành động */}
        <div className="pt-4 flex justify-center gap-4">
          {/* Update */}
          <button
            onClick={handleSubmit}
            disabled={loadingUpdate}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
          >
            {loadingUpdate && (
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
            {loadingUpdate ? "Đang xử lý..." : "Cập nhật môn học"}
          </button>

          {/* Delete */}
          <button
            onClick={handleDelete}
            disabled={loadingDelete}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center gap-2"
          >
            {loadingDelete && (
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
            {loadingDelete ? "Đang xử lý..." : "Xóa môn học"}
          </button>
        </div>
      </div>
    </div>
  );
}
