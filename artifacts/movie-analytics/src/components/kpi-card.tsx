import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CHART_COLORS } from "@/lib/constants";

interface KPICardProps {
  title: string;
  value: string | number;
  loading: boolean;
  color?: string;
}

export function KPICard({ title, value, loading, color = CHART_COLORS.blue }: KPICardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        {loading ? (
          <>
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-32" />
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1 font-mono" style={{ color }}>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
