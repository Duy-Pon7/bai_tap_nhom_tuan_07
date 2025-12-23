"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Input from "@/components/form/input/InputField";
import { getPlanById, updatePlan, createPlan, deletePlan, Plan } from "@/services/planService";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function UpdatePlanPage() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const router = useRouter();

  const [plan, setPlan] = useState<Plan | null>(() => (id ? null : { name: "", price: 0, durationDays: 30 }));
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [errors, setErrors] = useState<{ name: string; price: string; durationDays: string }>({
    name: "",
    price: "",
    durationDays: "",
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!id) return;
    const fetchPlan = async () => {
      setLoading(true);
      try {
        const p = await getPlanById(id);
        setPlan(p);
      } catch (err) {
        console.error("Failed to fetch plan:", err);
        toast.error("Không thể tải plan");
      } finally {
        setLoading(false);
      }
    };
    fetchPlan();
  }, [id]);

  const handleChange = (field: keyof Plan, value: any) => {
    setPlan((prev) => (prev ? { ...prev, [field]: value } : prev));

    // Clear field error when user changes the field
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async () => {
    if (!plan) return;

    // Validation
    const newErrors = {
      name: plan.name ? "" : "Tên gói là bắt buộc.",
      price: plan.price > 0 ? "" : "Giá phải lớn hơn 0.",
      durationDays: plan.durationDays > 0 ? "" : "Số ngày phải lớn hơn 0.",
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some((e) => e !== "")) {
      setMessage("Vui lòng điền đầy đủ thông tin!");
      toast.warn("⚠️ Vui lòng điền đầy đủ thông tin!");
      return;
    }

    setSubmitting(true);
    try {
      if (id) {
        const updated = await updatePlan(id, {
          name: plan.name,
          price: plan.price,
          durationDays: plan.durationDays,
        });
        setPlan(updated);
        toast.success("Cập nhật plan thành công");
      } else {
        const created = await createPlan({
          name: plan.name,
          price: plan.price,
          durationDays: plan.durationDays,
        });
        setPlan(created);
        toast.success("Tạo plan thành công");
      }
      // Redirect to plans list after successful create or update
      router.push("/plans");
    } catch (err: any) {
      console.error("Save failed:", err);
      const message = err?.message || "Lưu thất bại, vui lòng thử lại.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    const confirmDelete = window.confirm("Bạn có chắc chắn muốn xóa gói này?");
    if (!confirmDelete) return;

    setSubmitting(true);
    try {
      await deletePlan(id);
      toast.success("Đã xóa plan");
      router.push("/plans");
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Xóa thất bại hoặc API chưa sẵn sàng");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        style={{ zIndex: 999999 }}
      />

      <PageBreadcrumb pageTitle={id ? "Cập nhật Plan" : "Tạo Plan"} />

      <div className="max-w-3xl mx-auto mt-6 space-y-6">
        {loading ? (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <p>Đang tải dữ liệu plan...</p>
          </div>
        ) : id && !plan ? (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <p>Không tìm thấy plan.</p>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            {/* Tên gói */}
            <div>
              <h3 className="text-lg font-semibold mb-2">
                Tên gói <span className="text-red-500">*</span>
              </h3>
              <Input
                type="text"
                value={plan?.name ?? ""}
                placeholder="Nhập tên gói, ví dụ: Basic"
                onChange={(e) => handleChange("name", e.target.value)}
                error={!!errors.name}
                hint={errors.name}
              />
            </div>

            {/* Giá */}
            <div>
              <h3 className="text-lg font-semibold mb-2 mt-4">
                Giá (VND) <span className="text-red-500">*</span>
              </h3>
              <Input
                type="number"
                value={plan?.price ?? 0}
                placeholder="Ví dụ: 100000"
                onChange={(e) => handleChange("price", Number(e.target.value))}
                error={!!errors.price}
                hint={errors.price}
              />
            </div>

            {/* Số ngày */}
            <div>
              <h3 className="text-lg font-semibold mb-2 mt-4">
                Số ngày <span className="text-red-500">*</span>
              </h3>
              <Input
                type="number"
                value={plan?.durationDays ?? 0}
                placeholder="Ví dụ: 30"
                onChange={(e) => handleChange("durationDays", Number(e.target.value))}
                error={!!errors.durationDays}
                hint={errors.durationDays}
              />
            </div>

            {/* Thông báo */}
            {message && (
              <p className="text-sm mt-2 text-center text-gray-700">{message}</p>
            )}

            {/* Buttons */}
            <div className="pt-4 text-center">
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting && (
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
                  {submitting ? (id ? "Đang cập nhật..." : "Đang tạo...") : id ? "Cập nhật" : "Tạo gói"}
                </button>

                {id && (
                  <button
                    onClick={handleDelete}
                    disabled={submitting}
                    className="px-6 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
                  >
                    {submitting ? "Đang xóa..." : "Xóa"}
                  </button>
                )}

                <button
                  onClick={() => router.push("/plans")}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  Quay lại
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
