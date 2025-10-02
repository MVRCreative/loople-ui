"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Save, X, Building2, Mail, Phone, MapPin, Globe } from "lucide-react";
import { ClubsService, Club, CreateClubData } from "@/lib/services/clubs.service";

interface EditClubFormProps {
  club: Club;
  onSuccess: () => void;
  onCancel: () => void;
}

export function EditClubForm({ club, onSuccess, onCancel }: EditClubFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateClubData>({
    name: club.name || "",
    subdomain: club.subdomain || "",
    description: club.description || "",
    contact_email: club.contact_email || "",
    contact_phone: club.contact_phone || "",
    address: club.address || "",
    city: club.city || "",
    state: club.state || "",
    zip_code: club.zip_code || "",
  });

  useEffect(() => {
    setFormData({
      name: club.name || "",
      subdomain: club.subdomain || "",
      description: club.description || "",
      contact_email: club.contact_email || "",
      contact_phone: club.contact_phone || "",
      address: club.address || "",
      city: club.city || "",
      state: club.state || "",
      zip_code: club.zip_code || "",
    });
  }, [club]);

  const formatPhoneNumber = (input: string): string => {
    const digitsOnly = (input || "").replace(/\D/g, '').slice(0, 10);
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

    if (field === 'name') {
      const subdomain = value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setFormData(prev => ({ ...prev, subdomain }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic validations (align with create form)
    const requiredFields = [
      { field: 'name', label: 'Club name' },
      { field: 'subdomain', label: 'Subdomain' },
      { field: 'description', label: 'Description' },
      { field: 'contact_phone', label: 'Contact phone' },
      { field: 'address', label: 'Address' }
    ];
    for (const { field, label } of requiredFields) {
      const v = formData[field as keyof CreateClubData];
      if (!v || String(v).trim() === "") {
        setError(`${label} is required`);
        return;
      }
    }

    if (formData.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (!/^\(\d{3}\) \d{3}-\d{4}$/.test(formData.contact_phone ?? "")) {
      setError("Please enter a valid phone number in the format (XXX) XXX-XXXX");
      return;
    }

    try {
      setLoading(true);
      await ClubsService.updateClub(club.id, formData);
      onSuccess();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update club. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-none border-0">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Building2 className="h-5 w-5 mr-2" />
          Edit Club
        </CardTitle>
        <CardDescription>Update your club information</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Club Name *</Label>
                <Input id="name" value={formData.name} onChange={(e) => handleInputChange("name", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subdomain">Subdomain *</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input id="subdomain" value={formData.subdomain} onChange={(e) => handleInputChange("subdomain", e.target.value)} className="pl-10" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea id="description" value={formData.description} onChange={(e) => handleInputChange("description", e.target.value)} rows={3} />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_email">Contact Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input id="contact_email" type="email" value={formData.contact_email || ""} onChange={(e) => handleInputChange("contact_email", e.target.value)} className="pl-10" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_phone">Contact Phone *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input id="contact_phone" value={formData.contact_phone || ""} onChange={(e) => handleInputChange("contact_phone", e.target.value)} placeholder="(555) 123-4567" className="pl-10" maxLength={14} />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Address Information</h3>
            <div className="space-y-2">
              <Label htmlFor="address">Street Address *</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input id="address" value={formData.address || ""} onChange={(e) => handleInputChange("address", e.target.value)} className="pl-10" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input id="city" value={formData.city || ""} onChange={(e) => handleInputChange("city", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Input id="state" value={formData.state || ""} onChange={(e) => handleInputChange("state", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zip_code">ZIP Code *</Label>
                <Input id="zip_code" value={formData.zip_code || ""} onChange={(e) => handleInputChange("zip_code", e.target.value)} />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}


