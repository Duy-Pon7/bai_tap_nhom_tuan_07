import React from "react";
import ListPlans from "@/components/ecommerce/ListPlans";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Plans | Admin",
  description: "Danh sách các gói (plans)",
};

export default function PlansPage() {
  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12 space-y-6 xl:col-span-12">
        <ListPlans />
      </div>
    </div>
  );
}
