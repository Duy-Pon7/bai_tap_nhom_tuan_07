"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getPlans, Plan } from "@/services/planService";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function ListPlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const data = await getPlans();
      setPlans(data);
    } catch (err) {
      console.error("Failed to load plans:", err);
      toast.error("Không thể tải plans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        style={{ zIndex: 999999 }}
      />

      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Danh sách Plans
        </h3>

        <button
          onClick={fetchPlans}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-theme-xs hover:bg-gray-50"
        >
          Làm mới
        </button>
      </div>

      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-y border-gray-100 dark:border-gray-800">
            <TableRow>
              <TableCell
                isHeader
                className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
              >
                Tên gói
              </TableCell>
              <TableCell
                isHeader
                className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
              >
                Giá
              </TableCell>
              <TableCell
                isHeader
                className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
              >
                Số ngày
              </TableCell>
              <TableCell
                isHeader
                className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
              >
                Tạo lúc
              </TableCell>
              <TableCell
                isHeader
                className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
              >
                Actions
              </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-6 text-center">
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : plans.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-6 text-center">
                  Không có plans
                </TableCell>
              </TableRow>
            ) : (
              plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="py-3">{plan.name}</TableCell>
                  <TableCell className="py-3">
                    {plan.price.toLocaleString("vi-VN")} đ
                  </TableCell>
                  <TableCell className="py-3">
                    {plan.durationDays} ngày
                  </TableCell>
                  <TableCell className="py-3">
                    {plan.createdAt
                      ? new Date(plan.createdAt).toLocaleString()
                      : "-"}
                  </TableCell>
                  <TableCell className="py-3">
                    <Link
                      href={`/update-plan/${plan.id}`}
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1 text-sm text-gray-700 shadow-theme-xs hover:bg-gray-50"
                    >
                      Cập nhật
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
