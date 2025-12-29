import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users, bookmarks, issues, repositories, organizations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IssueCard } from "@/components/issues/issue-card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

async function getUserBookmarks(userId: number) {
  const bookmarksList = await db
    .select({
      bookmark: bookmarks,
      issue: issues,
      repository: repositories,
      organization: organizations,
    })
    .from(bookmarks)
    .leftJoin(issues, eq(bookmarks.issueId, issues.id))
    .leftJoin(repositories, eq(issues.repositoryId, repositories.id))
    .leftJoin(organizations, eq(repositories.organizationId, organizations.id))
    .where(eq(bookmarks.userId, userId));

  return bookmarksList;
}

export default async function BookmarksPage() {
  const session = await auth();

  const sessionWithId = session as unknown as { githubId?: number };
  const githubId = sessionWithId?.githubId;
  if (!githubId) {
    return null;
  }

  const dbUser = await db.query.users.findFirst({
    where: eq(users.githubId, githubId),
  });

  if (!dbUser) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">User not found</p>
        </CardContent>
      </Card>
    );
  }

  const bookmarksList = await getUserBookmarks(dbUser.id);

  if (bookmarksList.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bookmarks</CardTitle>
          <CardDescription>
            Issues you&apos;ve saved for later
          </CardDescription>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <p className="mb-4 text-muted-foreground">
            You haven&apos;t bookmarked any issues yet.
          </p>
          <Link href="/issues">
            <Button>Find Issues to Bookmark</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Bookmarks</h2>
        <p className="text-muted-foreground">
          {bookmarksList.length} issue{bookmarksList.length !== 1 ? "s" : ""}{" "}
          saved
        </p>
      </div>

      <div className="space-y-4">
        {bookmarksList.map(({ bookmark, issue, repository, organization }) => {
          if (!issue) return null;
          return (
            <div key={bookmark.id} className="relative">
              <IssueCard
                issue={issue}
                repository={repository}
                organization={organization}
              />
              {bookmark.notes && (
                <div className="mt-2 rounded-md bg-muted p-3 text-sm">
                  <span className="font-medium">Notes:</span> {bookmark.notes}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
