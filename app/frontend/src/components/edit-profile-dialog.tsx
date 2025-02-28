"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { User, Lock } from "lucide-react";
import Image from "next/image";
import { updateUserProfile, deleteUserAccount } from "@/lib/pb";

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    id: string;
    username: string;
    avatar?: string;
    xProfile: string;
    telegram: string;
    email?: string;
  };
}

export function EditProfileDialog({ open, onOpenChange, user }: EditProfileDialogProps) {
  const [formData, setFormData] = useState({
    username: user.username,
    xProfile: user.xProfile || "",
    telegram: user.telegram || "",
    email: user.email || "",
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [password, setPassword] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showDeletePasswordConfirm, setShowDeletePasswordConfirm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowPasswordConfirm(true);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedAvatar(file);
    }
  };

  const handleConfirmChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await updateUserProfile(user.id, {
        username: formData.username,
        email: formData.email,
        xProfile: formData.xProfile,
        telegram: formData.telegram,
        avatar: selectedAvatar || undefined,
      }, password);

      if (result.success) {
        onOpenChange(false);
        window.location.reload(); // Refresh to show updated profile
      } else {
        setError("Incorrect password. Please try again.");
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(false);
    setShowDeletePasswordConfirm(true);
  };

  const handleConfirmDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await deleteUserAccount(user.id, password);
      if (result.success) {
        window.location.href = '/';
      } else {
        setError("Incorrect password. Please try again.");
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const avatarUrl = user.avatar 
    ? `http://127.0.0.1:8090/api/files/users/${user.id}/${user.avatar}`
    : undefined;

  if (showPasswordConfirm) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Changes</DialogTitle>
            <DialogDescription>
              Please enter your password to save changes
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleConfirmChanges}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 border-[#9A9A9A]"
                    placeholder="Enter your password"
                    disabled={isLoading}
                  />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
              </div>
              <div className="flex justify-end gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowPasswordConfirm(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-[#b3731d] hover:bg-[#b3731d]/90"
                  disabled={isLoading}
                >
                  {isLoading ? "Saving..." : "Confirm"}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  if (showDeletePasswordConfirm) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Account Deletion</DialogTitle>
            <DialogDescription className="text-red-600">
              Please enter your password to delete your account
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleConfirmDelete}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="delete-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="delete-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 border-[#9A9A9A]"
                    placeholder="Enter your password"
                    disabled={isLoading}
                  />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
              </div>
              <div className="flex justify-end gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowDeletePasswordConfirm(false);
                    setPassword("");
                    setError("");
                  }}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="destructive"
                  disabled={isLoading}
                >
                  {isLoading ? "Deleting..." : "Delete Account"}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  if (showDeleteConfirm) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription className="text-red-600">
              Are you sure you want to delete your account? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteClick}>
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-4">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border border-[#9A9A9A]">
              {selectedAvatar ? (
                <Image
                  src={URL.createObjectURL(selectedAvatar)}
                  alt="Profile"
                  width={96}
                  height={96}
                  className="object-cover"
                />
              ) : avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt="Profile"
                  width={96}
                  height={96}
                  className="object-cover"
                />
              ) : (
                <User className="w-12 h-12 text-gray-400" />
              )}
            </div>
            <label htmlFor="avatar-upload">
              <Button 
                variant="default" 
                size="sm" 
                type="button" 
                className="bg-[#b3731d] hover:bg-[#b3731d]/90"
              >
                Change Avatar
              </Button>
              <Input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </label>
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
              className="border-[#9A9A9A]"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="border-[#9A9A9A]"
              placeholder="your@email.com"
            />
          </div>

          {/* X Profile */}
          <div className="space-y-2">
            <Label htmlFor="xProfile">X Profile</Label>
            <Input
              id="xProfile"
              value={formData.xProfile}
              onChange={(e) => setFormData(prev => ({ ...prev, xProfile: e.target.value }))}
              placeholder="@username"
              className="border-[#9A9A9A]"
            />
          </div>

          {/* Telegram */}
          <div className="space-y-2">
            <Label htmlFor="telegram">Telegram</Label>
            <Input
              id="telegram"
              value={formData.telegram}
              onChange={(e) => setFormData(prev => ({ ...prev, telegram: e.target.value }))}
              placeholder="username"
              className="border-[#9A9A9A]"
            />
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-[#9A9A9A]">
            <Button 
              type="button" 
              variant="outline" 
              className="text-red-600 hover:text-red-600 hover:bg-red-50"
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete Account
            </Button>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#b3731d] hover:bg-[#b3731d]/90">
                Save Changes
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default EditProfileDialog;