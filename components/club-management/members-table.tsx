"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Mail, 
  Phone,
  UserPlus,
  Search
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Member } from "@/lib/services/members.service";

interface MembersTableProps {
  members: Member[];
  onInviteClick?: () => void;
  onExportClick?: () => void;
  onEditMember?: (member: Member) => void;
  onDeleteMember?: (member: Member) => void;
  hideActions?: boolean;
}

export function MembersTable({ members, onInviteClick, onExportClick, onEditMember, onDeleteMember, hideActions }: MembersTableProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredMembers = members.filter(member =>
    `${member.first_name} ${member.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default" className="bg-green-500">Active</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "inactive":
        return <Badge variant="outline">Inactive</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getMemberTypeBadge = (memberType: string) => {
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
  };

  return (
    <div className="space-y-4">
      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-3 w-3 lg:h-4 lg:w-4" />
          <Input
            placeholder="Search members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 lg:pl-10 text-sm"
          />
        </div>
        {!hideActions && (
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" className="text-xs lg:text-sm" onClick={onInviteClick}>
              <UserPlus className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2" />
              Invite Member
            </Button>
            <Button size="sm" className="text-xs lg:text-sm" onClick={onExportClick}>
              Export
            </Button>
          </div>
        )}
      </div>

      {/* Members Table */}
      <div className="rounded-md border border-border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs lg:text-sm">Member</TableHead>
              <TableHead className="text-xs lg:text-sm hidden lg:table-cell">Contact</TableHead>
              <TableHead className="text-xs lg:text-sm">Type</TableHead>
              <TableHead className="text-xs lg:text-sm">Status</TableHead>
              <TableHead className="text-xs lg:text-sm hidden md:table-cell">Member Since</TableHead>
              <TableHead className="text-xs lg:text-sm hidden lg:table-cell">Role</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMembers.map((member) => (
              <TableRow key={member.id}>
                <TableCell>
                  <div className="flex items-center space-x-2 lg:space-x-3">
                    <div className="h-6 w-6 lg:h-8 lg:w-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-xs lg:text-sm font-medium text-blue-600">
                        {member.first_name?.[0]}{member.last_name?.[0]}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-sm lg:text-base truncate">
                        {member.first_name} {member.last_name}
                      </div>
                      <div className="text-xs lg:text-sm text-muted-foreground">
                        {member.date_of_birth ? new Date(member.date_of_birth).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <div className="space-y-1">
                    <div className="flex items-center text-xs lg:text-sm">
                      <Mail className="h-3 w-3 mr-1 text-muted-foreground" />
                      <span className="truncate">{member.email}</span>
                    </div>
                    {member.phone && (
                      <div className="flex items-center text-xs lg:text-sm text-muted-foreground">
                        <Phone className="h-3 w-3 mr-1" />
                        <span className="truncate">{member.phone}</span>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-xs lg:text-sm">
                    {getMemberTypeBadge(member.member_type)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-xs lg:text-sm">
                    {getStatusBadge((member as unknown as { membership_status?: string; status?: string }).membership_status ?? (member as unknown as { status?: string }).status ?? "")}
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="text-xs lg:text-sm">
                    {new Date(member.membership_start_date).toLocaleDateString()}
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <div className="text-xs lg:text-sm">
                    {member.role ? (
                      <Badge variant="outline" className="text-xs">{member.role}</Badge>
                    ) : (
                      <span className="text-muted-foreground">Member</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEditMember?.(member)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Member
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem className="text-destructive" onClick={() => onDeleteMember?.(member)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove Member
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredMembers.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No members found matching your search.</p>
        </div>
      )}
    </div>
  );
}
