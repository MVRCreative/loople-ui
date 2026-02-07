"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { AdminLayoutWrapper } from "@/components/admin/admin-layout-wrapper"
import { CreateClubStepsSidebar } from "@/components/create-club/create-club-steps"
import { useAuth } from "@/lib/auth-context"
import { useState, createContext, useContext } from "react"

// Create context for step navigation
interface StepContextType {
  currentStep: number
  setCurrentStep: (step: number) => void
}

const StepContext = createContext<StepContextType | undefined>(undefined)

export const useStepNavigation = () => {
  const context = useContext(StepContext)
  if (!context) {
    throw new Error("useStepNavigation must be used within StepContext")
  }
  return context
}

export default function CreateClubLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)

  // Redirect to login if not authenticated (match admin behavior)
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login")
    }
  }, [isAuthenticated, authLoading, router])

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect via useEffect
  }

  return (
    <StepContext.Provider value={{ currentStep, setCurrentStep }}>
      <AdminLayoutWrapper
        sidebarContent={
          <CreateClubStepsSidebar
            currentStep={currentStep}
            onStepClick={setCurrentStep}
          />
        }
      >
        {children}
      </AdminLayoutWrapper>
    </StepContext.Provider>
  )
}
