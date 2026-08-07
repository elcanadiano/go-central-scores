"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROLES, roleLabel, type RoleId } from "@/lib/gocentral/roles";

type RoleSelectProps = {
  value: RoleId;
  onChange: (roleId: RoleId) => void;
  disabled?: boolean;
};

export function RoleSelect({ value, onChange, disabled }: RoleSelectProps) {
  return (
    <div className="w-full max-w-xs">
      <label className="mb-1.5 block text-sm font-medium text-foreground">
        Role
      </label>
      <Select
        value={String(value)}
        disabled={disabled}
        onValueChange={(next) => {
          if (next == null) return;
          onChange(Number(next) as RoleId);
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue>
            {(selected) =>
              selected != null ? roleLabel(Number(selected)) : null
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {ROLES.map((role) => (
            <SelectItem key={role.id} value={String(role.id)}>
              {role.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
