// IPFS utility functions
// Using browser-based approach with base64 encoding for demo purposes
const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;
const PINATA_GATEWAY =
  import.meta.env.VITE_PINATA_GATEWAY || "https://gateway.pinata.cloud/ipfs/";

// Helper to convert File to Base64/DataURL
const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export async function uploadToIPFS(file: File) {
  if (!PINATA_JWT) throw new Error("Missing Pinata JWT");

  const form = new FormData();
  form.append("file", file);

  const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: { Authorization: `Bearer ${PINATA_JWT}` },
    body: form
  });

  if (!res.ok) throw new Error("Pinata file upload failed");

  const data = await res.json();
  
  // Generate Data URL for local caching
  const dataUrl = await readFileAsDataURL(file);

  return {
    hash: data.IpfsHash,
    url: getIPFSUrl(data.IpfsHash),
    dataUrl // Return this so the frontend can cache it
  };
}

export async function uploadTextToIPFS(text: string) {
  if (!PINATA_JWT) throw new Error("Missing Pinata JWT");

  const blob = new Blob([text], { type: "text/plain" });
  const form = new FormData();
  form.append("file", blob, "content.txt");

  const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: { Authorization: `Bearer ${PINATA_JWT}` },
    body: form
  });

  if (!res.ok) throw new Error("Pinata text upload failed");

  const data = await res.json();
  return {
    hash: data.IpfsHash,
    url: getIPFSUrl(data.IpfsHash)
  };
}

export function isIPFSHash(str: string): boolean {
  return /^[A-Za-z0-9]{46,}$/.test(str);
}

export function getIPFSUrl(cid: string): string {
  if (!cid) return "";
  return `${PINATA_GATEWAY}${cid}`;
}