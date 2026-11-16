import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { AdminShell } from "@/components/admin/admin-shell";

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/admin/login");
  }

  return (
    <AdminShell
      userName={session.user.name ?? "Administrador"}
      restaurantSlug={session.user.restaurantSlug ?? "brasa-viva"}
    >
      {children}
    </AdminShell>
  );
}
