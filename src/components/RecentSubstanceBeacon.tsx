"use client";

import { useEffect, useMemo } from "react";
import { pushRecentSubstanceId } from "@/lib/recentSubstances";
import { recordCooccur } from "@/lib/sessionCooccur";

/** Records substance view into recent + session co-occur (client-only). */
export function RecentSubstanceBeacon({
  substanceId,
  relatedIds = [],
}: {
  substanceId: string;
  relatedIds?: string[];
}) {
  const relatedKey = useMemo(() => relatedIds.join(","), [relatedIds]);

  useEffect(() => {
    pushRecentSubstanceId(substanceId);
    recordCooccur(
      substanceId,
      relatedKey ? relatedKey.split(",").filter(Boolean) : []
    );
  }, [substanceId, relatedKey]);
  return null;
}
