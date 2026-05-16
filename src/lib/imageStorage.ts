export async function uploadImage(file: File): Promise<string> {
  const res = await fetch('/api/images', {
    method: 'POST',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  if (!res.ok) throw new Error('Image upload failed');
  const { url } = await res.json();
  return url as string;
}

export async function deleteImage(url: string): Promise<void> {
  const filename = url.split('/').pop();
  if (!filename) return;
  await fetch(`/api/images/${filename}`, { method: 'DELETE' });
}
