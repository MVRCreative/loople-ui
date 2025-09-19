"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Image as ImageIcon, UserRound, ChevronDown } from "lucide-react"

export interface ProfileFormValues {
  // persisted fields
  email: string
  avatar_url?: string
  first_name?: string
  last_name?: string
  // non-persisted demo fields
  username?: string
  about?: string
  country?: string
  street_address?: string
  city?: string
  region?: string
  postal_code?: string
  notify_comments?: boolean
  notify_candidates?: boolean
  notify_offers?: boolean
  push_notifications?: "everything" | "same_as_email" | "none"
}

export default function ProfileForm({ initialData }: { initialData: ProfileFormValues }) {
  const [status, setStatus] = React.useState<"idle" | "saving" | "saved" | "error">("idle")
  const [message, setMessage] = React.useState<string | null>(null)

  const [derivedFirst, derivedLast] = React.useMemo(() => {
    const full = (initialData as { full_name?: string }).full_name || ""
    const parts = full.trim().split(" ")
    if (parts.length === 0) return ["", ""] as const
    if (parts.length === 1) return [parts[0] || "", ""] as const
    const last = parts.pop() as string
    return [parts.join(" "), last] as const
  }, [initialData])

  const [formData, setFormData] = React.useState<ProfileFormValues>({
    email: initialData.email,
    avatar_url: initialData.avatar_url ?? "",
    first_name: derivedFirst,
    last_name: derivedLast,
    username: "",
    about: "",
    country: "United States",
    street_address: "",
    city: "",
    region: "",
    postal_code: "",
    notify_comments: true,
    notify_candidates: false,
    notify_offers: false,
    push_notifications: "everything",
  })

  const [errors, setErrors] = React.useState<Partial<Record<keyof ProfileFormValues, string>>>({})

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ProfileFormValues, string>> = {}
    
    // Email validation
    if (!formData.email) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }
    
    // Avatar URL validation
    if (formData.avatar_url && !/^https?:\/\/.+/.test(formData.avatar_url)) {
      newErrors.avatar_url = "Please enter a valid URL"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof ProfileFormValues, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setStatus("saving")
    setMessage(null)
    
    try {
      // Mock save - simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setStatus("saved")
      setMessage("Profile updated.")
    } catch {
      setStatus("error")
      setMessage("Failed to update profile. Please try again.")
    }
  }

  const handleReset = () => {
    setFormData({
      email: initialData.email,
      avatar_url: initialData.avatar_url ?? "",
      first_name: derivedFirst,
      last_name: derivedLast,
      username: "",
      about: "",
      country: "United States",
      street_address: "",
      city: "",
      region: "",
      postal_code: "",
      notify_comments: true,
      notify_candidates: false,
      notify_offers: false,
      push_notifications: "everything",
    })
    setStatus("idle")
    setMessage(null)
    setErrors({})
  }

  return (
    <form onSubmit={onSubmit} className="bg-card border border-border rounded-lg p-6 shadow-xs">
      <div className="space-y-12">
        {/* Profile */}
        <div className="border-b border-border pb-12">
          <h2 className="text-base font-semibold text-foreground">Profile</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            This information will be displayed publicly so be careful what you share.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <div className="sm:col-span-4">
              <Label htmlFor="username" className="block">Username</Label>
              <div className="mt-2">
                <div className="flex items-center rounded-md bg-background pl-3 border border-input focus-within:ring-ring/50 focus-within:ring-[3px] focus-within:border-ring">
                  <div className="shrink-0 text-sm text-muted-foreground select-none">workcation.com/</div>
                  <input
                    id="username"
                    value={formData.username || ""}
                    onChange={(e) => handleInputChange("username", e.target.value)}
                    type="text"
                    placeholder="janesmith"
                    className="block min-w-0 grow bg-background py-1.5 pr-3 pl-1 text-base text-foreground placeholder:text-muted-foreground focus:outline-none sm:text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="col-span-full">
              <Label htmlFor="about" className="block">About</Label>
              <div className="mt-2">
                <textarea
                  id="about"
                  value={formData.about || ""}
                  onChange={(e) => handleInputChange("about", e.target.value)}
                  rows={3}
                  className="block w-full rounded-md bg-background px-3 py-1.5 text-base text-foreground border border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] sm:text-sm"
                />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">Write a few sentences about yourself.</p>
            </div>

            <div className="col-span-full">
              <Label htmlFor="photo" className="block">Photo</Label>
              <div className="mt-2 flex items-center gap-x-3">
                <Avatar className="h-12 w-12 rounded-lg">
                  <AvatarImage src={formData.avatar_url || ""} alt="Avatar preview" />
                  <AvatarFallback className="rounded-lg"><UserRound className="h-6 w-6" /></AvatarFallback>
                </Avatar>
                <Button type="button" variant="outline">Change</Button>
              </div>
            </div>

            <div className="col-span-full">
              <Label htmlFor="cover-photo" className="block">Cover photo</Label>
              <div className="mt-2 flex justify-center rounded-lg border border-dashed border-border px-6 py-10">
                <div className="text-center">
                  <ImageIcon aria-hidden className="mx-auto h-12 w-12 text-muted-foreground" />
                  <div className="mt-4 flex text-sm text-muted-foreground items-center justify-center gap-1">
                    <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-semibold text-primary hover:opacity-90">
                      <span>Upload a file</span>
                      <input id="file-upload" name="file-upload" type="file" className="sr-only" />
                    </label>
                    <p>or drag and drop</p>
                  </div>
                  <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 10MB</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="border-b border-border pb-12">
          <h2 className="text-base font-semibold text-foreground">Personal Information</h2>
          <p className="mt-1 text-sm text-muted-foreground">Use a permanent address where you can receive mail.</p>

          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <Label htmlFor="first-name" className="block">First name</Label>
              <div className="mt-2">
                <Input 
                  id="first-name" 
                  value={formData.first_name || ""}
                  onChange={(e) => handleInputChange("first_name", e.target.value)}
                  autoComplete="given-name" 
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <Label htmlFor="last-name" className="block">Last name</Label>
              <div className="mt-2">
                <Input 
                  id="last-name" 
                  value={formData.last_name || ""}
                  onChange={(e) => handleInputChange("last_name", e.target.value)}
                  autoComplete="family-name" 
                />
              </div>
            </div>

            <div className="sm:col-span-4">
              <Label htmlFor="email" className="block">Email address</Label>
              <div className="mt-2">
                <Input 
                  id="email" 
                  type="email" 
                  autoComplete="email" 
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  disabled 
                  className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-destructive">{errors.email}</p>
                )}
              </div>
            </div>

            <div className="sm:col-span-3">
              <Label htmlFor="country" className="block">Country</Label>
              <div className="mt-2 grid grid-cols-1 relative">
                <select
                  id="country"
                  value={formData.country || ""}
                  onChange={(e) => handleInputChange("country", e.target.value)}
                  className="w-full appearance-none rounded-md bg-background py-1.5 pr-8 pl-3 text-base text-foreground border border-input focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] sm:text-sm"
                >
                  <option>United States</option>
                  <option>Canada</option>
                  <option>Mexico</option>
                </select>
                <ChevronDown aria-hidden className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <div className="col-span-full">
              <Label htmlFor="street-address" className="block">Street address</Label>
              <div className="mt-2">
                <Input 
                  id="street-address" 
                  value={formData.street_address || ""}
                  onChange={(e) => handleInputChange("street_address", e.target.value)}
                  autoComplete="street-address" 
                />
              </div>
            </div>

            <div className="sm:col-span-2 sm:col-start-1">
              <Label htmlFor="city" className="block">City</Label>
              <div className="mt-2">
                <Input 
                  id="city" 
                  value={formData.city || ""}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  autoComplete="address-level2" 
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="region" className="block">State / Province</Label>
              <div className="mt-2">
                <Input 
                  id="region" 
                  value={formData.region || ""}
                  onChange={(e) => handleInputChange("region", e.target.value)}
                  autoComplete="address-level1" 
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="postal-code" className="block">ZIP / Postal code</Label>
              <div className="mt-2">
                <Input 
                  id="postal-code" 
                  value={formData.postal_code || ""}
                  onChange={(e) => handleInputChange("postal_code", e.target.value)}
                  autoComplete="postal-code" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="border-b border-border pb-12">
          <h2 className="text-base font-semibold text-foreground">Notifications</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            We&apos;ll always let you know about important changes, but you pick what else you want to hear about.
          </p>

          <div className="mt-10 space-y-10">
            <fieldset>
              <legend className="text-sm font-semibold text-foreground">By email</legend>
              <div className="mt-6 space-y-6">
                <label className="flex gap-3 items-start">
                  <input 
                    type="checkbox" 
                    checked={formData.notify_comments || false}
                    onChange={(e) => handleInputChange("notify_comments", e.target.checked)}
                    className="mt-1 h-4 w-4 rounded-sm border border-input bg-background focus-visible:ring-ring/50 focus-visible:ring-[3px]" 
                  />
                  <div className="text-sm">
                    <div className="font-medium text-foreground">Comments</div>
                    <p className="text-muted-foreground">Get notified when someone posts a comment on a posting.</p>
                  </div>
                </label>
                <label className="flex gap-3 items-start">
                  <input 
                    type="checkbox" 
                    checked={formData.notify_candidates || false}
                    onChange={(e) => handleInputChange("notify_candidates", e.target.checked)}
                    className="mt-1 h-4 w-4 rounded-sm border border-input bg-background focus-visible:ring-ring/50 focus-visible:ring-[3px]" 
                  />
                  <div className="text-sm">
                    <div className="font-medium text-foreground">Candidates</div>
                    <p className="text-muted-foreground">Get notified when a candidate applies for a job.</p>
                  </div>
                </label>
                <label className="flex gap-3 items-start">
                  <input 
                    type="checkbox" 
                    checked={formData.notify_offers || false}
                    onChange={(e) => handleInputChange("notify_offers", e.target.checked)}
                    className="mt-1 h-4 w-4 rounded-sm border border-input bg-background focus-visible:ring-ring/50 focus-visible:ring-[3px]" 
                  />
                  <div className="text-sm">
                    <div className="font-medium text-foreground">Offers</div>
                    <p className="text-muted-foreground">Get notified when a candidate accepts or rejects an offer.</p>
                  </div>
                </label>
              </div>
            </fieldset>

            <fieldset>
              <legend className="text-sm font-semibold text-foreground">Push notifications</legend>
              <p className="mt-1 text-sm text-muted-foreground">These are delivered via SMS to your mobile phone.</p>
              <div className="mt-6 space-y-3">
                <label className="flex items-center gap-x-3">
                  <input 
                    type="radio" 
                    value="everything" 
                    checked={formData.push_notifications === "everything"}
                    onChange={(e) => handleInputChange("push_notifications", e.target.value as "everything" | "same_as_email" | "none")}
                    className="h-4 w-4 rounded-full border border-input bg-background focus-visible:ring-ring/50 focus-visible:ring-[3px]" 
                  />
                  <span className="text-sm text-foreground">Everything</span>
                </label>
                <label className="flex items-center gap-x-3">
                  <input 
                    type="radio" 
                    value="same_as_email" 
                    checked={formData.push_notifications === "same_as_email"}
                    onChange={(e) => handleInputChange("push_notifications", e.target.value as "everything" | "same_as_email" | "none")}
                    className="h-4 w-4 rounded-full border border-input bg-background focus-visible:ring-ring/50 focus-visible:ring-[3px]" 
                  />
                  <span className="text-sm text-foreground">Same as email</span>
                </label>
                <label className="flex items-center gap-x-3">
                  <input 
                    type="radio" 
                    value="none" 
                    checked={formData.push_notifications === "none"}
                    onChange={(e) => handleInputChange("push_notifications", e.target.value as "everything" | "same_as_email" | "none")}
                    className="h-4 w-4 rounded-full border border-input bg-background focus-visible:ring-ring/50 focus-visible:ring-[3px]" 
                  />
                  <span className="text-sm text-foreground">No push notifications</span>
                </label>
              </div>
            </fieldset>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-x-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={status === "saving"}>
          {status === "saving" ? "Saving…" : "Save"}
        </Button>
      </div>

      {message && (
        <div className={`mt-3 text-sm ${status === "error" ? "text-destructive" : "text-muted-foreground"}`} role={status === "error" ? "alert" : undefined}>
          {message}
        </div>
      )}
    </form>
  )
}