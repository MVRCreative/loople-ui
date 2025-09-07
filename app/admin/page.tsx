import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AnimatedList, AnimatedListItem } from "@/components/ui/animated-list"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Settings, Activity, Calendar, TrendingUp } from "lucide-react"

type MemberRow = {
  id: string;
  member_type: string | null;
  created_at: string | null;
  user: {
    id: string;
    email: string | null;
    full_name: string | null;
  } | null;
};

export default function AdminPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined }
}) {
  // Mock data for UI demonstration
  const mockMembers: MemberRow[] = [
    {
      id: "1",
      member_type: "admin",
      created_at: "2024-01-15T10:30:00Z",
      user: {
        id: "user-1",
        email: "admin@loople.com",
        full_name: "Loople Admin"
      }
    },
    {
      id: "2", 
      member_type: "coach",
      created_at: "2024-01-20T14:15:00Z",
      user: {
        id: "user-2",
        email: "coach@sarah.com",
        full_name: "Coach Sarah"
      }
    },
    {
      id: "3",
      member_type: "member", 
      created_at: "2024-02-01T09:45:00Z",
      user: {
        id: "user-3",
        email: "john@davis.com",
        full_name: "John Davis"
      }
    },
    {
      id: "4",
      member_type: "member",
      created_at: "2024-02-05T16:20:00Z", 
      user: {
        id: "user-4",
        email: "jane@smith.com",
        full_name: "Jane Smith"
      }
    },
    {
      id: "5",
      member_type: "coach",
      created_at: "2024-02-10T11:30:00Z",
      user: {
        id: "user-5", 
        email: "mike@coach.com",
        full_name: "Mike Johnson"
      }
    }
  ]

  const rows = mockMembers

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
            <CardDescription>Active Coaches</CardDescription>
            <CardTitle className="text-4xl">
              {rows.filter(r => r.member_type === 'coach').length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              <Activity className="h-4 w-4 inline mr-1" />
              +2 new this week
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>New Members</CardDescription>
            <CardTitle className="text-4xl">
              {rows.filter(r => {
                const date = new Date(r.created_at || '')
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
                {rows.map((row) => (
                  <AnimatedListItem key={row.id}>
                    <TableRow>
                      <TableCell className="font-medium">
                        {row.user?.full_name || 'Unknown'}
                      </TableCell>
                      <TableCell>{row.user?.email || 'No email'}</TableCell>
                      <TableCell>
                        <Badge variant={
                          row.member_type === 'admin' ? 'default' :
                          row.member_type === 'coach' ? 'secondary' : 'outline'
                        }>
                          {row.member_type || 'member'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {row.created_at ? new Date(row.created_at).toLocaleDateString() : 'Unknown'}
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