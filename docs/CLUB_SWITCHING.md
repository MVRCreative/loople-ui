# Club Switching System

This document describes the club switching system implementation in the Loople UI project.

## Overview

The club switching system allows users to:
- View all clubs where they are a member or owner
- Switch between different clubs
- Access club management features
- Maintain context of the selected club throughout the application

## Architecture

### 1. API Services (`lib/services/`)

Based on the Postman collection, we've created service files for each endpoint:

- **`clubs.service.ts`** - Club management operations
- **`members.service.ts`** - Member management operations  
- **`events.service.ts`** - Event management operations
- **`registrations.service.ts`** - Registration management operations
- **`payments.service.ts`** - Payment management operations
- **`users.service.ts`** - User and role management operations

Each service follows the same pattern:
```typescript
export class ServiceName {
  static async methodName(params: Type): Promise<ReturnType> {
    // Implementation using Supabase functions or direct database calls
  }
}
```

### 2. Club Context (`lib/club-context.tsx`)

The `ClubProvider` manages the global club state:

```typescript
interface ClubContextType {
  clubs: Club[];                    // All clubs user belongs to
  selectedClub: Club | null;        // Currently selected club
  loading: boolean;                // Loading state
  error: string | null;            // Error state
  selectClub: (club: Club) => void; // Function to select a club
  refreshClubs: () => Promise<void>; // Function to refresh clubs data
  isOwner: boolean;                // Is user owner of selected club
  isAdmin: boolean;                // Is user admin of selected club
  isMember: boolean;               // Is user member of selected club
}
```

### 3. Club Switcher Component (`components/club-switcher.tsx`)

The club switcher dropdown:
- Shows all clubs where the user is a member or owner
- Displays user's role in each club (owner, admin, member)
- Includes a "Club Management" button that navigates to `/club-management`
- Includes a "Create New Club" button for creating new clubs
- Persists selected club in localStorage

### 4. Integration with Club Management

The club management page (`app/club-management/page.tsx`):
- Uses the selected club from context
- Shows permission-based UI (read-only for non-owners/admins)
- Displays club-specific data
- Handles cases where no club is selected

## Usage Examples

### Using Club Context in Components

```typescript
import { useClub } from '@/lib/club-context';

function MyComponent() {
  const { selectedClub, isOwner, isAdmin } = useClub();
  
  if (!selectedClub) {
    return <div>No club selected</div>;
  }
  
  return (
    <div>
      <h1>{selectedClub.name}</h1>
      {isOwner && <button>Admin Actions</button>}
    </div>
  );
}
```

### Using API Services

```typescript
import { MembersService } from '@/lib/services';

async function loadMembers() {
  try {
    const members = await MembersService.getClubMembers(clubId);
    setMembers(members);
  } catch (error) {
    console.error('Failed to load members:', error);
  }
}
```

### Protected Routes

```typescript
import { useRequireClub } from '@/lib/club-context';

function ProtectedComponent() {
  const { selectedClub, loading, isAuthenticated } = useRequireClub();
  
  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Please log in</div>;
  if (!selectedClub) return <div>Please select a club</div>;
  
  return <div>Club content</div>;
}
```

## Data Flow

1. **User Authentication**: User logs in via `AuthProvider`
2. **Club Loading**: `ClubProvider` loads user's clubs using `ClubsService.getUserClubs()`
3. **Club Selection**: User selects a club via the club switcher
4. **Context Update**: Selected club is stored in context and localStorage
5. **Component Updates**: All components using `useClub()` receive the new selected club
6. **API Calls**: Components make API calls using the selected club ID

## Permissions

The system supports three permission levels:
- **Owner**: Full access to club management features
- **Admin**: Administrative access (to be implemented based on user roles)
- **Member**: Read-only access to most features

## Error Handling

- Network errors are caught and displayed to users
- Loading states are shown during API calls
- Fallback UI is provided when no club is selected
- Error boundaries can be added for additional error handling

## Future Enhancements

1. **Real-time Updates**: Use Supabase realtime subscriptions for live data
2. **Caching**: Implement data caching for better performance
3. **Offline Support**: Add offline capabilities with data synchronization
4. **Advanced Permissions**: Implement granular role-based permissions
5. **Club Invitations**: Add invitation system for joining clubs
6. **Multi-tenancy**: Support for subdomain-based club access
