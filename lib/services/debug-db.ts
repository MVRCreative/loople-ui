import { supabase } from "@/lib/supabase";

/**
 * Debug function to test database connection and check tables
 */
export async function debugDatabase() {
  try {
    console.log("🔍 Testing Supabase connection...");
    
    // Check authentication status
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error("❌ Authentication error:", authError);
    } else if (user) {
      console.log("✅ User authenticated:", { id: user.id, email: user.email });
    
    // Check user's role in members table
    const { data: userMembership, error: membershipError } = await supabase
      .from("members")
      .select("id, club_id, role, membership_status, first_name, last_name")
      .eq("user_id", user.id);
    
    if (membershipError) {
      console.error("❌ Error checking user membership:", membershipError);
    } else {
      console.log("👤 User membership data:", userMembership);
      if (userMembership && userMembership.length > 0) {
        const isAdmin = userMembership.some(m => m.role === 'Admin' || m.role === 'Owner');
        console.log("🔑 User has admin role:", isAdmin);
      } else {
        console.error("❌ User not found in members table!");
      }
    }
    } else {
      console.log("⚠️ No user authenticated");
    }
    
    // Test basic connection by trying to query a known table
    const { data: members, error: membersError } = await supabase
      .from("members")
      .select("id")
      .limit(1);
    
    if (membersError) {
      console.error("❌ Error connecting to members table:", {
        error: membersError,
        message: membersError?.message,
        code: membersError?.code
      });
    } else {
      console.log("✅ Successfully connected to members table");
    }
    
    // Test club_tasks table directly
    console.log("🔍 Testing club_tasks table...");
    const { data: tasks, error: tasksError } = await supabase
      .from("club_tasks")
      .select("id")
      .limit(1);
    
    if (tasksError) {
      console.error("❌ CRITICAL: club_tasks table does not exist or is not accessible!");
      console.error("Error details:", {
        error: tasksError,
        message: tasksError?.message,
        code: tasksError?.code,
        hint: tasksError?.hint
      });
      console.log("🔧 You need to run the SQL migration in Supabase SQL Editor");
      console.log("📄 SQL file: supabase-todo-migration.sql");
      return;
    } else {
      console.log("✅ club_tasks table exists and is accessible!");
    }
    
    // Test members table with sample data
    if (!membersError) {
      const { data: membersSample, error: membersSampleError } = await supabase
        .from("members")
        .select("id, club_id, role, first_name, last_name")
        .limit(5);
      
      if (membersSampleError) {
        console.error("❌ Error fetching members sample:", membersSampleError);
      } else {
        console.log("✅ Members sample:", membersSample);
      }
    }
    
    // Test club_tasks table with sample data
    if (!tasksError) {
      const { data: tasksSample, error: tasksSampleError } = await supabase
        .from("club_tasks")
        .select("*")
        .limit(5);
      
      if (tasksSampleError) {
        console.error("❌ Error fetching club_tasks sample:", tasksSampleError);
      } else {
        console.log("✅ Tasks sample:", tasksSample);
      }
    }
    
  } catch (error) {
    console.error("❌ Database debug failed:", error);
  }
}

/**
 * Test creating a simple todo (if table exists)
 */
export async function testCreateTodo() {
  try {
    console.log("🧪 Testing todo creation...");
    
    // Get current user first
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("❌ No authenticated user for test");
      return null;
    }
    
    // Get user's club membership
    const { data: membership, error: membershipError } = await supabase
      .from("members")
      .select("club_id, role")
      .eq("user_id", user.id)
      .limit(1)
      .single();
    
    if (membershipError || !membership) {
      console.error("❌ User not found in members table:", membershipError);
      return null;
    }
    
    console.log("🧪 Creating todo for club:", membership.club_id, "with user:", user.id);
    
    const { data, error } = await supabase
      .from("club_tasks")
      .insert({
        club_id: membership.club_id,
        title: "Test Task",
        description: "Testing database connection",
        priority: "medium",
        status: "todo",
        created_by: user.id,
      })
      .select()
      .single();
    
    if (error) {
      console.error("❌ Error creating test todo:", {
        error: error,
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
        fullError: JSON.stringify(error, null, 2)
      });
      return null;
    }
    
    console.log("✅ Test todo created:", data);
    return data;
  } catch (error) {
    console.error("❌ Test create failed:", error);
    return null;
  }
}
