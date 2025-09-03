"use client";


import { ThemeToggle } from "@/components/theme-toggle";
import { ThemeSwitch } from "@/components/ui/theme-switch";
import { Button } from "@/components/ui/button";

import { AnimatedText, AnimatedList, AnimatedListItem, FadeIn } from "@/components/ui/animated";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { ClientOnly } from "@/components/ui/client-only";

const formSchema = z.object({
  username: z.string().min(2, "Username must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export default function Page() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
      message: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    toast.success("Form submitted successfully!", {
      description: `Username: ${values.username}, Email: ${values.email}`,
    });
    console.log(values);
  };

  const showToast = (type: "success" | "error" | "info") => {
    switch (type) {
      case "success":
        toast.success("Success toast!", { description: "This is a success message" });
        break;
      case "error":
        toast.error("Error toast!", { description: "This is an error message" });
        break;
      case "info":
        toast.info("Info toast!", { description: "This is an info message" });
        break;
    }
  };

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <div className="flex items-center gap-4">
            <ThemeSwitch />
          </div>
        </div>
      </header>
      
      <main className="flex flex-1 flex-col gap-4 p-7 pt-8">
        {/* Overview Section */}
        <div id="overview" className="space-y-8">
          <div className="text-left space-y-4">
            <AnimatedText className="text-4xl font-bold text-foreground">
              Mover Labs Design System
            </AnimatedText>
            <AnimatedText delay={0.2} className="text-xl text-muted-foreground max-w-2xl">
              A comprehensive design system built with Tailwind v4, featuring OKLCH color tokens, 
              dark mode support, and a complete component library.
            </AnimatedText>
          </div>

          <AnimatedList staggerDelay={0.1} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <AnimatedListItem>
              <FadeIn scale className="p-6 bg-card rounded-lg border border-border">
                <h3 className="text-lg font-semibold text-card-foreground mb-2">🎨 Design Tokens</h3>
                <p className="text-muted-foreground">
                  Consistent color system using OKLCH color space for better perceptual uniformity.
                </p>
              </FadeIn>
            </AnimatedListItem>
            <AnimatedListItem>
              <FadeIn scale delay={0.1} className="p-6 bg-card rounded-lg border border-border">
                <h3 className="text-lg font-semibold text-card-foreground mb-2">🌙 Dark Mode</h3>
                <p className="text-muted-foreground">
                  Seamless theme switching with automatic color adaptation and optimal contrast.
                </p>
              </FadeIn>
            </AnimatedListItem>
            <AnimatedListItem>
              <FadeIn scale delay={0.2} className="p-6 bg-card rounded-lg border border-border">
                <h3 className="text-lg font-semibold text-card-foreground mb-2">🧩 Components</h3>
                <p className="text-muted-foreground">
                  Full component library built with Radix UI primitives and accessible by default.
                </p>
              </FadeIn>
            </AnimatedListItem>
          </AnimatedList>
        </div>

        {/* Components Section */}
        <div id="components" className="space-y-8">
          <AnimatedText className="text-3xl font-bold text-foreground">Component Library</AnimatedText>
          
          {/* Button Variants */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-foreground">Button Variants</h3>
            <div className="flex flex-wrap gap-4">
              <Button>Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
            </div>
            <div className="flex flex-wrap gap-4">
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large</Button>
              <Button size="icon">🎯</Button>
            </div>
          </div>

          {/* Toast Demo */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-foreground">Toast Notifications</h3>
            <div className="flex gap-4">
              <Button onClick={() => showToast("success")} variant="outline">
                Success Toast
              </Button>
              <Button onClick={() => showToast("error")} variant="outline">
                Error Toast
              </Button>
              <Button onClick={() => showToast("info")} variant="outline">
                Info Toast
              </Button>
            </div>
          </div>
        </div>

        {/* Color Tokens Section */}
        <div id="tokens" className="space-y-8">
          <AnimatedText className="text-3xl font-bold text-foreground">OKLCH Color Tokens</AnimatedText>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Primary Colors */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-foreground">Primary Colors</h3>
              <div className="space-y-2">
                <div className="h-16 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-medium">Primary</span>
                </div>
                <div className="h-16 rounded-lg bg-secondary flex items-center justify-center">
                  <span className="text-secondary-foreground font-medium">Secondary</span>
                </div>
                <div className="h-16 rounded-lg bg-accent flex items-center justify-center">
                  <span className="text-accent-foreground font-medium">Accent</span>
                </div>
              </div>
            </div>

            {/* Background Colors */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-foreground">Background Colors</h3>
              <div className="space-y-2">
                <div className="h-16 rounded-lg bg-background border border-border flex items-center justify-center">
                  <span className="text-foreground font-medium">Background</span>
                </div>
                <div className="h-16 rounded-lg bg-card border border-border flex items-center justify-center">
                  <span className="text-card-foreground font-medium">Card</span>
                </div>
                <div className="h-16 rounded-lg bg-muted flex items-center justify-center">
                  <span className="text-muted-foreground font-medium">Muted</span>
                </div>
              </div>
            </div>

            {/* Utility Colors */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-foreground">Utility Colors</h3>
              <div className="space-y-2">
                <div className="h-16 rounded-lg bg-destructive flex items-center justify-center">
                  <span className="text-destructive-foreground font-medium">Destructive</span>
                </div>
                <div className="h-16 rounded-lg bg-border flex items-center justify-center">
                  <span className="text-foreground font-medium">Border</span>
                </div>
                <div className="h-16 rounded-lg bg-ring flex items-center justify-center">
                  <span className="text-ring-foreground font-medium">Ring</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-card rounded-lg border border-border">
            <h3 className="text-lg font-semibold text-card-foreground mb-2">
              Current Theme: <span className="text-primary">Light Mode</span>
            </h3>
            <p className="text-muted-foreground">
              Use the theme toggle button in the header to switch between light and dark modes.
              The OKLCH tokens will automatically update to provide optimal contrast and visual hierarchy.
            </p>
          </div>
        </div>

        {/* Forms Section */}
        <div id="forms" className="space-y-8">
          <AnimatedText className="text-3xl font-bold text-foreground">Form Components</AnimatedText>
          
          <div className="max-w-md">
            <ClientOnly fallback={<div className="p-4 bg-muted rounded-lg">Loading form...</div>}>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <input
                            {...field}
                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Enter your username"
                          />
                        </FormControl>
                        <FormDescription>
                          This is your public display name.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <input
                            {...field}
                            type="email"
                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Enter your email"
                          />
                        </FormControl>
                        <FormDescription>
                          We&apos;ll never share your email with anyone else.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message</FormLabel>
                        <FormControl>
                          <textarea
                            {...field}
                            className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            rows={3}
                            placeholder="Enter your message"
                          />
                        </FormControl>
                        <FormDescription>
                          Tell us what you think about our design system.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" className="w-full">
                    Submit Form
                  </Button>
                </form>
              </Form>
            </ClientOnly>
          </div>
        </div>

        {/* Tables Section */}
        <div id="tables" className="space-y-8">
          <AnimatedText className="text-3xl font-bold text-foreground">Table Components</AnimatedText>
          
          <div className="border border-border rounded-lg">
            <Table>
              <TableCaption>A list of recent design tokens and their values.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Token Name</TableHead>
                  <TableHead>Light Mode</TableHead>
                  <TableHead>Dark Mode</TableHead>
                  <TableHead>Usage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Background</TableCell>
                  <TableCell>
                    <div className="w-4 h-4 bg-background border border-border rounded"></div>
                  </TableCell>
                  <TableCell>
                    <div className="w-4 h-4 bg-background border border-border rounded"></div>
                  </TableCell>
                  <TableCell>Page backgrounds, containers</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Primary</TableCell>
                  <TableCell>
                    <div className="w-4 h-4 bg-primary rounded"></div>
                  </TableCell>
                  <TableCell>
                    <div className="w-4 h-4 bg-primary rounded"></div>
                  </TableCell>
                  <TableCell>Buttons, links, highlights</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Secondary</TableCell>
                  <TableCell>
                    <div className="w-4 h-4 bg-secondary rounded"></div>
                  </TableCell>
                  <TableCell>
                    <div className="w-4 h-4 bg-secondary rounded"></div>
                  </TableCell>
                  <TableCell>Secondary actions, borders</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Muted</TableCell>
                  <TableCell>
                    <div className="w-4 h-4 bg-muted rounded"></div>
                  </TableCell>
                  <TableCell>
                    <div className="w-4 h-4 bg-muted rounded"></div>
                  </TableCell>
                  <TableCell>Subtle backgrounds, disabled states</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </main>

      <Toaster />
    </SidebarInset>
  );
}
