"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useClub } from "@/lib/club-context";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Plus,
  AlertCircle,
  Building2,
  Pencil,
  Trash2,
  Search,
} from "lucide-react";
import { CreateClubForm } from "@/components/club-management/create-club-form";
import { EditClubForm } from "@/components/club-management/edit-club-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ClubsService, Club } from "@/lib/services/clubs.service";

export default function ClubManagementPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { selectedClub, clubs, loading: clubLoading, isOwner, isAdmin, error: clubError, refreshClubs } = useClub();
  const router = useRouter();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState<Club | null>(null);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const enableDelete = false; // TEMP: hide delete feature

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, authLoading, router]);

  const filteredClubs: Club[] = Array.isArray(clubs)
    ? clubs.filter(c =>
        `${c.name} ${c.subdomain} ${c.city ?? ''} ${c.state ?? ''}`
          .toLowerCase()
          .includes(search.toLowerCase())
      )
    : [];

  if (authLoading || clubLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  if (!selectedClub) {
    // Check if user has no clubs at all
    const hasNoClubs = !Array.isArray(clubs) || clubs.length === 0;
    
    if (hasNoClubs) {
      return (
        <div className="p-8">
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-2 text-foreground">Welcome to Club Management</h1>
              <p className="text-muted-foreground mb-8">
                You don&apos;t have any clubs yet. Create your first club to get started with managing members, events, and more.
              </p>
            </div>
            
            {showCreateForm ? (
              <CreateClubForm 
                onSuccess={() => {
                  setShowCreateForm(false);
                  refreshClubs();
                }}
                onCancel={() => setShowCreateForm(false)}
              />
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
                  <h2 className="text-xl font-semibold mb-2 text-foreground">Create Your First Club</h2>
                  <p className="text-muted-foreground text-center mb-6">
                    Start by creating a club to manage your swimming community.
                  </p>
                  <div className="flex gap-3">
                    <Button onClick={() => setShowCreateForm(true)} size="lg">
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Club
                    </Button>
                    <Button variant="outline" onClick={() => router.push("/")}>
                      Go to Dashboard
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      );
    }
    
    // User has clubs but none selected
    return (
      <div className="p-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-foreground">No Club Selected</h2>
            <p className="text-muted-foreground text-center mb-4">
              Please select a club from the club switcher to manage.
            </p>
            <div className="flex gap-3">
              <Button onClick={() => router.push("/")}>
                Go to Dashboard
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create New Club
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (clubError) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-foreground">Error Loading Club</h2>
            <p className="text-muted-foreground text-center mb-4">
              {clubError}
            </p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if user has permission to manage any clubs (owner/admin of selected club governs create access)
  const canManage = isOwner || isAdmin;

  return (
    <div className="space-y-6 -m-6 p-6">
      {/* Header / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Clubs</h1>
          <p className="text-muted-foreground mt-1 text-sm lg:text-base">Create, update, and manage clubs</p>
        </div>
        {canManage && (
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" /> New Club
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search clubs..." className="pl-10" />
        </div>
      </div>

      {/* Clubs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClubs.map((c) => (
          <Card key={c.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{c.name}</CardTitle>
                <span className="text-xs text-muted-foreground">{c.subdomain}</span>
              </div>
              <CardDescription>{c.city}{c.state ? `, ${c.state}` : ''}</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground truncate max-w-[70%]">{c.description}</div>
              {canManage && (
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setShowEditForm(c)}>
                    <Pencil className="h-4 w-4 mr-1" /> Edit
                  </Button>
                  {enableDelete && (
                    <Button variant="destructive" size="sm" onClick={(e) => { e.preventDefault(); setDeletingId(c.id); }} disabled={deletingId === c.id}>
                      <Trash2 className="h-4 w-4 mr-1" /> Delete
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Club Dialog */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Club</DialogTitle>
          </DialogHeader>
          <CreateClubForm 
            onSuccess={() => {
              setShowCreateForm(false);
              refreshClubs();
            }}
            onCancel={() => setShowCreateForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog (hidden while enableDelete is false) */}
      {enableDelete && (
        <Dialog open={!!deletingId} onOpenChange={(open) => { if (!open) setDeletingId(null); }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Delete Club</DialogTitle>
            </DialogHeader>
            <div className="text-sm text-muted-foreground">
              Are you sure you want to delete this club? This action cannot be undone.
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setDeletingId(null)}>Cancel</Button>
              <Button variant="destructive" onClick={async () => {
                if (!deletingId) return;
                try {
                  await ClubsService.deleteClub(deletingId);
                  await refreshClubs();
                } finally {
                  setDeletingId(null);
                }
              }}>Delete</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Club Dialog */}
      <Dialog open={!!showEditForm} onOpenChange={(open) => { if (!open) setShowEditForm(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Club</DialogTitle>
          </DialogHeader>
          {showEditForm && (
            <EditClubForm
              club={showEditForm}
              onSuccess={async () => {
                setShowEditForm(null);
                await refreshClubs();
              }}
              onCancel={() => setShowEditForm(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Member/event/registration functionality moved to dedicated admin pages */}
    </div>
  );
}
