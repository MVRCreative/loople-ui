"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { EventRSVP } from "@/lib/events/types"

interface AttendeesTableProps {
  rsvps: EventRSVP[]
  className?: string
}

export function AttendeesTable({ rsvps, className }: AttendeesTableProps) {
  const goingRSVPs = rsvps.filter(rsvp => rsvp.status === "going")
  const maybeRSVPs = rsvps.filter(rsvp => rsvp.status === "maybe")
  const notGoingRSVPs = rsvps.filter(rsvp => rsvp.status === "not_going")


  if (rsvps.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-muted-foreground">No attendees yet</p>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Going */}
        {goingRSVPs.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Going ({goingRSVPs.length})
            </h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {goingRSVPs.map((rsvp) => (
                  <TableRow key={rsvp.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={rsvp.user.avatar} alt={rsvp.user.name} />
                          <AvatarFallback className="text-sm font-medium">
                            {rsvp.user.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{rsvp.user.name}</div>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Maybe */}
        {maybeRSVPs.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Maybe ({maybeRSVPs.length})
            </h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {maybeRSVPs.map((rsvp) => (
                  <TableRow key={rsvp.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={rsvp.user.avatar} alt={rsvp.user.name} />
                          <AvatarFallback className="text-sm font-medium">
                            {rsvp.user.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{rsvp.user.name}</div>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Not Going */}
        {notGoingRSVPs.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Not Going ({notGoingRSVPs.length})
            </h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notGoingRSVPs.map((rsvp) => (
                  <TableRow key={rsvp.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={rsvp.user.avatar} alt={rsvp.user.name} />
                          <AvatarFallback className="text-sm font-medium">
                            {rsvp.user.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{rsvp.user.name}</div>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}
