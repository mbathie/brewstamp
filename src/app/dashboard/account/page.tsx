"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, ChevronDown, ChevronUp } from "lucide-react";

export default function AccountPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const initial = useRef({ name: "", email: "", phone: "" });

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [error, setError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordOpen, setPasswordOpen] = useState(false);

  useEffect(() => {
    fetch("/api/account")
      .then((r) => r.json())
      .then((data) => {
        const n = data.name || "";
        const e = data.email || "";
        const p = data.phone || "";
        setName(n);
        setEmail(e);
        setPhone(p);
        initial.current = { name: n, email: e, phone: p };
        setLoading(false);
      });
  }, []);

  const dirty =
    name !== initial.current.name ||
    email !== initial.current.email ||
    phone !== initial.current.phone;

  // Live password validity
  const passwordsMatch =
    confirmPassword.length > 0 && newPassword === confirmPassword;
  const passwordsMismatch =
    confirmPassword.length > 0 && newPassword !== confirmPassword;
  const passwordTooShort = newPassword.length > 0 && newPassword.length < 6;
  const canSubmitPassword =
    currentPassword.length > 0 &&
    newPassword.length >= 6 &&
    passwordsMatch &&
    !savingPassword;

  async function handleSaveDetails(e: React.FormEvent) {
    e.preventDefault();
    if (!dirty) return;
    setSaving(true);
    setError("");
    setMessage("");

    const res = await fetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone }),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.error || "Failed to save");
      return;
    }

    initial.current = { name, email, phone };
    setMessage("Saved");
    setTimeout(() => setMessage(""), 2000);
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError("");
    setPasswordMessage("");

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    setSavingPassword(true);

    const res = await fetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const data = await res.json();
    setSavingPassword(false);

    if (!res.ok) {
      setPasswordError(data.error || "Failed to update password");
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordMessage("Password updated");
    setTimeout(() => setPasswordMessage(""), 2000);
  }

  if (loading)
    return <p className="text-sm text-muted-foreground">Loading...</p>;

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold text-foreground">Account</h1>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveDetails} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Used to sign in and for shop notifications.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">
                Phone Number{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                We&apos;ll only use it for time-sensitive shop alerts.
              </p>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex items-center gap-3">
              <Button
                type="submit"
                disabled={!dirty || saving}
                className="cursor-pointer"
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              {message && (
                <span className="flex items-center gap-1 text-sm text-green-500">
                  <Check className="size-4" />
                  {message}
                </span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Sign-in & security */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sign-in &amp; security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <button
            type="button"
            onClick={() => setPasswordOpen((o) => !o)}
            className="flex w-full cursor-pointer items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-left text-sm transition-colors hover:bg-accent"
          >
            <div>
              <p className="font-medium text-foreground">Password</p>
              <p className="text-xs text-muted-foreground">
                Change the password you use to sign in.
              </p>
            </div>
            {passwordOpen ? (
              <ChevronUp className="size-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="size-4 text-muted-foreground" />
            )}
          </button>

          {passwordOpen && (
            <form onSubmit={handleChangePassword} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
                {passwordTooShort && (
                  <p className="flex items-center gap-1 text-xs text-amber-500">
                    <X className="size-3" />
                    Must be at least 6 characters.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm new password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
                {passwordsMatch && (
                  <p className="flex items-center gap-1 text-xs text-green-500">
                    <Check className="size-3" />
                    Passwords match.
                  </p>
                )}
                {passwordsMismatch && (
                  <p className="flex items-center gap-1 text-xs text-destructive">
                    <X className="size-3" />
                    Passwords do not match.
                  </p>
                )}
              </div>

              {passwordError && (
                <p className="text-sm text-destructive">{passwordError}</p>
              )}

              <div className="flex items-center gap-3">
                <Button
                  type="submit"
                  disabled={!canSubmitPassword}
                  className="cursor-pointer"
                >
                  {savingPassword ? "Updating..." : "Update Password"}
                </Button>
                {passwordMessage && (
                  <span className="flex items-center gap-1 text-sm text-green-500">
                    <Check className="size-4" />
                    {passwordMessage}
                  </span>
                )}
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
