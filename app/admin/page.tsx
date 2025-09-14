"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AnimatedList, AnimatedListItem } from "@/components/ui/animated-list"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Settings, Activity, Calendar, TrendingUp } from "lucide-react"
import { useClub } from "@/lib/club-context"
import { MembersService, Member } from "@/lib/services/members.service"

export default function AdminPage() {
  const { selectedClub } = useClub()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadMembers = async () => {
      if (!selectedClub) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const membersData = await MembersService.getClubMembers(selectedClub.id)
        setMembers(membersData || [])
      } catch (err) {
        console.error('Error loading members:', err)
        setError(err instanceof Error ? err.message : 'Failed to load members')
      } finally {
        setLoading(false)
      }
    }

    loadMembers()
  }, [selectedClub])

  if (!selectedClub) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-0">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold">No Club Selected</h3>
              <p className="text-muted-foreground">Please select a club to view member management.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-0">
        <div className="text-center py-8">
          <div className="text-sm text-muted-foreground">Loading members...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-0">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-red-600">Error</h3>
              <p className="text-muted-foreground">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const rows = members

  return (
    <div className="flex flex-1 flex-col gap-4 p-0">
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Members</CardDescription>
            <CardTitle className="text-4xl">{rows.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              <TrendingUp className="h-4 w-4 inline mr-1" />
              +12% from last month
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Members</CardDescription>
            <CardTitle className="text-4xl">
              {rows.filter(m => m.status === 'active').length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              <Activity className="h-4 w-4 inline mr-1" />
              {rows.filter(m => {
                const date = new Date(m.created_at || '')
                const now = new Date()
                const diffTime = Math.abs(now.getTime() - date.getTime())
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                return diffDays <= 7
              }).length} new this week
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>New Members</CardDescription>
            <CardTitle className="text-4xl">
              {rows.filter(m => {
                const date = new Date(m.created_at || '')
                const now = new Date()
                const diffTime = Math.abs(now.getTime() - date.getTime())
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                return diffDays <= 30
              }).length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              <Calendar className="h-4 w-4 inline mr-1" />
              This month
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>
            Manage club members and their roles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatedList>
                {rows.map((member) => (
                  <AnimatedListItem key={member.id}>
                    <TableRow>
                      <TableCell className="font-medium">
                        {`${member.first_name} ${member.last_name}`}
                      </TableCell>
                      <TableCell>{member.email || 'No email'}</TableCell>
                      <TableCell>
                        <Badge variant={
                          member.member_type === 'adult' ? 'default' :
                          member.member_type === 'child' ? 'secondary' : 'outline'
                        }>
                          {member.member_type || 'member'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {member.created_at ? new Date(member.created_at).toLocaleDateString() : 'Unknown'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4 mr-1" />
                          Manage
                        </Button>
                      </TableCell>
                    </TableRow>
                  </AnimatedListItem>
                ))}
              </AnimatedList>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}