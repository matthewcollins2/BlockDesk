// IPFS utility functions
// Using browser-based approach with base64 encoding for demo purposes

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

/**
 * Convert file to base64 data URL
 */
function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Get IPFS URL from hash
 * For demo mode, checks localStorage for stored data URL
 */
export function getIPFSUrl(hash: string): string {
  if (!hash) return '';
  
  // If it's already a data URL, return it directly
  if (hash.startsWith('data:')) {
    return hash;
  }
  
  // Check localStorage for stored data URL
  const storedDataUrl = localStorage.getItem(`ipfs_${hash}`);
  if (storedDataUrl) {
    return storedDataUrl;
  }
  
  // Otherwise treat as IPFS hash (won't work in demo mode)
  return `https://ipfs.io/ipfs/${hash.replace('ipfs://', '')}`;
}

/**
 * Upload text/JSON to IPFS
 */
export async function uploadTextToIPFS(text: string): Promise<IPFSUploadResult> {
  const blob = new Blob([text], { type: 'text/plain' });
  const file = new File([blob], 'content.txt', { type: 'text/plain' });
  return uploadToIPFS(file);
}

/**
 * Check if string is an IPFS hash
 */
export function isIPFSHash(str: string): boolean {
  // Check for both IPFS hash format and data URLs
  // Using hex-based mock CIDs for demo, so accept 0-9a-f characters
  return /^(Qm[0-9a-fA-F]{44}|bafy[a-zA-Z0-9]{50,}|data:)/.test(str);
}

// NOTE: This is a demo implementation using base64 data URLs
// For production with real IPFS:
// 
// 1. Sign up for web3.storage (free): https://web3.storage/
// 2. Get API token
// 3. Replace uploadToIPFS with:
//    import { Web3Storage } from 'web3.storage'
//    const client = new Web3Storage({ token: 'YOUR_TOKEN' })
//    const cid = await client.put([file])
//    return { hash: cid, url: `https://ipfs.io/ipfs/${cid}` }
//
// OR use NFT.Storage which doesn't require API key for uploads
