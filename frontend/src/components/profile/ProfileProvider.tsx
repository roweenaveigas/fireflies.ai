"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type UserProfile = {
  name: string;
  email: string;
  workspace: string;
};

type ProfileContextValue = {
  profile: UserProfile;
  firstName: string;
  initials: string;
  updateProfile: (patch: Partial<UserProfile>) => void;
};

const STORAGE_KEY = "ff-profile";

const DEFAULT_PROFILE: UserProfile = {
  name: "Maya Rivera",
  email: "maya.rivera@acme.io",
  workspace: "Acme Workspace",
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "M";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

function getFirstName(name: string): string {
  return name.trim().split(/\s+/)[0] || "Maya";
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<UserProfile>;
      setProfile({
        name: parsed.name?.trim() || DEFAULT_PROFILE.name,
        email: parsed.email?.trim() || DEFAULT_PROFILE.email,
        workspace: parsed.workspace?.trim() || DEFAULT_PROFILE.workspace,
      });
    } catch {
      /* keep defaults */
    }
  }, []);

  const updateProfile = useCallback((patch: Partial<UserProfile>) => {
    setProfile((prev) => {
      const next: UserProfile = {
        name: patch.name?.trim() || prev.name,
        email: patch.email?.trim() || prev.email,
        workspace: patch.workspace?.trim() || prev.workspace,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      profile,
      firstName: getFirstName(profile.name),
      initials: getInitials(profile.name),
      updateProfile,
    }),
    [profile, updateProfile]
  );

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within ProfileProvider");
  return ctx;
}
