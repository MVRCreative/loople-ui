"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth-context";
import { useClub } from "@/lib/club-context";
import { convertAuthUserToUser, createGuestUser } from "@/lib/utils/auth.utils";
import { User } from "@/lib/types";
import {
  WaitlistService,
  WaitlistApplication,
  ClubWaitlistSettings,
} from "@/lib/services/waitlist.service";
import { env } from "@/lib/env";
import { Loader } from "@/components/ui/loader";
import { MoreHorizontal, UserPlus, ExternalLink, Copy } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminWaitlistPage() {
  const { user: authUser } = useAuth();
  const { selectedClub, loading: clubLoading } = useClub();
  const router = useRouter();
  const currentUser: User = authUser ? convertAuthUserToUser(authUser) : createGuestUser();
  const isAdmin = currentUser.isAdmin;

  const [settings, setSettings] = useState<ClubWaitlistSettings | null>(null);
  const [applications, setApplications] = useState<WaitlistApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<WaitlistApplication | null>(null);
  const [convertTarget, setConvertTarget] = useState<WaitlistApplication | null>(null);
  const [addForm, setAddForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
  });
  const [copied, setCopied] = useState(false);
  const [shareableUrl, setShareableUrl] = useState("");

  const load = async () => {
    if (!selectedClub?.id) return;
    setLoading(true);
    setError(null);
    try {
      const [settingsData, apps] = await Promise.all([
        WaitlistService.getClubWaitlistSettings(selectedClub.id),
        WaitlistService.getWaitlistByClubId(selectedClub.id),
      ]);
      setSettings(settingsData ?? { waitlist_enabled: false, waitlist_payment_amount: null });
      setApplications(apps);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load waitlist");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClub?.id]);

  useEffect(() => {
    if (typeof window === "undefined" || !selectedClub) return;
    const base = env.APP_URL || window.location.origin;
    const basePath = env.BASE_PATH || "/app";
    const slug = selectedClub.subdomain || selectedClub.id;
    setShareableUrl(`${base}${basePath}/waitlist/apply?club=${slug}`);
  }, [selectedClub]);

  const handleToggleEnabled = async (checked: boolean) => {
    if (!selectedClub?.id) return;
    setSaving(true);
    try {
      await WaitlistService.updateClubWaitlistSettings(selectedClub.id, {
        waitlist_enabled: checked,
      });
      setSettings((s) => (s ? { ...s, waitlist_enabled: checked } : { waitlist_enabled: checked, waitlist_payment_amount: null }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAmount = async () => {
    if (!selectedClub?.id || settings == null) return;
    const amount = parseFloat((document.getElementById("waitlist-amount") as HTMLInputElement)?.value ?? "0");
    setSaving(true);
    try {
      await WaitlistService.updateClubWaitlistSettings(selectedClub.id, {
        waitlist_payment_amount: isNaN(amount) || amount < 0 ? null : amount,
      });
      setSettings((s) => (s ? { ...s, waitlist_payment_amount: isNaN(amount) || amount < 0 ? null : amount } : s));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const handleAddApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClub?.id) return;
    setSaving(true);
    setError(null);
    try {
      await WaitlistService.createApplication({
        club_id: selectedClub.id,
        email: addForm.email,
        first_name: addForm.first_name,
        last_name: addForm.last_name,
        phone: addForm.phone || undefined,
        payment_status: "pending",
      });
      setShowAddDialog(false);
      setAddForm({ first_name: "", last_name: "", email: "", phone: "" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!removeTarget) return;
    setSaving(true);
    try {
      await WaitlistService.remove(removeTarget.id);
      setRemoveTarget(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove");
    } finally {
      setSaving(false);
    }
  };

  const handleConvert = async () => {
    if (!convertTarget) return;
    setSaving(true);
    setError(null);
    try {
      const { memberId } = await WaitlistService.convertToMember(convertTarget.id);
      setConvertTarget(null);
      await load();
      router.push(`/admin/members/${memberId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to convert");
    } finally {
      setSaving(false);
    }
  };

  const paymentStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default" className="bg-green-600">Paid</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "refunded":
        return <Badge variant="outline">Refunded</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge variant="default" className="bg-green-600">Approved</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      case "removed":
        return <Badge variant="outline">Removed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-lg font-medium text-destructive">Access Denied</p>
      </div>
    );
  }

  if (clubLoading || (loading && !applications.length)) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader className="mx-auto" />
      </div>
    );
  }

  if (!selectedClub) {
    return (
      <div className="flex-1 p-6">
        <div className="max-w-lg">
          <h1 className="text-3xl font-bold text-foreground mb-2">Waitlist</h1>
          <Card>
            <CardHeader>
              <CardTitle>Select a club</CardTitle>
              <CardDescription>
                Use the club switcher above to select a club before managing the waitlist. If you see &quot;No Clubs&quot;, create or join a club first from Club Management.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={() => router.push("/admin/club-management")}>
                Go to Club Management
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Waitlist</h1>
        <p className="text-muted-foreground">Manage waitlist applications and convert to members</p>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 text-destructive px-4 py-2 text-sm">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>Enable the public waitlist form and set the registration fee</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="waitlist-enabled">Waitlist enabled</Label>
              <p className="text-sm text-muted-foreground">Allow public applications at /waitlist/apply</p>
            </div>
            <Switch
              id="waitlist-enabled"
              checked={settings?.waitlist_enabled ?? false}
              onCheckedChange={handleToggleEnabled}
              disabled={saving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="waitlist-amount">Registration fee (optional)</Label>
            <div className="flex gap-2">
              <Input
                id="waitlist-amount"
                type="number"
                min={0}
                step={0.01}
                placeholder="0"
                defaultValue={settings?.waitlist_payment_amount ?? ""}
                className="max-w-[160px]"
              />
              <Button onClick={handleSaveAmount} disabled={saving}>
                Save
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">Set to 0 or leave empty for no payment</p>
          </div>
          {settings?.waitlist_enabled && selectedClub && shareableUrl && (
            <div className="space-y-2 pt-2 border-t">
              <Label>Shareable link</Label>
              <p className="text-sm text-muted-foreground">Share this link so applicants can join the waitlist</p>
              <div className="flex gap-2 items-center">
                <Input
                  readOnly
                  value={shareableUrl}
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={async () => {
                    await navigator.clipboard.writeText(shareableUrl);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  title="Copy link"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  asChild
                >
                  <a
                    href={shareableUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View public form
                  </a>
                </Button>
              </div>
              {copied && <p className="text-sm text-green-600">Copied to clipboard</p>}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Applications</CardTitle>
            <CardDescription>FIFO order by position; convert approved entries to active members</CardDescription>
          </div>
          <Button onClick={() => setShowAddDialog(true)} disabled={saving}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add manually
          </Button>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">No waitlist entries yet.</p>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Applied</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((app, i) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium">{i + 1}</TableCell>
                      <TableCell>{`${app.first_name} ${app.last_name}`}</TableCell>
                      <TableCell>{app.email}</TableCell>
                      <TableCell>
                        {paymentStatusBadge(app.payment_status)}
                        {app.payment_amount > 0 && (
                          <span className="ml-2 text-muted-foreground">${app.payment_amount}</span>
                        )}
                      </TableCell>
                      <TableCell>{statusBadge(app.status)}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(app.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {!app.converted_member_id ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setConvertTarget(app)}>
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Convert to member
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setRemoveTarget(app)}
                              >
                                Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/admin/members/${app.converted_member_id}`)}
                          >
                            View member
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add waitlist entry</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddApplication} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="add-first">First name</Label>
                <Input
                  id="add-first"
                  value={addForm.first_name}
                  onChange={(e) => setAddForm((f) => ({ ...f, first_name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="add-last">Last name</Label>
                <Input
                  id="add-last"
                  value={addForm.last_name}
                  onChange={(e) => setAddForm((f) => ({ ...f, last_name: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="add-email">Email</Label>
              <Input
                id="add-email"
                type="email"
                value={addForm.email}
                onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="add-phone">Phone</Label>
              <Input
                id="add-phone"
                value={addForm.phone}
                onChange={(e) => setAddForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                Add
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!removeTarget} onOpenChange={() => setRemoveTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove waitlist entry?</DialogTitle>
            <DialogDescription>
              This will remove {removeTarget ? `${removeTarget.first_name} ${removeTarget.last_name}` : ""} from the
              waitlist. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemove}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!convertTarget} onOpenChange={() => setConvertTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convert to active member?</DialogTitle>
            <DialogDescription>
              This will create a new member record for {convertTarget ? `${convertTarget.first_name} ${convertTarget.last_name}` : ""}{" "}
              and add them to the club. You can edit their profile after.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConvertTarget(null)}>
              Cancel
            </Button>
            <Button onClick={handleConvert}>Convert</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
