import type { Metadata } from "next";
import React from "react";
import ListTopics from "@/components/ecommerce/ListTopics";

export const metadata: Metadata = {
  title: "Danh sách topics | SciFun Admin",
  description: "Trang quản lý danh sách các topics trong hệ thống SciFun.",
};

export default function ListTopicsPage() {
  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12">
        <ListTopics />
      </div>
    </div>
  );
}