"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { 
  Save, 
  Globe, 
  Mail, 
  Phone, 
  MapPin,
  Building,
  Settings as SettingsIcon
} from "lucide-react";
import { ClubData } from "@/lib/club-mock-data";

interface ClubSettingsProps {
  clubData: ClubData;
}

export function ClubSettings({ clubData }: ClubSettingsProps) {
  const [settings, setSettings] = useState({
    // Basic Information
    name: clubData.name,
    description: clubData.description,
    contactEmail: clubData.contactEmail,
    contactPhone: clubData.contactPhone,
    
    // Address Information
    address: clubData.address,
    city: clubData.city,
    state: clubData.state,
    zipCode: clubData.zipCode,
    
    // Settings
    allowPublicRegistration: true,
    requireApprovalForMembers: false,
    sendWelcomeEmails: true,
    allowMemberSelfRegistration: true,
    enableEventNotifications: true,
    enablePaymentReminders: true,
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    // TODO: Implement save functionality
    console.log("Saving settings:", settings);
  };

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building className="h-5 w-5 mr-2" />
            Basic Information
          </CardTitle>
          <CardDescription>
            Update your club&apos;s basic information and contact details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Club Name</Label>
              <Input
                id="name"
                value={settings.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter club name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subdomain">Subdomain</Label>
              <Input
                id="subdomain"
                value={clubData.subdomain}
                disabled
                placeholder="club-subdomain"
                className="bg-muted"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={settings.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Enter club description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contactEmail">Contact Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="contactEmail"
                  value={settings.contactEmail}
                  onChange={(e) => handleInputChange("contactEmail", e.target.value)}
                  placeholder="contact@club.com"
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPhone">Contact Phone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="contactPhone"
                  value={settings.contactPhone}
                  onChange={(e) => handleInputChange("contactPhone", e.target.value)}
                  placeholder="(555) 123-4567"
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Address Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="h-5 w-5 mr-2" />
            Address Information
          </CardTitle>
          <CardDescription>
            Update your club&apos;s physical address
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">Street Address</Label>
            <Input
              id="address"
              value={settings.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              placeholder="123 Main Street"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={settings.city}
                onChange={(e) => handleInputChange("city", e.target.value)}
                placeholder="City"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={settings.state}
                onChange={(e) => handleInputChange("state", e.target.value)}
                placeholder="State"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zipCode">ZIP Code</Label>
              <Input
                id="zipCode"
                value={settings.zipCode}
                onChange={(e) => handleInputChange("zipCode", e.target.value)}
                placeholder="12345"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Club Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <SettingsIcon className="h-5 w-5 mr-2" />
            Club Settings
          </CardTitle>
          <CardDescription>
            Configure how your club operates and manages members
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="allowPublicRegistration">Allow Public Registration</Label>
                <p className="text-sm text-muted-foreground">
                  Allow anyone to register for events without being a member
                </p>
              </div>
              <Switch
                id="allowPublicRegistration"
                checked={settings.allowPublicRegistration}
                onCheckedChange={(checked) => handleInputChange("allowPublicRegistration", checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="requireApprovalForMembers">Require Approval for New Members</Label>
                <p className="text-sm text-muted-foreground">
                  New members must be approved by an admin before joining
                </p>
              </div>
              <Switch
                id="requireApprovalForMembers"
                checked={settings.requireApprovalForMembers}
                onCheckedChange={(checked) => handleInputChange("requireApprovalForMembers", checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="sendWelcomeEmails">Send Welcome Emails</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically send welcome emails to new members
                </p>
              </div>
              <Switch
                id="sendWelcomeEmails"
                checked={settings.sendWelcomeEmails}
                onCheckedChange={(checked) => handleInputChange("sendWelcomeEmails", checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="allowMemberSelfRegistration">Allow Member Self-Registration</Label>
                <p className="text-sm text-muted-foreground">
                  Allow members to register themselves for events
                </p>
              </div>
              <Switch
                id="allowMemberSelfRegistration"
                checked={settings.allowMemberSelfRegistration}
                onCheckedChange={(checked) => handleInputChange("allowMemberSelfRegistration", checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enableEventNotifications">Enable Event Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Send notifications about upcoming events to members
                </p>
              </div>
              <Switch
                id="enableEventNotifications"
                checked={settings.enableEventNotifications}
                onCheckedChange={(checked) => handleInputChange("enableEventNotifications", checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enablePaymentReminders">Enable Payment Reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Send reminders for pending payments
                </p>
              </div>
              <Switch
                id="enablePaymentReminders"
                checked={settings.enablePaymentReminders}
                onCheckedChange={(checked) => handleInputChange("enablePaymentReminders", checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} className="min-w-[120px]">
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>
    </div>
  );
}
