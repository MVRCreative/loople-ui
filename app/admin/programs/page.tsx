"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader } from "@/components/ui/loader";
import { useAuth } from "@/lib/auth-context";
import { useClub } from "@/lib/club-context";
import { convertAuthUserToUser, createGuestUser } from "@/lib/utils/auth.utils";
import { ProgramsService } from "@/lib/services/programs.service";
import type { ProgramWithMemberCount } from "@/lib/programs/types";
import type { User } from "@/lib/types";
import {
  Search,
  Plus,
  Edit,
  Layers,
  Users,
  DollarSign,
  Filter,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdminProgramsPage() {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const { selectedClub, loading: clubLoading } = useClub();

  const [programs, setPrograms] = useState<ProgramWithMemberCount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const currentUser: User = authUser
    ? convertAuthUserToUser(authUser)
    : createGuestUser();
  const isAdmin = currentUser.isAdmin;

  const loadPrograms = useCallback(async () => {
    if (!selectedClub) return;
    setLoading(true);
    setError(null);
    try {
      const data = await ProgramsService.getPrograms(String(selectedClub.id));
      setPrograms(data);
    } catch (err) {
      console.error("Error loading programs:", err);
      setError(err instanceof Error ? err.message : "Failed to load programs");
    } finally {
      setLoading(false);
    }
  }, [selectedClub]);

  useEffect(() => {
    if (selectedClub && !clubLoading) {
      loadPrograms();
    }
  }, [selectedClub, clubLoading, loadPrograms]);

  const filteredPrograms = programs.filter((p) => {
    if (searchQuery) {
      const term = searchQuery.toLowerCase();
      const searchable = [p.name, p.description ?? "", p.program_type]
        .join(" ")
        .toLowerCase();
      if (!searchable.includes(term)) return false;
    }
    if (statusFilter === "active" && !p.is_active) return false;
    if (statusFilter === "inactive" && p.is_active) return false;
    return true;
  });

  if (clubLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Loader className="mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Loading club...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-destructive">Access Denied</p>
          <p className="text-sm text-muted-foreground mt-2">
            You don&apos;t have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  if (!selectedClub) {
    return (
      <div className="flex-1 space-y-6">
        <h1 className="text-3xl font-bold text-foreground">
          Program Management
        </h1>
        <Card>
          <CardContent className="text-center py-16 px-6">
            <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">
              Select or create a club to manage programs
            </h3>
            <p className="text-muted-foreground mb-6">
              Choose a club from the switcher or create your first club.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild>
                <Link href="/admin/club-management?action=create">
                  Create New Club
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Loader className="mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Loading programs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-destructive">
            Failed to load programs
          </p>
          <p className="text-sm text-muted-foreground mt-2">{error}</p>
          <Button onClick={loadPrograms} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Program Management
            </h1>
            <p className="text-muted-foreground">
              Create and manage programs for your club
            </p>
          </div>
          <Button onClick={() => router.push("/admin/programs/create")}>
            <Plus className="h-4 w-4 mr-1" />
            New Program
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search programs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
              }}
              className="px-3"
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Programs Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">
          Programs ({filteredPrograms.length})
        </h2>

        {filteredPrograms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPrograms.map((program) => (
              <Card
                key={program.id}
                className="overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Program Banner */}
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
                  <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2">
                    <Badge
                      variant={program.is_active ? "default" : "secondary"}
                    >
                      {program.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <Badge variant="outline" className="bg-white/20 text-white border-white/30">
                      {program.program_type}
                    </Badge>
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

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {program.member_count} member
                      {program.member_count !== 1 ? "s" : ""}
                    </span>
                    {program.has_fees && program.registration_fee != null && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3.5 w-3.5" />$
                        {program.registration_fee}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() =>
                        router.push(`/admin/programs/${program.id}`)
                      }
                    >
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() =>
                        router.push(`/admin/programs/${program.id}/edit`)
                      }
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No programs found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your search or filters."
                : "Create your first program to get started."}
            </p>
            <Button onClick={() => router.push("/admin/programs/create")}>
              <Plus className="h-4 w-4 mr-1" />
              Create Program
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
