"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { useAuth } from "@/lib/auth-context";
import { convertAuthUserToUser, createGuestUser } from "@/lib/utils/auth.utils";
import { User } from "@/lib/types";
import { useClub } from "@/lib/club-context";
import { MembersService, Member } from "@/lib/services/members.service";
import { RegistrationsService, Registration } from "@/lib/services/registrations.service";
import { MemberDetailHeader } from "@/components/club-management/member-detail-header";
import { MemberProfileCard } from "@/components/club-management/member-profile-card";
import { MemberActivityCard } from "@/components/club-management/member-activity-card";
import { MemberPaymentsCard } from "@/components/club-management/member-payments-card";
import { MemberNotesCard } from "@/components/club-management/member-notes-card";
import { MemberFamilyCard } from "@/components/club-management/member-family-card";
import { EditMemberForm } from "@/components/club-management/edit-member-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft } from "lucide-react";

export default function AdminMemberDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user: authUser } = useAuth();
  const { selectedClub, loading: clubLoading } = useClub();

  const memberId = typeof params?.id === "string" ? params.id : "";
  const [member, setMember] = useState<Member | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const currentUser: User = authUser ? convertAuthUserToUser(authUser) : createGuestUser();
  const isAdmin = currentUser.isAdmin;

  useEffect(() => {
    const load = async () => {
      if (!memberId || !selectedClub) return;
      try {
        setLoading(true);
        setError(null);
        const [memberData, regs] = await Promise.all([
          MembersService.getMemberById(memberId),
          RegistrationsService.getRegistrations({ member_id: memberId, club_id: selectedClub.id }),
        ]);
        setMember(memberData ?? null);
        setRegistrations(Array.isArray(regs) ? regs : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load member");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [memberId, selectedClub]);

  const handleBack = () => router.back();

  const handleEditSuccess = async () => {
    setShowEditDialog(false);
    if (memberId) {
      const refreshed = await MembersService.getMemberById(memberId).catch(() => null);
      setMember(refreshed);
    }
  };

  if (clubLoading || loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Loader className="mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Loading member...</p>
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
          <Button onClick={handleBack} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-destructive">
            {error ?? "Member not found"}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {error
              ? "Something went wrong while loading this member."
              : "The member you're looking for doesn't exist or has been removed."}
          </p>
          <Button onClick={handleBack} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (selectedClub && String(member.club_id) !== String(selectedClub.id)) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-destructive">Access Denied</p>
          <p className="text-sm text-muted-foreground mt-2">
            This member belongs to a different club.
          </p>
          <Button onClick={handleBack} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
      </div>

      <MemberDetailHeader member={member} onEdit={() => setShowEditDialog(true)} />

      <div className="grid gap-6 md:grid-cols-2">
        <MemberProfileCard member={member} />
        <MemberPaymentsCard memberId={member.id} />
      </div>

      <MemberNotesCard member={member} />
      <MemberFamilyCard member={member} clubId={member.club_id} />
      <MemberActivityCard registrations={registrations} />

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Member</DialogTitle>
          </DialogHeader>
          <EditMemberForm
            member={member}
            onSuccess={handleEditSuccess}
            onCancel={() => setShowEditDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
