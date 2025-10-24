"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import { getSubjectById, updateSubject, deleteSubject } from "@/services/subjectService";

export default function UpdateSubjectPage() {
  const { id } = useParams(); // 🆔 Lấy id từ URL
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image: "",
    maxTopics: 0,
  });

  const [loading, setLoading] = useState(true); // Bắt đầu với loading true
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({
    name: "",
    description: "",
    maxTopics: "",
  });

  // 🟢 Lấy dữ liệu môn học khi load trang
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
      } catch (error) {
        console.error("❌ Lỗi khi lấy dữ liệu môn học:", error);
        setMessage("❌ Không thể tải dữ liệu môn học!");
      } finally {
        setLoading(false);
      }
    };

    fetchSubject();
  }, [id]);

  // 🟡 Cập nhật giá trị form
  const handleChange = (field: keyof typeof formData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field in errors) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  // 🟢 Gửi dữ liệu cập nhật
  const handleSubmit = async () => {
    const newErrors = {
      name: formData.name ? "" : "Tên môn học là bắt buộc.",
      description: formData.description ? "" : "Mô tả là bắt buộc.",
      maxTopics:
        formData.maxTopics > 0 ? "" : "Số lượng chủ đề tối đa phải lớn hơn 0.",
    };

    setErrors(newErrors);
    if (Object.values(newErrors).some((err) => err)) {
      setMessage("⚠️ Vui lòng điền đầy đủ thông tin!");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const updated = await updateSubject(id as string, {
        name: formData.name,
        description: formData.description,
        image: formData.image,
        maxTopics: Number(formData.maxTopics),
      });

      setMessage(`✅ Cập nhật thành công: ${updated.name}`);
    } catch (error) {
      console.error("[handleSubmit] Error updating subject:", error);
      setMessage("❌ Cập nhật môn học thất bại!");
    } finally {
      setLoading(false);
    }
  };

  // 🔴 Xóa môn học
  const handleDelete = async () => {
    if (!id) return;

    if (!window.confirm("Bạn có chắc chắn muốn xóa môn học này không? Hành động này không thể hoàn tác.")) {
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      await deleteSubject(id as string);
      setMessage("✅ Xóa môn học thành công! Đang chuyển hướng...");
      setTimeout(() => {
        router.push("/admin/subjects-list"); // Chuyển hướng về trang danh sách
      }, 2000);
    } catch (error) {
      console.error("[handleDelete] Error deleting subject:", error);
      setMessage("❌ Xóa môn học thất bại!");
      setLoading(false); // Chỉ dừng loading khi có lỗi, vì thành công sẽ chuyển trang
    }
  };

  return (
    <div>
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

        {/* Hình ảnh (tùy chọn) */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Ảnh (tuỳ chọn)</h3>
          <Input
            type="text"
            value={formData.image}
            placeholder="Nhập URL hình ảnh (nếu có)"
            onChange={(e) => handleChange("image", e.target.value)}
          />
        </div>

        {/* Số lượng chủ đề tối đa */}
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

        {/* Nút cập nhật */}
        <div className="pt-4 flex justify-center gap-4">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "Đang xử lý..." : "Cập nhật môn học"}
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
          >
            {loading ? "Đang xử lý..." : "Xóa môn học"}
          </button>
        </div>
      </div>
    </div>
  );
}
