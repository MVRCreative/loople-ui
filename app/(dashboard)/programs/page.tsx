"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useClub } from "@/lib/club-context";
import { useClubPrograms } from "@/lib/programs/hooks";
import { ProgramCard } from "@/components/programs/program-card";
import { Search, Layers } from "lucide-react";

export default function ProgramsPage() {
  const { clubs, selectedClub, loading: clubLoading } = useClub();
  const { programs, loading, error } = useClubPrograms();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPrograms = useMemo(() => {
    if (!searchQuery) return programs.filter((p) => p.is_active);
    const term = searchQuery.toLowerCase();
    return programs
      .filter((p) => p.is_active)
      .filter((p) => {
        const searchable = [p.name, p.description ?? "", p.program_type]
          .join(" ")
          .toLowerCase();
        return searchable.includes(term);
      });
  }, [programs, searchQuery]);

  const hasClub = clubs.length > 0 && !clubLoading;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[200px]">
        <p className="text-muted-foreground">Loading programs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[200px]">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (!hasClub) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 pt-6">
        <h1 className="text-3xl font-bold text-foreground mb-4">Programs</h1>
        <Card>
          <CardContent className="text-center py-16 px-6">
            <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">
              Join a club to see programs
            </h3>
            <p className="text-muted-foreground mb-6">
              Programs are available through clubs. Create or join a club to get
              started.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild>
                <Link href="/admin/club-management?action=create">
                  Create New Club
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/admin/club-management">Go to Club Management</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Programs</h1>
        <p className="text-muted-foreground">
          {selectedClub
            ? `Browse and join programs in ${selectedClub.name}`
            : "Browse and join club programs"}
        </p>
      </div>

      {/* Search */}
      {programs.length > 0 && (
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search programs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      {/* Programs Grid */}
      {filteredPrograms.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrograms.map((program) => (
            <ProgramCard key={program.id} program={program} />
          ))}
        </div>
      ) : programs.length > 0 && searchQuery ? (
        <div className="text-center py-12">
          <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No programs match your search</h3>
          <p className="text-muted-foreground">
            Try adjusting your search terms.
          </p>
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-16 px-6">
            <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No programs yet</h3>
            <p className="text-muted-foreground">
              Programs will appear here when your club creates them. Check back
              soon!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
