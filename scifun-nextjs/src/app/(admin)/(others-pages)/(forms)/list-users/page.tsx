import type { Metadata } from "next";
import React from "react";
import ListUsers from "@/components/ecommerce/ListUser";

export const metadata: Metadata = {
  title: "Danh sách người dùng | SciFun Admin",
  description: "Trang quản lý danh sách người dùng trong hệ thống SciFun.",
};

export default function ListUsersPage() {
  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12">
        <ListUsers />
      </div>
    </div>
  );
}