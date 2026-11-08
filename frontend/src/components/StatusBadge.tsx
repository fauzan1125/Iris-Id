import React from "react";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getBadgeConfig = () => {
    switch (status) {
      case "ON_TIME":
        return {
          label: "Tepat Waktu",
          classes: "bg-emerald-50 text-emerald-700 border-emerald-200",
        };
      case "LATE":
        return {
          label: "Terlambat",
          classes: "bg-amber-50 text-amber-700 border-amber-200",
        };
      case "EARLY_LEAVE":
        return {
          label: "Pulang Cepat",
          classes: "bg-sky-50 text-sky-700 border-sky-200",
        };
      case "OUT_OF_RANGE":
        return {
          label: "Luar Jangkauan Lokasi",
          classes: "bg-rose-50 text-rose-700 border-rose-200",
        };
      default:
        return {
          label: status,
          classes: "bg-slate-100 text-slate-700 border-slate-200",
        };
    }
  };

  const { label, classes } = getBadgeConfig();

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border",
        classes,
        className
      )}
    >
      {label}
    </span>
  );
}
