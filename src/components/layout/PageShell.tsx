import { Navbar } from "@/components/Navbar";
import { OrionBackground } from "@/components/visual/OrionBackground";

export function PageShell({
  children,
  className = "",
  containerClassName = "container",
}: {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
}) {
  return (
    <div className={"min-h-screen bg-background text-foreground relative " + className}>
      <OrionBackground />
      <Navbar />
      <main className="relative pt-24 pb-16 px-4">
        <div className={containerClassName}>{children}</div>
      </main>
    </div>
  );
}
