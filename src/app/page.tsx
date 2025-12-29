import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="container flex flex-col items-center justify-center gap-4 py-24 md:py-32">
        <h1 className="text-center text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
          Find Your Perfect
          <br />
          <span className="text-primary">GSoC Opportunity</span>
        </h1>
        <p className="max-w-[600px] text-center text-lg text-muted-foreground md:text-xl">
          Discover uncrowded issues, beginner-friendly organizations, and build
          a winning Google Summer of Code proposal.
        </p>
        <div className="flex gap-4">
          <Link href="/issues">
            <Button size="lg">Find Issues</Button>
          </Link>
          <Link href="/organizations">
            <Button size="lg" variant="outline">
              Browse Organizations
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-16">
        <h2 className="mb-12 text-center text-3xl font-bold">
          Why Use GSoC Finder?
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🎯</span> Smart Issue Discovery
              </CardTitle>
              <CardDescription>
                Find issues that match your skills across 200+ GSoC organizations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                We scrape and analyze thousands of issues to find
                good-first-issues, help-wanted, and beginner-friendly tasks
                perfect for GSoC contributors.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">📊</span> Jam Factor Analysis
              </CardTitle>
              <CardDescription>
                Know how crowded each issue is before you start
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Our unique &ldquo;Jam Factor&rdquo; score analyzes comments to count how
                many people are competing for each issue. Find low-competition
                opportunities!
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">⭐</span> Opportunity Scoring
              </CardTitle>
              <CardDescription>
                AI-powered scoring to find the best opportunities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                We score issues based on jam factor, freshness, org longevity,
                maintainer responsiveness, and more to surface the best
                opportunities.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🏆</span> Organization Insights
              </CardTitle>
              <CardDescription>
                Deep dive into GSoC organizations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                See which orgs are beginner-friendly, how long they&apos;ve been in
                GSoC, their tech stack, and average maintainer response times.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">📝</span> Contribution Tracker
              </CardTitle>
              <CardDescription>
                Track your journey to GSoC
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Bookmark issues, track your PRs, and see your contribution
                timeline. Build a compelling history for your GSoC application.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">📄</span> Proposal Builder
              </CardTitle>
              <CardDescription>
                Auto-generate your past contributions section
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Export your contribution history in markdown format, ready to
                paste into your GSoC proposal. Show mentors your dedication!
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-16">
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <h2 className="text-center text-2xl font-bold md:text-3xl">
              Ready to Start Your GSoC Journey?
            </h2>
            <p className="max-w-[500px] text-center text-primary-foreground/80">
              Sign in with GitHub to track your contributions and build your
              winning proposal.
            </p>
            <Link href="/issues">
              <Button size="lg" variant="secondary">
                Get Started Free
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* Stats Section */}
      <section className="container py-16">
        <div className="grid gap-8 text-center md:grid-cols-4">
          <div>
            <p className="text-4xl font-bold">200+</p>
            <p className="text-muted-foreground">GSoC Organizations</p>
          </div>
          <div>
            <p className="text-4xl font-bold">10,000+</p>
            <p className="text-muted-foreground">Open Issues</p>
          </div>
          <div>
            <p className="text-4xl font-bold">50+</p>
            <p className="text-muted-foreground">Technologies</p>
          </div>
          <div>
            <p className="text-4xl font-bold">Free</p>
            <p className="text-muted-foreground">Forever</p>
          </div>
        </div>
      </section>
    </div>
  );
}
