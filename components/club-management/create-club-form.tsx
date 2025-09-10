"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Save,
  X,
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe
} from "lucide-react";
import { ClubsService, CreateClubData } from "@/lib/services/clubs.service";
import { useAuth } from "@/lib/auth-context";
import { useClub } from "@/lib/club-context";

interface CreateClubFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function CreateClubForm({ onSuccess, onCancel }: CreateClubFormProps) {
  const { user } = useAuth();
  const { refreshClubs } = useClub();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateClubData>({
    name: "",
    subdomain: "",
    description: "",
    contact_email: user?.email || "",
    contact_phone: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
  });

  const formatPhoneNumber = (input: string): string => {
    const digitsOnly = input.replace(/\D/g, '').slice(0, 10);
    const area = digitsOnly.slice(0, 3);
    const prefix = digitsOnly.slice(3, 6);
    const line = digitsOnly.slice(6, 10);
    if (digitsOnly.length === 0) return "";
    if (digitsOnly.length <= 3) return `(${area}`;
    if (digitsOnly.length <= 6) return `(${area}) ${prefix}`;
    return `(${area}) ${prefix}-${line}`;
  };

  const handleInputChange = (field: keyof CreateClubData, value: string) => {
    if (field === 'contact_phone') {
      const formatted = formatPhoneNumber(value);
      setFormData(prev => ({
        ...prev,
        contact_phone: formatted
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-generate subdomain from club name
    if (field === 'name') {
      const subdomain = value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setFormData(prev => ({
        ...prev,
        subdomain: subdomain
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear any previous errors
    setError(null);

    // Validate required fields
    const requiredFields = [
      { field: 'name', label: 'Club name' },
      { field: 'subdomain', label: 'Subdomain' },
      { field: 'description', label: 'Description' },
      { field: 'contact_phone', label: 'Contact phone' },
      { field: 'address', label: 'Address' }
    ];

    for (const { field, label } of requiredFields) {
      if (!formData[field as keyof CreateClubData]) {
        setError(`${label} is required`);
        return;
      }
    }

    // Validate email format if provided
    if (formData.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
      setError("Please enter a valid email address");
      return;
    }

    // Validate phone format (strict)
    if (!/^\(\d{3}\) \d{3}-\d{4}$/.test(formData.contact_phone ?? "")) {
      setError("Please enter a valid phone number in the format (XXX) XXX-XXXX");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const newClub = await ClubsService.createClub(formData);
      // Refresh clubs to get the updated list
      await refreshClubs();
      onSuccess();
    } catch (err: any) {
      console.error('Error creating club:', err);

      // The service layer now provides properly formatted error messages
      const errorMessage = err?.message || 'Failed to create club. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-none border-0">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Building2 className="h-5 w-5 mr-2" />
          Create New Club
        </CardTitle>
        <CardDescription>
          Fill in the details below to create your swimming club
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Club Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="e.g., Dolphins Swim Club"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subdomain">Subdomain *</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="subdomain"
                    value={formData.subdomain}
                    onChange={(e) => handleInputChange("subdomain", e.target.value)}
                    placeholder="dolphins-swim-club"
                    className="pl-10"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  This will be used in your club's URL
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Tell us about your swimming club..."
                rows={3}
                required
              />
            </div>
          </div>

          <Separator />

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Contact Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_email">Contact Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => handleInputChange("contact_email", e.target.value)}
                    placeholder="contact@club.com"
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_phone">Contact Phone *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="contact_phone"
                    type="tel"
                    value={formData.contact_phone}
                    onChange={(e) => handleInputChange("contact_phone", e.target.value)}
                    placeholder="(555) 123-4567"
                    className="pl-10"
                    inputMode="numeric"
                    maxLength={14}
                    pattern="^\(\d{3}\) \d{3}-\d{4}$"
                    title="Format: (XXX) XXX-XXXX"
                    autoComplete="tel"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Address Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Address Information</h3>

            <div className="space-y-2">
              <Label htmlFor="address">Street Address *</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="123 Pool Lane"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  placeholder="Swimtown"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleInputChange("state", e.target.value)}
                  placeholder="CA"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zip_code">ZIP Code *</Label>
                <Input
                  id="zip_code"
                  value={formData.zip_code}
                  onChange={(e) => handleInputChange("zip_code", e.target.value)}
                  placeholder="90210"
                  required
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Creating..." : "Create Club"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
