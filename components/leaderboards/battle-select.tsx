"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BattleInfo } from "@/lib/gocentral/types";

type BattleSelectProps = {
  battles: BattleInfo[];
  value: number | null;
  onChange: (battle: BattleInfo) => void;
};

export function BattleSelect({ battles, value, onChange }: BattleSelectProps) {
  return (
    <div className="w-full max-w-md">
      <label className="mb-1.5 block text-sm font-medium text-foreground">
        Battle
      </label>
      <Select
        value={value != null ? String(value) : null}
        onValueChange={(next) => {
          if (next == null) return;
          const battleId = Number(next);
          const battle = battles.find((b) => b.battle_id === battleId);
          if (battle) onChange(battle);
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a battle">
            {(selected) => {
              if (selected == null) return null;
              const battle = battles.find(
                (b) => b.battle_id === Number(selected),
              );
              return battle?.title ?? selected;
            }}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {battles.map((battle) => (
            <SelectItem key={battle.battle_id} value={String(battle.battle_id)}>
              {battle.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
