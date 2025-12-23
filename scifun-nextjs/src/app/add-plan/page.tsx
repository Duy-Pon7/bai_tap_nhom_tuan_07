import AdminLayout from "@/app/(admin)/layout";
import UpdatePlanPage from "@/app/(admin)/(others-pages)/(forms)/update-plan/[id]/page";

export default function AddPlanPage() {
  // Render the plan form inside the admin dashboard layout so it appears within the sidebar/header
  return (
    <AdminLayout>
      <UpdatePlanPage />
    </AdminLayout>
  );
}
