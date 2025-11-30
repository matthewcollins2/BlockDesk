import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { 
  Send, 
  Paperclip, 
  Loader2, 
  User,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWeb3 } from '@/contexts/Web3Context';
import { useNotifications } from '@/contexts/NotificationContext';
import { uploadToIPFS, uploadTextToIPFS } from '@/lib/ipfs';

export const Route = createFileRoute('/create-ticket')({
  component: CreateTicket,
});

interface FormData {
  title: string;
  description: string;
  attachment?: File;
}

interface FormErrors {
  title?: string;
  description?: string;
  attachment?: string;
}

function CreateTicket() {
  // Destructure 'contract' to enable blockchain interactions
  const { user, isConnected, contract } = useWeb3();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingToIPFS, setUploadingToIPFS] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    } else if (formData.title.length > 100) {
      newErrors.title = 'Title must be less than 100 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    } else if (formData.description.length > 1000) {
      newErrors.description = 'Description must be less than 1000 characters';
    }

    if (formData.attachment) {
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (formData.attachment.size > maxSize) {
        newErrors.attachment = 'File must be smaller than 10MB';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleIPFSUpload = async (file: File) => {
    setUploadingToIPFS(true);
    
    try {
      const result = await uploadToIPFS(file);
      return result;
    } catch (error) {
      console.error('IPFS upload error:', error);
      throw new Error('Failed to upload file to IPFS');
    } finally {
      setUploadingToIPFS(false);
    }
  };

  const submitTicket = async (descriptionHash: string, attachmentHash?: string) => {
    if (!contract) throw new Error('Smart contract not connected.');

    try {
      const tx = await contract.createTicket(
        formData.title,
        descriptionHash, // Store IPFS hash instead of description text
        attachmentHash || '',
        { gasLimit: 500000 }
      );

      // Wait for receipt to ensure block is mined
      const receipt = await tx.wait();
      
      // Optional: Log the receipt to see the new Ticket ID
      console.log("Transaction Receipt:", receipt);
      
      return tx.hash;
    } catch (error: any) {
      console.error('Error submitting ticket:', error);
      throw new Error(error.reason || error.message || 'Failed to submit ticket');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!isConnected || !user) {
      addNotification({
        type: 'error',
        title: 'Wallet Not Connected',
        message: 'Please connect your wallet to submit a ticket'
      });
      return;
    }

    setIsSubmitting(true);
    
    // Show initial notification
    addNotification({
      type: 'info',
      title: 'Submitting Transaction...',
      message: 'Please check MetaMask to confirm the transaction',
      duration: 0 // Persistent until removed
    });
    
    try {
      let attachmentHash: string | undefined;
      let descriptionHash: string;

      // Upload description to IPFS
      addNotification({
        type: 'info',
        title: 'Processing description...',
        message: 'Uploading to IPFS'
      });
      
      const descriptionResult = await uploadTextToIPFS(formData.description);
      descriptionHash = descriptionResult.hash;
      
      // Store description in localStorage
      localStorage.setItem(`ipfs_${descriptionHash}`, formData.description);
      console.log('✓ Description uploaded to IPFS');

      // Upload attachment to IPFS if present
      if (formData.attachment) {
        addNotification({
          type: 'info',
          title: 'Processing file...',
          message: 'Your file is being prepared'
        });
        const result = await handleIPFSUpload(formData.attachment);
        attachmentHash = result.hash;
        
        if (result.dataUrl) {
          localStorage.setItem(`ipfs_${result.hash}`, result.dataUrl);
          console.log('✓ Attachment uploaded to IPFS');
        }
      }

      // Submit ticket to blockchain
      const txHash = await submitTicket(descriptionHash, attachmentHash);

      // Success! Show notification and redirect
      addNotification({
        type: 'success',
        title: 'Ticket Submitted Successfully!',
        message: `Transaction Hash: ${txHash.slice(0, 10)}...`,
        duration: 10000 // 10 seconds
      });
      
      navigate({ to: '/dashboard' });
      
    } catch (error: any) {
      console.error('Submission error:', error);
      addNotification({
        type: 'error',
        title: 'Submission Failed',
        message: error.message,
        duration: 10000
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFormData(prev => ({ ...prev, attachment: file }));
    
    if (errors.attachment) {
      setErrors(prev => ({ ...prev, attachment: undefined }));
    }
  };

  const removeAttachment = () => {
    setFormData(prev => ({ ...prev, attachment: undefined }));
  };

  if (!isConnected || !user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <div className="text-yellow-600 mb-2">
              <User size={48} className="mx-auto mb-4" />
            </div>
            <h2 className="text-xl font-semibold text-yellow-800 mb-2">
              Wallet Connection Required
            </h2>
            <p className="text-yellow-700 mb-4">
              Please connect your MetaMask wallet to create a support ticket.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Support Ticket</h1>
          <p className="text-gray-600">
            Submit a new IT support request that will be stored securely on the blockchain
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Brief description of the issue..."
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 ${
                  errors.title ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertTriangle size={14} />
                  {errors.title}
                </p>
              )}
              {/* Character Counter - Right Aligned */}
              <div className="flex justify-end">
                <p className="mt-1 text-xs text-gray-500">
                  {formData.title.length}/100 characters
                </p>
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                rows={6}
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Provide detailed information about the issue, including steps to reproduce, error messages, and any relevant context..."
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 resize-y ${
                  errors.description ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertTriangle size={14} />
                  {errors.description}
                </p>
              )}
              {/* Character Counter - Right Aligned */}
              <div className="flex justify-end">
                <p className="mt-1 text-xs text-gray-500">
                  {formData.description.length}/1000 characters
                </p>
              </div>
            </div>

            {/* File Attachment */}
            <div>
              <label htmlFor="attachment" className="block text-sm font-medium text-gray-700 mb-2">
                Attachment (Optional)
              </label>
              
              {formData.attachment ? (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText size={20} className="text-gray-500" />
                      <span className="text-sm text-gray-700">
                        {formData.attachment.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({(formData.attachment.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeAttachment}
                      disabled={isSubmitting}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    id="attachment"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={isSubmitting}
                    accept="image/*,.pdf,.doc,.docx,.txt,.log"
                  />
                  <label htmlFor="attachment" className="cursor-pointer">
                    <Paperclip size={24} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">
                      Click to upload a file or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Images, PDFs, documents (max 10MB)
                    </p>
                  </label>
                </div>
              )}

              {errors.attachment && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertTriangle size={14} />
                  {errors.attachment}
                </p>
              )}
              
              <p className="mt-2 text-xs text-gray-500">
                Files will be uploaded to IPFS and the hash stored on the blockchain for transparency and immutability.
              </p>
            </div>

            {/* User Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Submitting as:</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Wallet Address:</strong> {user.address}</p>
                <p><strong>Role:</strong> {user.role}</p>
                {user.balance && (
                  <p><strong>Balance:</strong> {parseFloat(user.balance).toFixed(4)} ETH</p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate({ to: '/dashboard' })}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || uploadingToIPFS}
                className="flex-1 bg-cyan-600 hover:bg-cyan-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    {uploadingToIPFS ? 'Uploading to IPFS...' : 'Submitting to Blockchain...'}
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Submit Ticket
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-2">How it works:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Your ticket will be stored immutably on the blockchain</li>
            <li>• File attachments are uploaded to IPFS for decentralized storage</li>
            <li>• You'll need to confirm the transaction in MetaMask</li>
            <li>• Gas fees apply for blockchain transactions</li>
            <li>• All interactions are transparent and auditable</li>
          </ul>
        </div>
      </div>
    </div>
  );
}