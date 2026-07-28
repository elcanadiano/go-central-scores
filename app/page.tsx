import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-6 px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">GoCentralScores</h1>
      <p className="max-w-xl text-muted-foreground">
        Browse song leaderboards from GoCentral with searchable song selection
        and role filters.
      </p>
      <div>
        <Link
          href="/leaderboards/song"
          className={cn(buttonVariants())}
        >
          Song leaderboard
        </Link>
      </div>
    </div>
  );
}
