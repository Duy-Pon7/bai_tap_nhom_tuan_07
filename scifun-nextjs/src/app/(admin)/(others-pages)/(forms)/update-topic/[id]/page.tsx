"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import { getTopicById, updateTopic, deleteTopic, addTopic } from "@/services/topicsService";
import { getSubjects } from "@/services/subjectService";
import { ToastContainer, toast } from "react-toastify";

export default function UpdateTopicPage() {
  const params = useParams();
  const id = params?.id as string | undefined; // ID từ URL, có thể không tồn tại (trường hợp tạo mới)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    subject: "",
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    name: "",
    description: "",
    subject: "",
  });

  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]); // State for subjects

  // Lấy danh sách các môn học để hiển thị trong dropdown
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await getSubjects(); // Fetch subjects
        const subjectOptions = response.subjects.map((subject: any) => ({
          id: subject.id,
          name: subject.name,
        }));
        setSubjects(subjectOptions);
      } catch (error) {
        console.error("Error fetching subjects:", error);
        toast.error("❌ Lỗi khi tải danh sách môn học!");
      }
    };

    fetchSubjects();
  }, []);

  // Nếu có ID, lấy dữ liệu chủ đề để điền vào form
  useEffect(() => {
    if (!id) return;

    const fetchTopic = async () => {
      try {
        setLoading(true);
        const topic = await getTopicById(id);
        setFormData({ // Sử dụng nullish coalescing operator để phòng trường hợp giá trị là null/undefined
          name: topic.name ?? "",
          description: topic.description ?? "",
          subject: typeof topic.subject === 'object' && topic.subject !== null 
            ? (topic.subject as any).id || (topic.subject as any)._id // Lấy id từ object subject
            : typeof topic.subject === 'string' 
            ? topic.subject // Nếu đã là string id
            : "", // Giá trị mặc định
        });
      } catch (error) {
        console.error("Error fetching topic:", error);
        toast.error("❌ Không thể tải dữ liệu chủ đề.");
      } finally {
        setLoading(false);
      }
    };

    fetchTopic();
  }, [id]);

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field in errors) setErrors((prev) => ({ ...prev, [field]: "" }));
  };
// ✅ Xử lý xóa chủ đề
const handleDelete = async () => {
  if (!id) return; // Nếu không có ID (trang tạo mới), thì không xóa được

  const confirmDelete = window.confirm("⚠️ Bạn có chắc chắn muốn xóa chủ đề này không?");
  if (!confirmDelete) {
    return;
  }

  try {
    setLoading(true);
    const res = await deleteTopic(id);
    toast.success(`🗑️ ${res.message}`);
    
    // Có thể chuyển hướng về danh sách topic sau vài giây (nếu muốn)
    // Ví dụ: window.location.href = "/admin/topics";
  } catch (error: any) {
    console.error("[handleDelete] Error:", error);
    toast.error("❌ Xóa chủ đề thất bại!");
  } finally {
    setLoading(false);
  }
};

  // Xử lý việc gửi form (tạo mới hoặc cập nhật)
  const handleSubmit = async () => {
    const newErrors = {
      name: formData.name ? "" : "Tên chủ đề là bắt buộc.",
      description: formData.description ? "" : "Mô tả là bắt buộc.",
      subject: formData.subject ? "" : "Mã môn học (subject ID) là bắt buộc.",
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some((err) => err)) {
      toast.warn("⚠️ Vui lòng điền đầy đủ thông tin!");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        name: formData.name,
        description: formData.description,
        subject: formData.subject,
      };

      if (id) {
        const updatedTopic = await updateTopic(id, payload);
        toast.success(`✅ Cập nhật thành công chủ đề: ${updatedTopic.name}`);
      } else {
        const created = await addTopic(payload);
        toast.success(`✅ Đã tạo thành công chủ đề: ${created.name}`);
        setTimeout(() => {
          setFormData({ name: "", description: "", subject: "" }); // Reset form sau khi tạo
        }, 500);
      }
    } catch (error: any) {
      console.error("[handleSubmit] Error:", error);
      toast.error("❌ Thao tác thất bại!");
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
        style={{ zIndex: 999999 }}
      />
      <PageBreadcrumb pageTitle={id ? "Cập nhật chủ đề" : "Tạo chủ đề"} />
      <div className="max-w-3xl mx-auto mt-6 space-y-6">
        {/* Dropdown chọn Subject */}
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

<div className="pt-4 flex justify-center gap-4">
  {/* Nút Lưu / Cập nhật */}
  <button
    onClick={handleSubmit}
    disabled={loading}
    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
  >
    {loading ? (id ? "Đang cập nhật..." : "Đang tạo...") : id ? "Cập nhật chủ đề" : "Tạo chủ đề"}
  </button>

  {/* Nút Xóa chỉ hiện nếu đang ở chế độ cập nhật */}
  {id && (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
    >
      {loading ? "Đang xóa..." : "Xóa chủ đề"}
    </button>
  )}
</div>

      </div>
    </div>
  );
}