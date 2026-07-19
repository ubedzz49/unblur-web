const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error ?? `request to ${path} failed with status ${res.status}`);
  }
  return body as T;
}

export function sendOtp(identifier: string) {
  return request<{ sent: boolean; otp?: string }>("/auth/otp/send", {
    method: "POST",
    body: JSON.stringify({ identifier }),
  });
}

export function verifyOtp(identifier: string, otp: string) {
  return request<{ token: string; isNewUser: boolean }>("/auth/otp/verify", {
    method: "POST",
    body: JSON.stringify({ identifier, otp }),
  });
}

export interface UserProfile {
  id: string;
  email: string | null;
  phone: string | null;
  name: string | null;
  photoUrl: string | null;
  bio: string | null;
  aiNotesAndTranscriptsEnabled: boolean;
  createdAt: string;
}

export function getMe(token: string) {
  return request<UserProfile>("/users/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export interface ProfileUpdate {
  name?: string;
  photoUrl?: string;
  bio?: string;
  aiNotesAndTranscriptsEnabled?: boolean;
}

export function updateMe(token: string, update: ProfileUpdate) {
  return request<UserProfile>("/users/me", {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(update),
  });
}

export function requestPhotoUploadUrl(token: string, contentType: string) {
  return request<{ uploadUrl: string; publicUrl: string }>("/users/me/photo-upload-url", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ contentType }),
  });
}

export async function uploadFileToPresignedUrl(uploadUrl: string, file: File): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!res.ok) {
    throw new Error(`upload failed with status ${res.status}`);
  }
}

export interface ExpertiseLevelOption {
  id: string;
  name: string;
  slug: string;
}

export interface ExpertiseTypeOption {
  id: string;
  type: string;
  name: string;
  slug: string;
  levels: ExpertiseLevelOption[];
}

export interface UserExpertiseEntry {
  id: string;
  expertiseTypeId: string;
  expertiseTypeName: string;
  expertiseLevelId: string;
  expertiseLevelName: string;
}

export function getExpertiseOptions() {
  return request<ExpertiseTypeOption[]>("/expertise-options");
}

export function getMyExpertise(token: string) {
  return request<UserExpertiseEntry[]>("/users/me/expertise", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function addMyExpertise(token: string, expertiseTypeId: string, expertiseLevelId: string) {
  return request<UserExpertiseEntry>("/users/me/expertise", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ expertiseTypeId, expertiseLevelId }),
  });
}

export async function removeMyExpertise(token: string, userExpertiseId: string): Promise<void> {
  await request(`/users/me/expertise/${userExpertiseId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}
