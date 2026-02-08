"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, User, Calendar } from "lucide-react";
import { Member } from "@/lib/services/members.service";

interface MemberProfileCardProps {
  member: Member;
}

export function MemberProfileCard({ member }: MemberProfileCardProps) {
  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="text-sm">{member.email}</p>
            </div>
          </div>
          {member.phone && (
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Phone</p>
                <p className="text-sm">{member.phone}</p>
              </div>
            </div>
          )}
        </div>

        {(member.emergency_contact_name || member.emergency_contact_phone) && (
          <div className="pt-3 border-t border-border">
            <p className="text-sm font-medium text-muted-foreground mb-2">Emergency Contact</p>
            <div className="flex items-start gap-3">
              <User className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                {member.emergency_contact_name && <p>{member.emergency_contact_name}</p>}
                {member.emergency_contact_phone && (
                  <p className="text-muted-foreground">{member.emergency_contact_phone}</p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="pt-3 border-t border-border space-y-2">
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
              <p className="text-sm">{formatDate(member.date_of_birth)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Member Since</p>
              <p className="text-sm">{formatDate(member.membership_start_date)}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
