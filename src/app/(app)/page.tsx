import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">nexo</h1>
        <p className="max-w-sm text-sm leading-6 text-muted-foreground">
          Foundation in place. A calm, local-first, AI-powered workspace is
          being built here.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button>Button</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
      </div>
    </main>
  );
}
