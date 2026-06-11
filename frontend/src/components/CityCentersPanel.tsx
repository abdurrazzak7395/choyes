import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { fetchCityCenters, type CityCenterEntry } from "@/lib/real-test-centers";

/**
 * Shows the verified REAL test centers (name + ID) for a city, live from the
 * Supabase test_centers DB merged with the verified static list.
 * SVP hides the exact center before booking, so this panel gives the user the
 * real center names operating in the selected city.
 */
export const CityCentersPanel = ({ city }: { city: string }) => {
  const [centers, setCenters] = useState<CityCenterEntry[]>([]);

  useEffect(() => {
    if (!city) {
      setCenters([]);
      return;
    }
    let active = true;
    fetchCityCenters(city).then((list) => {
      if (active) setCenters(list);
    });
    return () => {
      active = false;
    };
  }, [city]);

  if (!city || !centers.length) return null;

  return (
    <div
      data-testid="live-city-centers"
      className="space-y-2 rounded-lg border border-border bg-muted/40 p-4"
    >
      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <MapPin className="h-4 w-4 text-primary" />
        Real Test Centers in {city} ({centers.length})
      </h3>
      <ul className="space-y-1.5">
        {centers.map((c) => (
          <li
            key={`${c.id}-${c.name}`}
            data-testid={`city-center-${c.id}`}
            className="flex items-center justify-between gap-2 rounded-md bg-background px-3 py-1.5 text-sm"
          >
            <span className="font-medium text-foreground">{c.name}</span>
            <span className="shrink-0 rounded bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
              ID #{c.id}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">
        SVP confirms the exact exam center after booking — these are the verified
        centers operating in {city}.
      </p>
    </div>
  );
};
