"use client";

import { useEffect, useState } from "react";
import { Loader } from "@/components/ui/loader";
import { useAuth } from "@/lib/auth-context";
import { ClubInquiryService, ClubInquirySubmission } from "@/lib/services/club-inquiry.service";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function FormSubmissionsPage() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<ClubInquirySubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isGlobalAdmin =
    (user?.app_metadata as { isAdmin?: boolean } | undefined)?.isAdmin === true;

  useEffect(() => {
    const load = async () => {
      if (!isGlobalAdmin) return;
      setLoading(true);
      setError(null);
      try {
        const result = await ClubInquiryService.getClubInquirySubmissions();
        if (result.success && result.data) {
          setSubmissions(result.data);
        } else {
          setError(result.error ?? "Failed to load submissions");
        }
      } catch {
        setError("Failed to load submissions");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isGlobalAdmin]);

  if (!isGlobalAdmin) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-destructive">Access Denied</p>
          <p className="text-sm text-muted-foreground mt-2">
            Only global admins can view form submissions.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Loader className="mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Loading submissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Form Submissions</h1>
        <p className="text-muted-foreground">
          Club creation inquiries submitted by users
        </p>
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Club Inquiry Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">
              No submissions yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="whitespace-nowrap">
                      {new Date(s.created_at).toLocaleDateString()}{" "}
                      {new Date(s.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell>{s.email}</TableCell>
                    <TableCell>{s.name ?? "—"}</TableCell>
                    <TableCell className="max-w-xs truncate">{s.message}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          s.status === "resolved"
                            ? "default"
                            : s.status === "contacted"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {s.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
