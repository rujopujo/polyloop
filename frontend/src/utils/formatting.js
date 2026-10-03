/**
 * Formatting helpers for masses, temperatures, and dates.
 */

export function formatKg(val) {
  if (val === undefined || val === null) return "0.00 kg";
  return `${Number(val).toFixed(2)} kg`;
}

export function formatCO2(val) {
  if (val === undefined || val === null) return "0.0 kg CO₂e";
  return `+${Number(val).toFixed(1)} kg CO₂e`;
}

export function formatPercent(val) {
  if (val === undefined || val === null) return "0.0%";
  return `${Number(val).toFixed(1)}%`;
}

export function formatDateTime(isoStr) {
  if (!isoStr) return "Just now";
  try {
    const d = new Date(isoStr);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoStr;
  }
}

export function getTierColor(tier) {
  switch (tier?.toUpperCase()) {
    case "CRITICAL":
      return {
        bg: "bg-red-500/10",
        border: "border-red-500/30",
        text: "text-red-400",
        badge: "bg-red-500/20 text-red-300 border-red-500/40",
      };
    case "HIGH":
      return {
        bg: "bg-amber-500/10",
        border: "border-amber-500/30",
        text: "text-amber-400",
        badge: "bg-amber-500/20 text-amber-300 border-amber-500/40",
      };
    case "MODERATE":
      return {
        bg: "bg-yellow-500/10",
        border: "border-yellow-500/30",
        text: "text-yellow-400",
        badge: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
      };
    case "LOW":
      return {
        bg: "bg-cyan-500/10",
        border: "border-cyan-500/30",
        text: "text-cyan-400",
        badge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
      };
    default:
      return {
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/30",
        text: "text-emerald-400",
        badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
      };
  }
}
