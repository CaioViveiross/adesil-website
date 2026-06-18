import AdminLayout from "@/components/admin/AdminLayout";
import { Loader2 } from "lucide-react";

/** Full-page loader — use as early return while fetching initial data. */
export function AdminPageLoader() {
  return (
    <AdminLayout>
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    </AdminLayout>
  );
}

/** Inline loader — use inside a card/section while refreshing content. */
export function AdminContentLoader() {
  return (
    <div className="flex justify-center py-12">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}
