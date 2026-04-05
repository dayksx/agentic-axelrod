"use client";

const AVATARS = [
  "/bender.png",
  "/c3po.png",
  "/gearhead.png",
  "/giant.png",
  "/optimus.png",
  "/walle.png",
] as const;

function nameToIndex(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return ((hash % AVATARS.length) + AVATARS.length) % AVATARS.length;
}

export function AgentAvatar({
  name,
  size = 32,
}: {
  name: string;
  size?: number;
}) {
  const src = AVATARS[nameToIndex(name)];
  return (
    <img
      src={src}
      alt={name}
      width={size}
      height={size}
      className="rounded-full object-cover shrink-0"
      style={{ width: size, height: size }}
    />
  );
}
