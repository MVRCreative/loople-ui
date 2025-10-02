"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { convertAuthUserToUser, createGuestUser } from "@/lib/utils/auth.utils";
import { User } from "@/lib/types";
import { useClub } from "@/lib/club-context";
import { MembersService, Member } from "@/lib/services/members.service";
import { MembersTable } from "@/components/club-management/members-table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InviteMemberForm } from "@/components/club-management/invite-member-form";
import { CreateMemberForm } from "@/components/club-management/create-member-form";
import { EditMemberForm } from "@/components/club-management/edit-member-form";
import { UserPlus, Plus } from "lucide-react";

export default function AdminUsersPage() {
  const { user: authUser } = useAuth();
  const { selectedClub } = useClub();
  const [members, setMembers] = useState<Member[]>([]);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [showInviteMember, setShowInviteMember] = useState(false);
  const [showCreateMember, setShowCreateMember] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  const currentUser: User = authUser ? convertAuthUserToUser(authUser) : createGuestUser();
  const isAdmin = currentUser.isAdmin;

  useEffect(() => {
    const loadMembers = async () => {
      if (!selectedClub) return;
      try {
        setMembersError(null);
        const data = await MembersService.getClubMembers(selectedClub.id);
        const membersData = Array.isArray(data) ? data : [];
        setMembers(membersData);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load members';
        setMembersError(message);
      }
    };
    loadMembers();
  }, [selectedClub]);

  if (!isAdmin) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-destructive">Access Denied</p>
          <p className="text-sm text-muted-foreground mt-2">You don\'t have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground">Manage club members and roles</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowCreateMember(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add Member
          </Button>
        </div>
      </div>

      {membersError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{membersError}</p>
        </div>
      )}

      <MembersTable 
        members={members}
        onInviteClick={() => setShowInviteMember(true)}
        onEditMember={(m) => setEditingMember(m)}
        onDeleteMember={async (m) => {
          try {
            await MembersService.deleteMember(m.id);
            setMembers(prev => prev.filter(x => x.id !== m.id));
          } catch {}
        }}
        hideActions={false}
      />

      {/* Invite Member Dialog */}
      <Dialog open={showInviteMember} onOpenChange={setShowInviteMember}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invite Member</DialogTitle>
          </DialogHeader>
          <InviteMemberForm onSuccess={async () => {
            setShowInviteMember(false);
          }} onCancel={() => setShowInviteMember(false)} />
        </DialogContent>
      </Dialog>

      {/* Create Member Dialog */}
      <Dialog open={showCreateMember} onOpenChange={setShowCreateMember}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Member</DialogTitle>
          </DialogHeader>
          <CreateMemberForm onSuccess={async () => {
            setShowCreateMember(false);
            if (selectedClub) {
              const refreshed = await MembersService.getClubMembers(selectedClub.id);
              const membersData = Array.isArray(refreshed) ? refreshed : [];
              setMembers(membersData);
            }
          }} onCancel={() => setShowCreateMember(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit Member Dialog */}
      <Dialog open={!!editingMember} onOpenChange={(open) => { if (!open) setEditingMember(null); }}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          {editingMember && (
            <EditMemberForm member={editingMember} onSuccess={async () => {
              setEditingMember(null);
              if (selectedClub) {
                const refreshed = await MembersService.getClubMembers(selectedClub.id);
                const membersData = Array.isArray(refreshed) ? refreshed : [];
                setMembers(membersData);
              }
            }} onCancel={() => setEditingMember(null)} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}


