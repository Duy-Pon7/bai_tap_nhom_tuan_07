"use client";

import React, { useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Input from "@/components/form/input/InputField";
import { addUser } from "@/services/userService";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function CreateUserPage() {
  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    password: "",
    role: "USER" as "ADMIN" | "USER",
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    fullname: "",
    email: "",
    password: "",
  });

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field in errors) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  const handleSubmit = async () => {
    const newErrors = {
      fullname: formData.fullname ? "" : "Họ và tên là bắt buộc.",
      email: formData.email
        ? validateEmail(formData.email)
          ? ""
          : "Email không hợp lệ."
        : "Email là bắt buộc.",
      password:
        formData.password.length >= 6
          ? ""
          : "Mật khẩu phải có ít nhất 6 ký tự.",
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some((err) => err)) {
      toast.warn("⚠️ Vui lòng điền đầy đủ và chính xác thông tin!");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        fullname: formData.fullname,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      };

      const createdUser = await addUser(payload);

      toast.success(`Đã tạo thành công người dùng: ${createdUser.fullname}`);

      // Reset form sau 0.5s để toast hiển thị trước
      setTimeout(() => {
        setFormData({
          fullname: "",
          email: "",
          password: "",
          role: "USER",
        });
      }, 500);
    } catch (error: any) {
      console.error("[handleSubmit] Error creating user:", error);
      toast.error(error.message || "Tạo người dùng thất bại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        pauseOnHover
        closeOnClick
        draggable
        style={{ zIndex: 999999 }}
      />

      <PageBreadcrumb pageTitle="Tạo người dùng mới" />

      <div className="max-w-3xl mx-auto mt-6 space-y-6">
        {/* Họ và tên */}
        <div>
          <h3 className="text-lg font-semibold mb-2">
            Họ và tên <span className="text-red-500">*</span>
          </h3>
          <Input
            type="text"
            value={formData.fullname}
            placeholder="Nhập họ và tên người dùng"
            maxLength={100}
            onChange={(e) => handleChange("fullname", e.target.value)}
            error={!!errors.fullname}
            hint={errors.fullname}
          />
        </div>

        {/* Email */}
        <div>
          <h3 className="text-lg font-semibold mb-2">
            Email <span className="text-red-500">*</span>
          </h3>
          <Input
            type="email"
            value={formData.email}
            placeholder="Nhập địa chỉ email"
            onChange={(e) => handleChange("email", e.target.value)}
            error={!!errors.email}
            hint={errors.email}
          />
        </div>

        {/* Mật khẩu */}
        <div>
          <h3 className="text-lg font-semibold mb-2">
            Mật khẩu <span className="text-red-500">*</span>
          </h3>
          <Input
            type="password"
            value={formData.password}
            placeholder="Nhập mật khẩu (ít nhất 6 ký tự)"
            onChange={(e) => handleChange("password", e.target.value)}
            error={!!errors.password}
            hint={errors.password}
          />
        </div>

        {/* Vai trò */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Vai trò</h3>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="role"
                value="USER"
                checked={formData.role === "USER"}
                onChange={() => handleChange("role", "USER")}
                className="form-radio h-4 w-4 text-blue-600"
              />
              <span>User</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="role"
                value="ADMIN"
                checked={formData.role === "ADMIN"}
                onChange={() => handleChange("role", "ADMIN")}
                className="form-radio h-4 w-4 text-blue-600"
              />
              <span>Admin</span>
            </label>
          </div>
        </div>

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
            {loading ? "Đang tạo..." : "Tạo người dùng"}
          </button>
        </div>
      </div>
    </div>
  );
}
