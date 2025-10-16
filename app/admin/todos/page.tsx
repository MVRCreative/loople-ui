"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { TodoStats } from "@/components/admin/todos/todo-stats";
import { TodoList } from "@/components/admin/todos/todo-list";
import { TodoForm } from "@/components/admin/todos/todo-form";
import { Todo } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import { useClub } from "@/lib/club-context";
import { getAdminUsers, AdminUser } from "@/lib/services/admin-users.service";
import {
  getTodosByClubId,
  createTodo,
  updateTodo,
  deleteTodo,
  getTodoStats,
} from "@/lib/services/todos.service";
import { toast } from "sonner";
import { debugDatabase, testCreateTodo } from "@/lib/services/debug-db";

interface TodoFormData {
  title: string;
  description?: string;
  assignee_id?: string;
  assignee?: AdminUser;
  due_date?: Date;
  priority: "low" | "medium" | "high" | "urgent";
  status: "todo" | "in-progress" | "completed" | "overdue";
}

export default function TodosPage() {
  const { user } = useAuth();
  const { selectedClub } = useClub();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    todo: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0,
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [loading, setLoading] = useState(true);

  // Load todos, admin users, and stats
  const loadData = async () => {
    if (!selectedClub) return;
    
    setLoading(true);
    try {
      const [loadedTodos, loadedStats, loadedAdmins] = await Promise.all([
        getTodosByClubId(selectedClub.id),
        getTodoStats(selectedClub.id),
        getAdminUsers(selectedClub.id),
      ]);
      
      setTodos(loadedTodos);
      setStats(loadedStats);
      setAdminUsers(loadedAdmins);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedClub]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreateTodo = async (data: TodoFormData) => {
    if (!user?.id || !selectedClub) {
      toast.error("You must be logged in to create tasks");
      return;
    }

    try {
      const newTodo = await createTodo(
        selectedClub.id,
        data.title,
        data.description,
        data.assignee_id,
        data.due_date ? data.due_date.toISOString() : undefined,
        data.priority,
        user.id
      );

      if (newTodo) {
        await loadData();
        setDialogOpen(false);
        toast.success("Task created successfully");
      } else {
        toast.error("Failed to create task");
      }
    } catch (error) {
      console.error("Error creating todo:", error);
      toast.error("Failed to create task");
    }
  };

  const handleUpdateTodo = async (data: TodoFormData) => {
    if (!editingTodo) return;

    try {
      const updatedTodo = await updateTodo(editingTodo.id, {
        title: data.title,
        description: data.description,
        assignee_id: data.assignee_id,
        due_date: data.due_date ? data.due_date.toISOString() : undefined,
        priority: data.priority,
        status: data.status,
      });

      if (updatedTodo) {
        await loadData();
        setDialogOpen(false);
        setEditingTodo(null);
        toast.success("Task updated successfully");
      } else {
        toast.error("Failed to update task");
      }
    } catch (error) {
      console.error("Error updating todo:", error);
      toast.error("Failed to update task");
    }
  };

  const handleSubmit = (data: TodoFormData) => {
    if (editingTodo) {
      handleUpdateTodo(data);
    } else {
      handleCreateTodo(data);
    }
  };

  const handleEdit = (todo: Todo) => {
    setEditingTodo(todo);
    setDialogOpen(true);
  };

  const handleDelete = async (todo: Todo) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      try {
        const success = await deleteTodo(todo.id);
        if (success) {
          await loadData();
          toast.success("Task deleted successfully");
        } else {
          toast.error("Failed to delete task");
        }
      } catch (error) {
        console.error("Error deleting todo:", error);
        toast.error("Failed to delete task");
      }
    }
  };

  const handleToggleComplete = async (todo: Todo) => {
    try {
      const newStatus = todo.status === "completed" ? "todo" : "completed";
      const updatedTodo = await updateTodo(todo.id, { status: newStatus });
      if (updatedTodo) {
        await loadData();
        toast.success(newStatus === "completed" ? "Task completed!" : "Task marked as incomplete");
      } else {
        toast.error("Failed to update task status");
      }
    } catch (error) {
      console.error("Error toggling todo status:", error);
      toast.error("Failed to update task status");
    }
  };

  const handleOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingTodo(null);
    }
  };

  const handleDebugDatabase = async () => {
    console.log("🔍 Starting database debug...");
    await debugDatabase();
  };

  const handleTestCreate = async () => {
    console.log("🧪 Testing todo creation...");
    const result = await testCreateTodo();
    if (result) {
      toast.success("Test todo created successfully!");
      await loadData(); // Reload the list
    } else {
      toast.error("Failed to create test todo");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 -m-6 p-6">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div className="sm:flex-auto">
            <h1 className="text-base font-semibold text-foreground">Tasks</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Loading tasks...
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 -m-6 p-6">
      {/* Page Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold text-foreground">Tasks</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage and track administrative tasks for your club
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none flex gap-2">
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
          <Button variant="outline" onClick={handleDebugDatabase}>
            Debug DB
          </Button>
          <Button variant="outline" onClick={handleTestCreate}>
            Test Create
          </Button>
        </div>
      </div>

      {/* Stats */}
      <TodoStats stats={stats} />

      {/* Todo List */}
      <TodoList todos={todos} onEdit={handleEdit} onDelete={handleDelete} onToggleComplete={handleToggleComplete} />

      {/* Todo Form Dialog */}
      <TodoForm
        open={dialogOpen}
        onOpenChange={handleOpenChange}
        onSubmit={handleSubmit}
        adminUsers={adminUsers}
        editingTodo={editingTodo}
      />
    </div>
  );
}