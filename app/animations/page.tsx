"use client";

import { AnimatedText, AnimatedList, AnimatedListItem, FadeIn } from "@/components/ui/animated";
import { Button } from "@/components/ui/button";
import { ThemeSwitch } from "@/components/ui/theme-switch";
import Link from "next/link";
import { SidebarInset, SidebarTrigger, SidebarProvider } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { AppSidebar } from "@/components/app-sidebar";

export default function AnimationsPage() {
  return (
    <SidebarProvider>
      <AppSidebar />
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
        <div className="max-w-4xl space-y-12">
          {/* Header */}
          <div className="text-left space-y-4">
            <AnimatedText className="text-5xl font-bold text-foreground">
              GSAP Animations
            </AnimatedText>
            <AnimatedText delay={0.2} className="text-xl text-muted-foreground">
              Subtle, performant animations for your UI components
            </AnimatedText>
          </div>

          {/* Back to main */}
          <div className="flex items-center">
            <Link href="/">
              <Button variant="outline" suppressHydrationWarning>← Back to Main</Button>
            </Link>
          </div>

          {/* Text Animations */}
          <section className="space-y-6">
            <AnimatedText className="text-3xl font-bold text-foreground">
              Text Animations
            </AnimatedText>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AnimatedText delay={0.1} className="p-6 bg-card rounded-lg border border-border">
                <h3 className="text-lg font-semibold mb-2">Fade In + Slide Up</h3>
                <p className="text-muted-foreground">
                  This text animates in with a subtle fade and slide effect.
                </p>
              </AnimatedText>
              
              <AnimatedText delay={0.3} className="p-6 bg-card rounded-lg border border-border">
                <h3 className="text-lg font-semibold mb-2">Staggered Delay</h3>
                <p className="text-muted-foreground">
                  This text appears after a longer delay for staggered effects.
                </p>
              </AnimatedText>
            </div>
          </section>

          {/* List Animations */}
          <section className="space-y-6">
            <AnimatedText className="text-3xl font-bold text-foreground">
              Staggered List Animations
            </AnimatedText>
            
            <AnimatedList staggerDelay={0.15} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <AnimatedListItem>
                <div className="p-4 bg-card rounded-lg border border-border">
                  <div className="text-2xl mb-2">🎯</div>
                  <h4 className="font-semibold">Item 1</h4>
                  <p className="text-sm text-muted-foreground">Staggered animation</p>
                </div>
              </AnimatedListItem>
              
              <AnimatedListItem>
                <div className="p-4 bg-card rounded-lg border border-border">
                  <div className="text-2xl mb-2">✨</div>
                  <h4 className="font-semibold">Item 2</h4>
                  <p className="text-sm text-muted-foreground">Smooth transitions</p>
                </div>
              </AnimatedListItem>
              
              <AnimatedListItem>
                <div className="p-4 bg-card rounded-lg border border-border">
                  <div className="text-2xl mb-2">🚀</div>
                  <h4 className="font-semibold">Item 3</h4>
                  <p className="text-sm text-muted-foreground">Performance focused</p>
                </div>
              </AnimatedListItem>
            </AnimatedList>
          </section>

          {/* Fade In Effects */}
          <section className="space-y-6">
            <AnimatedText className="text-3xl font-bold text-foreground">
              Fade In Effects
            </AnimatedText>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FadeIn className="p-6 bg-card rounded-lg border border-border">
                <h3 className="text-lg font-semibold mb-2">Simple Fade</h3>
                <p className="text-muted-foreground">
                  Clean fade-in effect with subtle slide up.
                </p>
              </FadeIn>
              
              <FadeIn scale delay={0.2} className="p-6 bg-card rounded-lg border border-border">
                <h3 className="text-lg font-semibold mb-2">Scale + Fade</h3>
                <p className="text-muted-foreground">
                  Combines fade with a subtle scale effect.
                </p>
              </FadeIn>
            </div>
          </section>

          {/* Animation Controls */}
          <section className="space-y-6">
            <AnimatedText className="text-3xl font-bold text-foreground">
              Customizable Parameters
            </AnimatedText>
            
            <div className="p-6 bg-card rounded-lg border border-border">
              <h3 className="text-lg font-semibold mb-4">Animation Options</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium mb-2">Timing</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• <code>delay</code>: Start delay in seconds</li>
                    <li>• <code>duration</code>: Animation length</li>
                    <li>• <code>staggerDelay</code>: Delay between list items</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Effects</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• <code>y</code>: Vertical slide distance</li>
                    <li>• <code>scale</code>: Subtle scale effect</li>
                    <li>• <code>ease</code>: Power2.out easing</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
