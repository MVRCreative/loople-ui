"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import Link from "next/link";
import { Member, MembersService } from "@/lib/services/members.service";

interface MemberFamilyCardProps {
  member: Member;
  clubId: string;
}

export function MemberFamilyCard({ member }: MemberFamilyCardProps) {
  const [family, setFamily] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const members = await MembersService.getFamilyForMember(member);
        if (!cancelled) setFamily(members);
      } catch {
        if (!cancelled) setFamily([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load when member identity or family links change
  }, [member.id, member.household_id, member.parent_member_id]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Family / Household</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (family.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Family / Household</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
            <Users className="h-10 w-10 mb-2 opacity-50" />
            <p className="text-sm">No linked family members</p>
            <p className="text-xs mt-1">
              Add parent or household links when editing this member
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Family / Household</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {family.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-2">
              <Link
                href={`/admin/members/${m.id}`}
                className="text-sm font-medium text-primary hover:underline truncate"
              >
                {m.first_name} {m.last_name}
              </Link>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="outline" className="text-xs">
                  {m.member_type}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {m.status}
                </Badge>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
