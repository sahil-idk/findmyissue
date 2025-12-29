import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users, bookmarks, contributions } from "@/db/schema";
import { eq, count } from "drizzle-orm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

async function getUserStats(userId: number) {
  const [bookmarkCount, contributionCount, mergedCount] = await Promise.all([
    db
      .select({ count: count() })
      .from(bookmarks)
      .where(eq(bookmarks.userId, userId)),
    db
      .select({ count: count() })
      .from(contributions)
      .where(eq(contributions.userId, userId)),
    db
      .select({ count: count() })
      .from(contributions)
      .where(eq(contributions.userId, userId)),
  ]);

  return {
    bookmarks: bookmarkCount[0]?.count || 0,
    contributions: contributionCount[0]?.count || 0,
    merged: mergedCount[0]?.count || 0,
  };
}

export default async function DashboardPage() {
  const session = await auth();

  const sessionWithId = session as unknown as { githubId?: number };
  const githubId = sessionWithId?.githubId;
  if (!githubId) {
    return null;
  }

  // Get user from database
  const dbUser = await db.query.users.findFirst({
    where: eq(users.githubId, githubId),
  });

  const stats = dbUser
    ? await getUserStats(dbUser.id)
    : { bookmarks: 0, contributions: 0, merged: 0 };

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Bookmarked Issues</CardDescription>
            <CardTitle className="text-4xl">{stats.bookmarks}</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/bookmarks">
              <Button variant="link" className="px-0">
                View all bookmarks
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Contributions</CardDescription>
            <CardTitle className="text-4xl">{stats.contributions}</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/contributions">
              <Button variant="link" className="px-0">
                View contributions
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>PRs Merged</CardDescription>
            <CardTitle className="text-4xl">{stats.merged}</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-sm text-muted-foreground">
              Great progress!
            </span>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks to help you on your GSoC journey
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/issues?hasBeginnerLabel=true&maxJamFactor=2">
              <Button variant="outline" className="w-full justify-start">
                Find Low-Competition Beginner Issues
              </Button>
            </Link>
            <Link href="/organizations">
              <Button variant="outline" className="w-full justify-start">
                Browse GSoC Organizations
              </Button>
            </Link>
            <Link href="/dashboard/proposal">
              <Button variant="outline" className="w-full justify-start">
                Generate Proposal Content
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>
              Tips for a successful GSoC application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-1 text-green-600">1.</span>
                Find organizations that match your skills and interests
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-green-600">2.</span>
                Look for issues with low jam factor (less competition)
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-green-600">3.</span>
                Start with small contributions to build rapport
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-green-600">4.</span>
                Track your progress and generate your proposal
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
