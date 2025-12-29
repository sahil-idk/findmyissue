"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ProposalPage() {
  const [copied, setCopied] = useState(false);

  // Example generated content - in production, this would come from the API
  const generatedContent = `## Past Contributions

I have been actively contributing to open source projects, particularly those participating in Google Summer of Code. Here is a summary of my contributions:

### Organization 1
- **PR #123**: Fixed authentication bug in login flow (Merged)
- **PR #145**: Added unit tests for user service (Merged)
- **Issue #89**: Participated in discussion about API design

### Organization 2
- **PR #56**: Implemented dark mode toggle (Open)
- **Issue #78**: Helped triage and reproduce bug report

### Summary
- **Total PRs**: 3 submitted, 2 merged
- **Organizations contributed to**: 2
- **Technologies used**: TypeScript, React, Python

I have demonstrated my ability to:
1. Understand and navigate complex codebases
2. Write clean, tested code that follows project conventions
3. Communicate effectively with maintainers
4. Persist through code review feedback`;

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Proposal Builder</h2>
        <p className="text-muted-foreground">
          Generate content for your GSoC proposal based on your contributions
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate Proposal Content</CardTitle>
          <CardDescription>
            Automatically create the &ldquo;Past Contributions&rdquo; section for your GSoC
            proposal
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button>Generate from My Contributions</Button>
            <Button variant="outline">Customize Output</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Preview</CardTitle>
            <CardDescription>
              Copy this content into your GSoC proposal
            </CardDescription>
          </div>
          <Button onClick={handleCopy} variant="outline">
            {copied ? "Copied!" : "Copy to Clipboard"}
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="preview">
            <TabsList>
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="markdown">Markdown</TabsTrigger>
            </TabsList>
            <TabsContent value="preview" className="mt-4">
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <div className="rounded-lg bg-muted p-4">
                  <h3 className="mt-0 text-lg font-semibold">Past Contributions</h3>
                  <p className="text-sm text-muted-foreground">
                    I have been actively contributing to open source projects,
                    particularly those participating in Google Summer of Code.
                    Here is a summary of my contributions:
                  </p>
                  <h4 className="mt-4 font-medium">Organization 1</h4>
                  <ul className="text-sm">
                    <li>
                      <strong>PR #123</strong>: Fixed authentication bug in login
                      flow (Merged)
                    </li>
                    <li>
                      <strong>PR #145</strong>: Added unit tests for user service
                      (Merged)
                    </li>
                    <li>
                      <strong>Issue #89</strong>: Participated in discussion about
                      API design
                    </li>
                  </ul>
                  <h4 className="mt-4 font-medium">Summary</h4>
                  <ul className="text-sm">
                    <li>Total PRs: 3 submitted, 2 merged</li>
                    <li>Organizations contributed to: 2</li>
                    <li>Technologies used: TypeScript, React, Python</li>
                  </ul>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="markdown" className="mt-4">
              <pre className="overflow-auto rounded-lg bg-muted p-4 text-sm">
                {generatedContent}
              </pre>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tips for a Strong Proposal</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span>
                Show consistent engagement over time, not just a burst of
                activity
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span>
                Highlight merged PRs - they prove you can complete work
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span>
                Mention meaningful interactions with maintainers
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span>
                Link to specific PRs and issues so mentors can verify
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span>
                Focus on quality over quantity - one meaningful contribution
                beats ten trivial ones
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
