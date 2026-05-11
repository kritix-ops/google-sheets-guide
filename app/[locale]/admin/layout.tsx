import { AdminNav } from "@/components/admin/admin-nav";
import { TopBar } from "@/components/top-bar";
import { Toaster } from "@/components/ui/sonner";
import { requireRole } from "@/lib/auth/require-role";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Floor: anyone below editor cannot see admin at all. Per the Next.js
  // authentication guide layouts don't re-render on every navigation, so
  // each admin page also calls requireRole at its top — this is best-effort
  // first-render protection on top of the per-page check.
  const user = await requireRole("editor");
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <TopBar />
      <AdminNav role={user.role} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        {children}
      </main>
      <Toaster richColors closeButton position="bottom-right" />
    </div>
  );
}
