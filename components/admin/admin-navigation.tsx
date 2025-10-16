import { 
  Building2, 
  Users, 
  Calendar, 
  CreditCard, 
  Settings, 
  BarChart3, 
  FileText,
  Shield,
  UserCog,
  Database,
  CheckSquare
} from "lucide-react"

export const adminNavigation = [
  {
    name: "Overview",
    href: "/admin",
    icon: BarChart3,
    current: false,
  },
  {
    name: "Club Management",
    href: "/admin/club-management",
    icon: Building2,
    current: false,
  },
  {
    name: "User Management",
    href: "/admin/users",
    icon: Users,
    current: false,
  },
  {
    name: "Events",
    href: "/admin/events",
    icon: Calendar,
    current: false,
  },
  {
    name: "Tasks",
    href: "/admin/todos",
    icon: CheckSquare,
    current: false,
  },
  {
    name: "Payments",
    href: "/admin/payments",
    icon: CreditCard,
    current: false,
  },
  {
    name: "Reports",
    href: "/admin/reports",
    icon: FileText,
    current: false,
  },
  {
    name: "System Settings",
    href: "/admin/settings",
    icon: Settings,
    current: false,
  },
]

export const adminSecondaryNavigation = [
  {
    name: "Database",
    href: "/admin/database",
    icon: Database,
    current: false,
  },
  {
    name: "Security",
    href: "/admin/security",
    icon: Shield,
    current: false,
  },
  {
    name: "User Roles",
    href: "/admin/roles",
    icon: UserCog,
    current: false,
  },
]
