import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="ml-[240px] flex-1 min-h-screen">
        <Topbar />
        <div className="p-5 max-w-[1280px]">{children}</div>
      </main>
    </div>
  );
}
