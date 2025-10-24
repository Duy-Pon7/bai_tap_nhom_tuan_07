import type { Metadata } from "next";
import React from "react";
import RecentOrders from "@/components/ecommerce/RecentOrders";

export const metadata: Metadata = {
  title: "Danh sách môn học | SciFun Admin",
  description: "Trang quản lý danh sách các môn học trong hệ thống SciFun.",
};

export default function ListSubjectsPage() {
  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12">
        <RecentOrders />
      </div>
    </div>
  );
}