"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { Member } from "@/lib/services/members.service";

interface MemberDetailHeaderProps {
  member: Member;
  onEdit?: () => void;
}

function getStatusBadge(status: string) {
  switch (status) {
    case "active":
      return <Badge variant="default" className="bg-green-500">Active</Badge>;
    case "pending":
      return <Badge variant="secondary">Pending</Badge>;
    case "inactive":
      return <Badge variant="outline">Inactive</Badge>;
    case "suspended":
      return <Badge variant="outline" className="border-amber-500 text-amber-700 dark:text-amber-400">Suspended</Badge>;
    case "canceled":
      return <Badge variant="outline" className="text-muted-foreground">Canceled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function getMemberTypeBadge(memberType: string) {
  switch (memberType) {
    case "adult":
      return <Badge variant="outline">Adult</Badge>;
    case "child":
      return <Badge variant="outline">Child</Badge>;
    case "family":
      return <Badge variant="outline">Family</Badge>;
    default:
      return <Badge variant="outline">{memberType}</Badge>;
  }
}

export function MemberDetailHeader({ member, onEdit }: MemberDetailHeaderProps) {
  const status = member.status ?? "";

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
          <span className="text-lg font-medium text-blue-600">
            {member.first_name?.[0]}
            {member.last_name?.[0]}
          </span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {member.first_name} {member.last_name}
          </h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {getStatusBadge(status)}
            {getMemberTypeBadge(member.member_type)}
          </div>
        </div>
      </div>
      {onEdit && (
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Edit className="h-4 w-4 mr-2" />
          Edit Member
        </Button>
      )}
    </div>
  );
}
