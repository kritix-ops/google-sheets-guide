import { Sidebar } from "@/components/sidebar";
import { TopBar } from "@/components/top-bar";
import { Toaster } from "@/components/ui/sonner";
import { listLessonsByTrack } from "@/lib/content/registry";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const tracks = listLessonsByTrack();
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <TopBar />
      <div className="flex flex-1">
        <Sidebar tracks={tracks} />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
      <Toaster richColors closeButton position="bottom-right" />
    </div>
  );
}
