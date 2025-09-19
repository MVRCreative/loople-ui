"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useStepNavigation } from "./layout"
import { ChevronDown, Plus, Trash2, ExternalLink, CheckCircle, AlertCircle, Clock } from "lucide-react"

type StepStatus = "complete" | "current" | "upcoming"

interface TeamInvite {
  id: string
  email: string
  role: "Owner" | "Manager" | "Staff"
  note: string
}

export default function CreateClubPage() {
  const { user, isAuthenticated } = useAuth()
  const { currentStep, setCurrentStep } = useStepNavigation()
  const [formData, setFormData] = useState({
    clubName: "",
    subdomain: "",
    description: "",
    contactEmail: "",
    contactPhone: "",
    streetAddress: "",
    city: "",
    state: "",
    zipCode: "",
    estimatedMembers: "",
    stripeStatus: "not_started" as "not_started" | "in_progress" | "ready",
    stripeAccountId: "",
    teamInvites: [] as TeamInvite[],
    newTeamMember: { email: "", role: "Manager" as "Owner" | "Manager" | "Staff" },
    acceptTerms: false
  })

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const addTeamInvite = () => {
    if (!formData.newTeamMember.email.trim()) return
    
    const newInvite: TeamInvite = {
      id: Date.now().toString(),
      email: formData.newTeamMember.email,
      role: formData.newTeamMember.role,
      note: ""
    }
    setFormData(prev => ({
      ...prev,
      teamInvites: [...prev.teamInvites, newInvite],
      newTeamMember: { email: "", role: "Manager" }
    }))
  }

  const removeTeamInvite = (id: string) => {
    setFormData(prev => ({
      ...prev,
      teamInvites: prev.teamInvites.filter(invite => invite.id !== id)
    }))
  }

  const updateTeamInvite = (id: string, field: keyof TeamInvite, value: string) => {
    setFormData(prev => ({
      ...prev,
      teamInvites: prev.teamInvites.map(invite =>
        invite.id === id ? { ...invite, [field]: value } : invite
      )
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Create New Club</h1>
          <p className="text-sm text-muted-foreground">
            Follow the steps to set up your club.
          </p>
        </div>
      </div>

      {/* Step-based form content */}
      <form className="form-container">
        <div className="form-section-spacing">
          {/* Step 1: Account */}
          {currentStep === 1 && (
            <div className="form-section">
              <h2 className="form-section-title">Account</h2>
              <p className="form-section-description">
                Make sure you're signed in to continue creating your club.
              </p>
              <div className="form-grid">
                <div className="form-field-full">
                  {isAuthenticated && user ? (
                    <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-green-800">
                          You're signed in as {user.email}
                        </p>
                        <p className="text-sm text-green-600">Ready to continue.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-yellow-600" />
                        <p className="text-sm text-yellow-800">
                          Please sign in or create an account to continue.
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <button className="form-button-primary">Log in</button>
                        <button className="form-button-secondary">Create account</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Club Basics */}
          {currentStep === 2 && (
            <div className="form-section-no-border">
              <div className="form-grid">
                <div className="form-field-3">
                  <label htmlFor="club-name" className="form-label">Club name *</label>
                  <div className="form-input-wrapper">
                    <input id="club-name" type="text" placeholder="e.g., Newburg Swim Club" className="form-input" value={formData.clubName} onChange={(e) => setFormData(prev => ({ ...prev, clubName: e.target.value }))} />
                  </div>
                </div>
                <div className="form-field-3">
                  <label htmlFor="subdomain" className="form-label">Subdomain *</label>
                  <div className="form-input-wrapper">
                    <div className="form-url-input-wrapper">
                      <div className="form-url-prefix">loople.com/</div>
                      <input id="subdomain" type="text" placeholder="newburg-swim" className="form-url-input" value={formData.subdomain} onChange={(e) => setFormData(prev => ({ ...prev, subdomain: e.target.value }))} />
                    </div>
                  </div>
                </div>
                <div className="form-field-full">
                  <label htmlFor="description" className="form-label">Short description</label>
                  <div className="form-input-wrapper">
                    <textarea id="description" rows={2} placeholder="1-2 sentences about your club" className="form-textarea" value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} />
                  </div>
                </div>
                <div className="form-field-full"><h3 className="form-legend">Primary Contact</h3></div>
                <div className="form-field-3">
                  <label htmlFor="contact-email" className="form-label">Contact email *</label>
                  <div className="form-input-wrapper">
                    <input id="contact-email" type="email" className="form-input" value={formData.contactEmail} onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))} />
                  </div>
                </div>
                <div className="form-field-3">
                  <label htmlFor="contact-phone" className="form-label">Contact phone *</label>
                  <div className="form-input-wrapper">
                    <input id="contact-phone" type="tel" className="form-input" value={formData.contactPhone} onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))} />
                  </div>
                </div>
                <div className="form-field-full"><h3 className="form-legend">Legal Address</h3></div>
                <div className="form-field-full">
                  <label htmlFor="street-address" className="form-label">Street address *</label>
                  <div className="form-input-wrapper">
                    <input id="street-address" type="text" className="form-input" value={formData.streetAddress} onChange={(e) => setFormData(prev => ({ ...prev, streetAddress: e.target.value }))} />
                  </div>
                </div>
                <div className="form-field-2">
                  <label htmlFor="city" className="form-label">City *</label>
                  <div className="form-input-wrapper">
                    <input id="city" type="text" className="form-input" value={formData.city} onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))} />
                  </div>
                </div>
                <div className="form-field-2">
                  <label htmlFor="state" className="form-label">State *</label>
                  <div className="form-select-wrapper">
                    <select id="state" className="form-select" value={formData.state} onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}>
                      <option value="">Select state</option>
                      <option value="CA">California</option>
                      <option value="NY">New York</option>
                      <option value="TX">Texas</option>
                    </select>
                    <ChevronDown className="form-select-icon" />
                  </div>
                </div>
                <div className="form-field-2">
                  <label htmlFor="zip-code" className="form-label">ZIP code *</label>
                  <div className="form-input-wrapper">
                    <input id="zip-code" type="text" className="form-input" value={formData.zipCode} onChange={(e) => setFormData(prev => ({ ...prev, zipCode: e.target.value }))} />
                  </div>
                </div>
                <div className="form-field-full"><h3 className="form-legend">Size</h3></div>
                <div className="form-field-3">
                  <label htmlFor="estimated-members" className="form-label">Estimated number of members *</label>
                  <div className="form-input-wrapper">
                    <input id="estimated-members" type="number" min="1" className="form-input" value={formData.estimatedMembers} onChange={(e) => setFormData(prev => ({ ...prev, estimatedMembers: e.target.value }))} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Payments */}
          {currentStep === 3 && (
            <div className="form-section">
              <h2 className="form-section-title">Payments & Verification</h2>
              <p className="form-section-description">
                Set up payouts through Stripe to receive payments from members.
              </p>
              <div className="form-grid">
                <div className="form-field-full">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {formData.stripeStatus === "not_started" && <Clock className="w-5 h-5 text-gray-400" />}
                          {formData.stripeStatus === "in_progress" && <Clock className="w-5 h-5 text-yellow-500" />}
                          {formData.stripeStatus === "ready" && <CheckCircle className="w-5 h-5 text-green-500" />}
                          <span className="text-sm font-medium">Stripe Connect Status:</span>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          formData.stripeStatus === "not_started" 
                            ? "bg-gray-100 text-gray-700"
                            : formData.stripeStatus === "in_progress"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-green-100 text-green-700"
                        }`}>
                          {formData.stripeStatus === "not_started" && "Not started"}
                          {formData.stripeStatus === "in_progress" && "In progress"}
                          {formData.stripeStatus === "ready" && "Ready"}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        {formData.stripeStatus === "not_started" && (
                          <button type="button" className="form-button-primary flex items-center gap-2" onClick={() => setFormData(prev => ({ ...prev, stripeStatus: "in_progress" }))}>
                            Set up payouts in Stripe <ExternalLink className="w-4 h-4" />
                          </button>
                        )}
                        {formData.stripeStatus === "in_progress" && (
                          <button type="button" className="form-button-secondary flex items-center gap-2" onClick={() => setFormData(prev => ({ ...prev, stripeStatus: "ready" }))}>
                            Resume Stripe setup <ExternalLink className="w-4 h-4" />
                          </button>
                        )}
                        {formData.stripeStatus === "ready" && (
                          <span className="text-sm text-green-600 font-medium">✓ Payouts configured</span>
                        )}
                      </div>
                    </div>
                    {formData.stripeStatus !== "ready" && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>Note:</strong> You can complete Stripe setup later if needed. 
                          Your club will be created, but payouts won't be available until verification is complete.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Team */}
          {currentStep === 4 && (
            <div className="form-section">
              <div className="form-grid">
                <div className="form-field-full">
                  <h3 className="form-legend">Add Team Members</h3>
                  <p className="form-section-description">
                    Invite administrators to help manage your club. You can skip this and add team members later.
                  </p>
                </div>

                {/* Add Team Member Form */}
                <div className="form-field-3">
                  <label htmlFor="team-email" className="form-label">Email address *</label>
                  <div className="form-input-wrapper">
                    <input
                      id="team-email"
                      type="email"
                      placeholder="team@example.com"
                      className="form-input"
                      value={formData.newTeamMember?.email || ""}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        newTeamMember: { ...prev.newTeamMember, email: e.target.value }
                      }))}
                    />
                  </div>
                </div>

                <div className="form-field-2">
                  <label htmlFor="team-role" className="form-label">Account type</label>
                  <div className="form-select-wrapper">
                    <select
                      id="team-role"
                      className="form-select"
                      value={formData.newTeamMember?.role || "Manager"}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        newTeamMember: { ...prev.newTeamMember, role: e.target.value as "Owner" | "Manager" | "Staff" }
                      }))}
                    >
                      <option value="Manager">Manager</option>
                      <option value="Owner">Owner</option>
                      <option value="Staff">Staff</option>
                    </select>
                    <ChevronDown className="form-select-icon" />
                  </div>
                </div>

                <div className="form-field-1 flex items-end">
                  <button
                    type="button"
                    onClick={addTeamInvite}
                    className="form-button-primary flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                </div>

                {/* Team Members Table */}
                {formData.teamInvites.length > 0 && (
                  <div className="form-field-full">
                    <div className="mt-6">
                      <h4 className="form-legend mb-4">Team Members ({formData.teamInvites.length})</h4>
                      <div className="border border-border rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-muted">
                            <tr>
                              <th className="text-left py-3 px-4 font-medium text-sm">Email</th>
                              <th className="text-left py-3 px-4 font-medium text-sm">Role</th>
                              <th className="text-right py-3 px-4 font-medium text-sm">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {formData.teamInvites.map((invite, index) => (
                              <tr key={invite.id} className={index % 2 === 0 ? "bg-card" : "bg-muted/30"}>
                                <td className="py-3 px-4 text-sm">{invite.email}</td>
                                <td className="py-3 px-4 text-sm">
                                  <span className={`px-2 py-1 text-xs rounded-full ${
                                    invite.role === "Owner" 
                                      ? "bg-purple-100 text-purple-700"
                                      : invite.role === "Manager"
                                      ? "bg-blue-100 text-blue-700"
                                      : "bg-gray-100 text-gray-700"
                                  }`}>
                                    {invite.role}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <button
                                    type="button"
                                    onClick={() => removeTeamInvite(invite.id)}
                                    className="text-red-600 hover:text-red-700 text-sm flex items-center gap-1 ml-auto"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    Remove
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Skip Option */}
                <div className="form-field-full">
                  <div className="mt-4 text-center">
                    <button
                      type="button"
                      onClick={handleNext}
                      className="text-sm text-muted-foreground hover:text-foreground underline"
                    >
                      Skip for now - I'll add team members later
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Placeholder */}
          {currentStep === 5 && (
            <div className="form-section">
              <h2 className="form-section-title">Step {currentStep}</h2>
              <p className="form-section-description">Content for step {currentStep} coming soon...</p>
            </div>
          )}
        </div>

        <div className="form-actions">
          {currentStep > 1 && (
            <button type="button" onClick={handleBack} className="form-button-secondary">
              Back
            </button>
          )}
          <div className="flex-1" />
          <button type="button" className="form-button-cancel">
            Cancel
          </button>
          {currentStep < 5 ? (
            <button type="button" onClick={handleNext} className="form-button-primary">
              Next
            </button>
          ) : (
            <button type="submit" className="form-button-primary">
              Create Club
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
