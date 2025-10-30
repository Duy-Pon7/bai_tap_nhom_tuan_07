import type { Metadata } from "next";
import React from "react";
import ListVideos from "@/components/ecommerce/ListVideos";

export const metadata: Metadata = {
  title: "Danh sách video | SciFun Admin",
  description: "Trang quản lý danh sách các video trong hệ thống SciFun.",
};

export default function ListVideosPage() {
  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12 overflow-x-auto">
        <ListVideos />
      </div>
    </div>
  );
}