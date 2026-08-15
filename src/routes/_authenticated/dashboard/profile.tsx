import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useImageUrl } from "@/hooks/useImageUrl";
import { AVATAR_BUCKET } from "@/services/images";
import { updateAvatar, updateProfile } from "@/services/profile";
import { COUNTRIES } from "@/lib/countries";
import { initials } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/dashboard/profile")({
  component: ProfilePage,
  head: () => ({
    meta: [
      { title: "Your profile · Coastal Haven" },
      { name: "description", content: "Update your Coastal Haven contact details, phone number and profile photo." },
      { property: "og:title", content: "Your profile · Coastal Haven" },
      { property: "og:description", content: "Manage your guest profile details." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function ProfilePage() {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const avatarUrl = useImageUrl(AVATAR_BUCKET, profile?.avatar_url, null);

  useEffect(() => {
    setFullName(profile?.full_name ?? "");
    setPhone(profile?.phone ?? "");
    setCountry(profile?.country ?? "");
  }, [profile?.full_name, profile?.phone, profile?.country]);

  const save = useMutation({
    mutationFn: () =>
      updateProfile(user!.id, {
        full_name: fullName.trim() || null,
        phone: phone.trim() || null,
        country: country || null,
      }),
    onSuccess: async () => {
      await refreshProfile();
      toast.success("Profile updated");
    },
    onError: () => toast.error("Could not save your profile"),
  });

  const upload = useMutation({
    mutationFn: (file: File) => updateAvatar(user!.id, file),
    onSuccess: async () => {
      await refreshProfile();
      toast.success("Photo updated");
    },
    onError: () => toast.error("Could not upload that photo"),
  });

  return (
    <SiteLayout>
      <div className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="font-display text-3xl font-semibold">Your profile</h1>
        <p className="mt-1 text-muted-foreground">Keep your details current so the host can reach you.</p>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                {avatarUrl && <AvatarImage src={avatarUrl} alt={fullName || "Profile photo"} />}
                <AvatarFallback>{initials(fullName || user?.email)}</AvatarFallback>
              </Avatar>
              <div>
                <Label htmlFor="avatar" className="text-sm">
                  Profile photo
                </Label>
                <Input
                  id="avatar"
                  type="file"
                  accept="image/*"
                  className="mt-1"
                  disabled={upload.isPending}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) upload.mutate(file);
                  }}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="full_name">Full name</Label>
              <Input id="full_name" value={fullName} onChange={(event) => setFullName(event.target.value)} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={profile?.email ?? user?.email ?? ""} readOnly disabled />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">Phone (international format)</Label>
              <Input id="phone" placeholder="+254700000000" value={phone} onChange={(event) => setPhone(event.target.value)} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="country">Country</Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger id="country">
                  <SelectValue placeholder="Select your country" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((item) => (
                    <SelectItem key={item.code} value={item.name}>
                      {item.flag} {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={() => save.mutate()} disabled={save.isPending}>
                {save.isPending ? "Saving…" : "Save changes"}
              </Button>
              <Button variant="outline" onClick={() => void signOut()}>
                Sign out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </SiteLayout>
  );
}
