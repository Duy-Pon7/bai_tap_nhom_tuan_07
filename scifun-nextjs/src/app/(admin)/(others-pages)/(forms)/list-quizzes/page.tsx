import type { Metadata } from "next";
import React from "react";
import ListQuizzes from "@/components/ecommerce/ListQuizzes";

export const metadata: Metadata = {
  title: "Danh sách quiz | SciFun Admin",
  description: "Trang quản lý danh sách các quiz trong hệ thống SciFun.",
};

export default function ListQuizzesPage() {
  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12">
        <ListQuizzes />
      </div>
    </div>
  );
}