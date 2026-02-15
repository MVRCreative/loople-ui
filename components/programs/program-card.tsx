"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, DollarSign, Lock, Globe, Eye } from "lucide-react";
import type { ProgramWithMemberCount } from "@/lib/programs/types";

interface ProgramCardProps {
  program: ProgramWithMemberCount;
}

/**
 * ProgramCard
 *
 * Purpose: Display a program in list/grid views for member-facing pages.
 * Accessibility: Card is a clickable link; inner badges are decorative.
 * Variants: none (single display pattern).
 * Usage: <ProgramCard program={program} />
 */
export function ProgramCard({ program }: ProgramCardProps) {
  const isFree = !program.has_fees || !program.registration_fee;

  return (
    <Link
      href={`/programs/${program.id}`}
      className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
    >
      <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
        {/* Banner */}
        <div
          className="h-36 bg-gradient-to-br from-primary/20 to-primary/40 relative"
          style={
            program.image_url
              ? {
                  backgroundImage: `url(${program.image_url})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : undefined
          }
        >
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="bg-white/20 text-white border-white/30 capitalize">
              {program.program_type}
            </Badge>
            {program.visibility !== "public" && (
              <Badge variant="outline" className="bg-white/20 text-white border-white/30">
                {program.visibility === "members_only" ? (
                  <Eye className="h-3 w-3 mr-1" />
                ) : (
                  <Lock className="h-3 w-3 mr-1" />
                )}
                {program.visibility === "members_only"
                  ? "Members Only"
                  : "Private"}
              </Badge>
            )}
          </div>
        </div>

        <CardContent className="p-4">
          <h3 className="font-semibold text-lg mb-1 line-clamp-1">
            {program.name}
          </h3>
          {program.description && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {program.description}
            </p>
          )}

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {program.member_count} member
              {program.member_count !== 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1">
              {isFree ? (
                <>
                  <Globe className="h-3.5 w-3.5" />
                  Free
                </>
              ) : (
                <>
                  <DollarSign className="h-3.5 w-3.5" />${program.registration_fee}
                </>
              )}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
