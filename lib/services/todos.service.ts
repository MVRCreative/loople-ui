import { Todo, ApiTodo } from "@/lib/types";
import { supabase } from "@/lib/supabase";

/**
 * Supabase todo management service
 * Uses Supabase database for persistence
 */

/**
 * Transform API todo to UI todo format
 */
function transformApiTodoToTodo(apiTodo: ApiTodo): Todo {
  return {
    id: apiTodo.id,
    title: apiTodo.title,
    description: apiTodo.description || undefined,
    assignee_id: apiTodo.assignee_id || undefined,
    assignee_name: apiTodo.assignee_name,
    assignee_avatar: apiTodo.assignee_avatar,
    due_date: apiTodo.due_date || undefined,
    priority: apiTodo.priority,
    status: updateOverdueStatus(apiTodo).status,
    created_by: apiTodo.created_by,
    created_at: apiTodo.created_at,
    updated_at: apiTodo.updated_at,
  };
}

/**
 * Get all todos for a specific club from Supabase
 */
export async function getTodosByClubId(clubId: number): Promise<Todo[]> {
  try {
    const { data, error } = await supabase
      .from("club_tasks")
      .select("*")
      .eq("club_id", clubId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching todos:", {
        error,
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code
      });
      return [];
    }

    return (data || []).map((todo: {
      id: string;
      club_id: number;
      title: string;
      description: string | null;
      assignee_id: string | null;
      due_date: string | null;
      priority: "low" | "medium" | "high" | "urgent";
      status: "todo" | "in-progress" | "completed" | "overdue";
      created_by: string;
      created_at: string;
      updated_at: string;
    }) => {
      const apiTodo: ApiTodo = {
        id: todo.id,
        club_id: todo.club_id,
        title: todo.title,
        description: todo.description,
        assignee_id: todo.assignee_id,
        due_date: todo.due_date,
        priority: todo.priority,
        status: todo.status,
        created_by: todo.created_by,
        created_at: todo.created_at,
        updated_at: todo.updated_at,
        // For now, we'll fetch assignee names separately if needed
        assignee_name: undefined,
        assignee_avatar: undefined,
      };
      
      return transformApiTodoToTodo(apiTodo);
    });
  } catch (error) {
    console.error("Error fetching todos:", error);
    return [];
  }
}

/**
 * Check if a todo is overdue and update its status
 */
function updateOverdueStatus(todo: ApiTodo): ApiTodo {
  if (todo.status === "completed") return todo;
  
  if (todo.due_date) {
    const dueDate = new Date(todo.due_date);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    
    if (dueDate < now && todo.status !== "overdue") {
      return { ...todo, status: "overdue" };
    }
  }
  
  return todo;
}

/**
 * Create a new todo in Supabase
 */
export async function createTodo(
  clubId: number,
  title: string,
  description: string | undefined,
  assigneeId: string | undefined,
  dueDate: string | undefined,
  priority: "low" | "medium" | "high" | "urgent",
  createdBy: string
): Promise<Todo | null> {
  try {
    console.log("🔍 Attempting to create todo with data:", {
      clubId,
      title,
      description,
      assigneeId,
      dueDate,
      priority,
      createdBy
    });

    const { data, error } = await supabase
      .from("club_tasks")
      .insert({
        club_id: clubId,
        title,
        description: description || null,
        assignee_id: assigneeId || null,
        due_date: dueDate || null,
        priority,
        status: "todo",
        created_by: createdBy,
      })
      .select("*")
      .single();

    if (error) {
      console.error("❌ Error creating todo:", {
        error: error,
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
        fullError: JSON.stringify(error, null, 2),
        errorType: typeof error,
        errorKeys: error ? Object.keys(error) : 'no keys'
      });
      return null;
    }

    console.log("✅ Todo created successfully:", data);

    const apiTodo: ApiTodo = {
      id: data.id,
      club_id: data.club_id,
      title: data.title,
      description: data.description,
      assignee_id: data.assignee_id,
      due_date: data.due_date,
      priority: data.priority,
      status: data.status,
      created_by: data.created_by,
      created_at: data.created_at,
      updated_at: data.updated_at,
      // For now, we'll fetch assignee names separately if needed
      assignee_name: undefined,
      assignee_avatar: undefined,
    };

    return transformApiTodoToTodo(apiTodo);
  } catch (error) {
    console.error("Error creating todo:", error);
    return null;
  }
}

/**
 * Update an existing todo in Supabase
 */
export async function updateTodo(id: string, updates: Partial<Todo>): Promise<Todo | null> {
  try {
    const updateData: {
      title?: string;
      description?: string | null;
      assignee_id?: string | null;
      due_date?: string | null;
      priority?: "low" | "medium" | "high" | "urgent";
      status?: "todo" | "in-progress" | "completed" | "overdue";
      updated_at: string;
    } = {
      updated_at: new Date().toISOString(),
    };

    if (updates.title) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description || null;
    if (updates.assignee_id !== undefined) updateData.assignee_id = updates.assignee_id || null;
    if (updates.due_date !== undefined) updateData.due_date = updates.due_date || null;
    if (updates.priority) updateData.priority = updates.priority;
    if (updates.status) updateData.status = updates.status;

    const { data, error } = await supabase
      .from("club_tasks")
      .update(updateData)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("Error updating todo:", error);
      return null;
    }

    const apiTodo: ApiTodo = {
      id: data.id,
      club_id: data.club_id,
      title: data.title,
      description: data.description,
      assignee_id: data.assignee_id,
      due_date: data.due_date,
      priority: data.priority,
      status: data.status,
      created_by: data.created_by,
      created_at: data.created_at,
      updated_at: data.updated_at,
      // For now, we'll fetch assignee names separately if needed
      assignee_name: undefined,
      assignee_avatar: undefined,
    };

    return transformApiTodoToTodo(apiTodo);
  } catch (error) {
    console.error("Error updating todo:", error);
    return null;
  }
}

/**
 * Delete a todo from Supabase
 */
export async function deleteTodo(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("club_tasks")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting todo:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error deleting todo:", error);
    return false;
  }
}

/**
 * Get overdue todos for a specific club
 */
export async function getOverdueTodos(clubId: number): Promise<Todo[]> {
  const todos = await getTodosByClubId(clubId);
  return todos.filter((todo) => todo.status === "overdue");
}

/**
 * Get todo statistics for a specific club
 */
export async function getTodoStats(clubId: number) {
  const todos = await getTodosByClubId(clubId);
  
  return {
    total: todos.length,
    todo: todos.filter((t) => t.status === "todo").length,
    inProgress: todos.filter((t) => t.status === "in-progress").length,
    completed: todos.filter((t) => t.status === "completed").length,
    overdue: todos.filter((t) => t.status === "overdue").length,
  };
}


