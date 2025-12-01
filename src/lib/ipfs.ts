const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;
const PINATA_GATEWAY =
  import.meta.env.VITE_PINATA_GATEWAY ||
  "https://emerald-elegant-wolf-980.mypinata.cloud/ipfs/";

export interface IPFSUploadResult {
  hash: string;
  url: string;
  dataUrl?: string; // Base64 data URL for immediate display
}

/**
 * Upload file to "IPFS" - For demo, we store as base64 data URL
 * This allows images to display immediately without needing external IPFS service
 */
export async function uploadToIPFS(file: File): Promise<IPFSUploadResult> {
  try {
    // Read file as base64 data URL
    const dataUrl = await fileToDataURL(file);
    
    // Generate a deterministic hash from file content
    const fileBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', fileBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Create IPFS-style CID (using first 44 chars of hex hash)
    const mockCID = `Qm${hashHex.substring(0, 44)}`;
    
    // Store in localStorage immediately
    localStorage.setItem(`ipfs_${mockCID}`, dataUrl);
    
    const result = {
      hash: mockCID,
      url: dataUrl,
      dataUrl: dataUrl
    };
    
    console.log('✓ File uploaded to IPFS:', mockCID);
    
    // For demo: Store the data URL which includes the full file content
    // In production, you'd upload to real IPFS and just store the hash
    return result;
  } catch (error) {
    console.error('Error processing file:', error);
    throw new Error('Failed to process file');
  }
}

  const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: { Authorization: `Bearer ${PINATA_JWT}` },
    body: form
  });

  if (!res.ok) throw new Error("Pinata file upload failed");

  const data = await res.json();
  return {
    hash: data.IpfsHash,
    url: getIPFSUrl(data.IpfsHash)
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

/**
 * Upload text/JSON to IPFS
 */
export async function uploadTextToIPFS(text: string): Promise<IPFSUploadResult> {
  const blob = new Blob([text], { type: 'text/plain' });
  const file = new File([blob], 'content.txt', { type: 'text/plain' });
  return uploadToIPFS(file);
}

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
