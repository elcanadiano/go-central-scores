import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-6 px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">GoCentralScores</h1>
      <p className="max-w-xl text-muted-foreground">
        Browse song and battle leaderboards from GoCentral with searchable song
        selection, battle dropdowns, and role filters.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link href="/leaderboards/song" className={cn(buttonVariants())}>
          Song leaderboard
        </Link>
        <Link
          href="/leaderboards/battle"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Battle leaderboard
        </Link>
        <Link
          href="/stats"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Stats
        </Link>
      </div>
    </div>
  );
}
