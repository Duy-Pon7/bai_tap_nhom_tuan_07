import type { Metadata } from "next";
import React from "react";
import ListQuestions from "@/components/ecommerce/ListQuestion";

export const metadata: Metadata = {
  title: "Danh sách câu hỏi | SciFun Admin",
  description: "Trang quản lý danh sách các câu hỏi trong hệ thống SciFun.",
};

export default function ListQuestionsPage() {
  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12">
        <ListQuestions />
      </div>
    </div>
  );
}