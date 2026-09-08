"use client";

import { useEffect, useMemo } from "react";
import { pushRecentSubstanceId } from "@/lib/recentSubstances";
import { recordCooccur } from "@/lib/sessionCooccur";
import { logSearchClick } from "@/components/SearchLogBeacon";

/** Records substance view into recent + session co-occur + server click log. */
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
    logSearchClick({ entityId: substanceId, kind: "substance" });
  }, [substanceId, relatedKey]);
  return null;
}
