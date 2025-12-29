import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { cn } from "@/lib/utils";

const dashboardLinks = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/bookmarks", label: "Bookmarks" },
  { href: "/dashboard/contributions", label: "Contributions" },
  { href: "/dashboard/proposal", label: "Proposal Builder" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {session.user?.name || (session.user as { username?: string })?.username || "User"}!
        </p>
      </div>

      <div className="flex gap-8">
        <aside className="w-48 shrink-0">
          <nav className="flex flex-col gap-1">
            {dashboardLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
