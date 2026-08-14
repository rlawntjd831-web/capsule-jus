export type CapsulePhoto = {
  id: number;
  public_url: string;
  storage_path: string;
  sort_order: number;
};

export type Capsule = {
  id: number;
  recipient: string;
  letter: string;
  open_at: string | null;
  created_at: string;
  firebase_uid: string;
  capsule_photos: CapsulePhoto[];
};

export function isCapsuleOpen(openAt: string | null) {
  if (!openAt) return true;
  return Date.now() >= new Date(openAt).getTime();
}

export function formatCountdown(openAt: string | null) {
  if (!openAt || isCapsuleOpen(openAt)) {
    return "열람 가능";
  }

  const totalSeconds = Math.max(
    0,
    Math.floor((new Date(openAt).getTime() - Date.now()) / 1000),
  );
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days}일 ${hours}시간 ${minutes}분`;
  }
  if (hours > 0) {
    return `${hours}시간 ${minutes}분 ${seconds}초`;
  }
  return `${minutes}분 ${seconds}초`;
}

export function formatOpenAt(openAt: string | null) {
  if (!openAt) return "열람일 없음";
  return new Date(openAt).toLocaleString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
