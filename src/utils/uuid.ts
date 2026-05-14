// crypto.randomUUID() requires a secure context (HTTPS/localhost).
// This fallback works over plain HTTP.
export function randomUUID(): string {
  const b = new Uint8Array(16);
  // Use crypto.getRandomValues if available (works in HTTP too, unlike randomUUID/subtle)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(b);
  } else {
    for (let i = 0; i < 16; i++) b[i] = (Math.random() * 256) | 0;
  }
  b[6] = (b[6] & 0x0f) | 0x40; // version 4
  b[8] = (b[8] & 0x3f) | 0x80; // variant bits
  const h = Array.from(b, (x) => x.toString(16).padStart(2, '0'));
  return `${h[0]}${h[1]}${h[2]}${h[3]}-${h[4]}${h[5]}-${h[6]}${h[7]}-${h[8]}${h[9]}-${h[10]}${h[11]}${h[12]}${h[13]}${h[14]}${h[15]}`;
}
