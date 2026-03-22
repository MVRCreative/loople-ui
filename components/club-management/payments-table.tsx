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
  Calendar,
  DollarSign,
  Search,
  RefreshCw
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Payment } from "@/lib/types/club-management";

interface PaymentsTableProps {
  payments: Payment[];
  /**
   * Use inside an already-framed layout (e.g. admin shell). Omits an extra
   * bordered box around the table so you do not get nested rectangles.
   */
  flush?: boolean;
}

export function PaymentsTable({ payments, flush = false }: PaymentsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredPayments = payments.filter(payment =>
    `${payment.registration.member.firstName} ${payment.registration.member.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.registration.event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.stripePaymentIntentId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default" className="bg-green-500">Completed</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "failed":
        return <Badge variant="outline">Failed</Badge>;
      case "refunded":
        return <Badge variant="outline">Refunded</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentMethodBadge = (method: string) => {
    switch (method) {
      case "card":
        return <Badge variant="outline">Card</Badge>;
      case "cash":
        return <Badge variant="outline">Cash</Badge>;
      case "check":
        return <Badge variant="outline">Check</Badge>;
      case "transfer":
        return <Badge variant="outline">Transfer</Badge>;
      default:
        return <Badge variant="outline">{method}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const tableSection = (
    <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="min-w-[180px] text-xs font-medium text-muted-foreground">
                Member
              </TableHead>
              <TableHead className="min-w-[160px] text-xs font-medium text-muted-foreground">
                Event
              </TableHead>
              <TableHead className="min-w-[120px] text-xs font-medium text-muted-foreground">
                Amount
              </TableHead>
              <TableHead className="min-w-[100px] text-xs font-medium text-muted-foreground">
                Method
              </TableHead>
              <TableHead className="min-w-[100px] text-xs font-medium text-muted-foreground">
                Status
              </TableHead>
              <TableHead className="min-w-[140px] text-xs font-medium text-muted-foreground">
                Payment date
              </TableHead>
              <TableHead className="min-w-[180px] text-xs font-medium text-muted-foreground">
                Transaction ID
              </TableHead>
              <TableHead className="w-[50px]" aria-label="Actions" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPayments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                        {payment.registration.member.firstName[0]}
                        {payment.registration.member.lastName[0]}
                    </div>
                    <div>
                      <div className="font-medium">
                        {payment.registration.member.firstName} {payment.registration.member.lastName}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{payment.registration.event.title}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center text-sm">
                    <DollarSign className="h-3 w-3 mr-1 text-muted-foreground" />
                    <span className="font-medium tabular-nums">
                      {formatCurrency(payment.amount)}
                    </span>
                    {payment.feeAmount && payment.feeAmount > 0 && (
                      <span className="text-muted-foreground ml-1">
                        (fee: {formatCurrency(payment.feeAmount)})
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {getPaymentMethodBadge(payment.paymentMethod)}
                </TableCell>
                <TableCell>
                  {getStatusBadge(payment.status)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center text-sm">
                    <Calendar className="h-3 w-3 mr-1 text-muted-foreground" />
                    {formatDate(payment.createdAt)}
                  </div>
                </TableCell>
                <TableCell>
                  {payment.stripePaymentIntentId ? (
                    <div className="text-sm font-mono text-muted-foreground">
                      {payment.stripePaymentIntentId.substring(0, 20)}...
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      {payment.status === "completed" && (
                        <DropdownMenuItem>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Process Refund
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Payment
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
    </Table>
  );

  return (
    <div className="space-y-0">
      <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search payments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" size="sm" type="button">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button size="sm" type="button">
            Export report
          </Button>
        </div>
      </div>

      <div className="pt-4">
        {filteredPayments.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No payments match your search.
          </p>
        ) : flush ? (
          tableSection
        ) : (
          <div className="overflow-x-auto rounded-md border border-border">
            {tableSection}
          </div>
        )}
      </div>
    </div>
  );
}
