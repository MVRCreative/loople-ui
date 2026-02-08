"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { Member } from "@/lib/services/members.service";

interface MemberNotesCardProps {
  member: Member;
}

export function MemberNotesCard({ member }: MemberNotesCardProps) {
  const notes = member.admin_notes?.trim();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Admin Notes</CardTitle>
      </CardHeader>
      <CardContent>
        {notes ? (
          <div className="rounded-md border border-border bg-muted/30 p-4">
            <p className="whitespace-pre-wrap text-sm text-foreground">{notes}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
            <FileText className="h-10 w-10 mb-2 opacity-50" />
            <p className="text-sm">No admin notes</p>
            <p className="text-xs mt-1">Add notes when editing this member</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
