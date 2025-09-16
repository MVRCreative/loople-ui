import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AnimatedList, AnimatedListItem } from "@/components/ui/animated-list"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users, Building2, UserCheck, Database } from "lucide-react"
import { AdminService } from "@/lib/services"

export default async function SuperAdminPage() {
  // Fetch all data via services with error capture
  const [usersRes, clubsRes, relationshipsRes] = await Promise.allSettled([
    AdminService.getAllProfiles(),
    AdminService.getAllClubs(),
    AdminService.getAllMemberships(),
  ])

  const users = usersRes.status === 'fulfilled' ? usersRes.value : []
  const clubs = clubsRes.status === 'fulfilled' ? clubsRes.value : []
  const relationships = relationshipsRes.status === 'fulfilled' ? relationshipsRes.value : []

  const usersError = usersRes.status === 'rejected' 
    ? (usersRes.reason instanceof Error ? usersRes.reason.message : 'Failed to load users') 
    : null
  const clubsError = clubsRes.status === 'rejected' 
    ? (clubsRes.reason instanceof Error ? clubsRes.reason.message : 'Failed to load clubs') 
    : null
  const relationshipsError = relationshipsRes.status === 'rejected' 
    ? (relationshipsRes.reason instanceof Error ? relationshipsRes.reason.message : 'Failed to load relationships') 
    : null

  return (
    <div className="min-h-screen bg-background">
      <header className="flex h-16 shrink-0 items-center gap-2">
        <div className="flex items-center gap-2 px-4">
          <div className="flex items-center gap-4">
            <Database className="h-5 w-5" />
            <h1 className="text-lg font-semibold">Super Admin</h1>
          </div>
        </div>
      </header>
      
      <main className="flex flex-1 flex-col gap-4 p-7 pt-8">
          <div className="text-left space-y-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Super Admin Dashboard
              </h1>
              <p className="text-muted-foreground max-w-2xl">
                System-wide administration and data management
              </p>
            </div>
          </div>

          <AnimatedList className="space-y-6" staggerDelay={0.1}>
            {/* Stats Overview */}
            <AnimatedListItem>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{users?.length || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      Registered users
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Clubs</CardTitle>
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{clubs?.length || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      Active clubs
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Memberships</CardTitle>
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{relationships?.length || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      User-club relationships
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Admin Users</CardTitle>
                    <Database className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {users?.filter(u => u.is_admin)?.length || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      System administrators
                    </p>
                  </CardContent>
                </Card>
              </div>
            </AnimatedListItem>

            {/* Users Table */}
            <AnimatedListItem>
              <Card>
                <CardHeader>
                  <CardTitle>All Users</CardTitle>
                  <CardDescription>Complete list of registered users in the system</CardDescription>
                </CardHeader>
                <CardContent>
                  {usersError ? (
                    <div className="text-sm text-destructive">Failed to load users: {usersError}</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Admin</TableHead>
                          <TableHead>Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {!users || users.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-muted-foreground">No users found.</TableCell>
                          </TableRow>
                        ) : (
                          users.map((user) => (
                            <TableRow key={user.id}>
                              <TableCell className="font-medium">
                                {user.full_name || "—"}
                              </TableCell>
                              <TableCell>{user.email || "—"}</TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {user.role || "user"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {user.is_admin ? (
                                  <Badge variant="destructive">Admin</Badge>
                                ) : (
                                  <Badge variant="secondary">User</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {user.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </AnimatedListItem>

            {/* Clubs Table */}
            <AnimatedListItem>
              <Card>
                <CardHeader>
                  <CardTitle>All Clubs</CardTitle>
                  <CardDescription>Complete list of clubs in the system</CardDescription>
                </CardHeader>
                <CardContent>
                  {clubsError ? (
                    <div className="text-sm text-destructive">Failed to load clubs: {clubsError}</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Slug</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Updated</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {!clubs || clubs.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-muted-foreground">No clubs found.</TableCell>
                          </TableRow>
                        ) : (
                          clubs.map((club) => (
                            <TableRow key={club.id}>
                              <TableCell className="font-medium">{club.name}</TableCell>
                              <TableCell>
                                <code className="text-xs bg-muted px-1 py-0.5 rounded">
                                  {club.slug}
                                </code>
                              </TableCell>
                              <TableCell>
                                {club.created_at ? new Date(club.created_at).toLocaleDateString() : "—"}
                              </TableCell>
                              <TableCell>
                                {club.updated_at ? new Date(club.updated_at).toLocaleDateString() : "—"}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </AnimatedListItem>

            {/* User-Club Relationships Table */}
            <AnimatedListItem>
              <Card>
                <CardHeader>
                  <CardTitle>User-Club Relationships</CardTitle>
                  <CardDescription>All memberships showing which users belong to which clubs</CardDescription>
                </CardHeader>
                <CardContent>
                  {relationshipsError ? (
                    <div className="text-sm text-destructive">Failed to load relationships: {relationshipsError}</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Club</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Joined</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {!relationships || relationships.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-muted-foreground">No relationships found.</TableCell>
                          </TableRow>
                        ) : (
                          relationships.map((rel) => (
                            <TableRow key={rel.id}>
                              <TableCell className="font-medium">
                                {rel.user?.full_name || "—"}
                              </TableCell>
                              <TableCell>{rel.user?.email || "—"}</TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-medium">{rel.club?.name || "—"}</span>
                                  <code className="text-xs text-muted-foreground">
                                    {rel.club?.slug || "—"}
                                  </code>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {rel.role}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {rel.created_at ? new Date(rel.created_at).toLocaleDateString() : "—"}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </AnimatedListItem>
          </AnimatedList>
      </main>
    </div>
  )
}
