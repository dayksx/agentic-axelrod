"use client";

const AVATAR_URL =
  "https://imgs.search.brave.com/VYH0b-0X6tItrD9_PLvbTLYf87N8RVOZVLzPJxtmSh4/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pLmlt/Z2ZsaXAuY29tLzIv/YmM2MHUuanBn";

export function AgentAvatar({
  name,
  size = 32,
}: {
  name: string;
  size?: number;
}) {
  return (
    <img
      src={AVATAR_URL}
      alt={name}
      width={size}
      height={size}
      className="rounded-full object-cover shrink-0"
      style={{ width: size, height: size }}
    />
  );
}
