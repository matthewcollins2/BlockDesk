import { createContext, useContext, useState, ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number; // in milliseconds, 0 for persistent
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 15);
    const duration = notification.duration ?? 5000; // Default 5 seconds
    const newNotification: Notification = {
      ...notification,
      id,
      duration
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto remove after duration (if not persistent)
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider 
      value={{ notifications, addNotification, removeNotification, clearAll }}
    >
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
}

function NotificationContainer() {
  const { notifications, removeNotification } = useNotifications();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <NotificationCard 
          key={notification.id} 
          notification={notification} 
          onRemove={() => removeNotification(notification.id)} 
        />
      ))}
    </div>
  );
}

interface NotificationCardProps {
  notification: Notification;
  onRemove: () => void;
}

function NotificationCard({ notification, onRemove }: NotificationCardProps) {
  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'error':
        return <AlertCircle className="text-red-500" size={20} />;
      case 'warning':
        return <AlertTriangle className="text-yellow-500" size={20} />;
      case 'info':
        return <Info className="text-blue-500" size={20} />;
      default:
        return <Info className="text-blue-500" size={20} />;
    }
  };

  const getBorderClass = () => {
    switch (notification.type) {
      case 'success':
        return 'border-l-green-500 bg-green-50';
      case 'error':
        return 'border-l-red-500 bg-red-50';
      case 'warning':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'info':
        return 'border-l-blue-500 bg-blue-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  return (
    <div className={`
      min-w-80 max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto border-l-4 ${getBorderClass()}
      transform transition-all duration-300 ease-in-out
    `}>
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 leading-5">
              {notification.title}
            </p>
            {notification.message && (
              <p className="mt-2 text-sm text-gray-600 leading-5 break-words">
                {notification.message}
              </p>
            )}
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              onClick={onRemove}
            >
              <X size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

// Helper functions for common notifications
export const notify = {
  success: (title: string, message?: string, duration?: number) => {
    const { addNotification } = useNotifications();
    addNotification({ type: 'success', title, message, duration });
  },
  error: (title: string, message?: string, duration?: number) => {
    const { addNotification } = useNotifications();
    addNotification({ type: 'error', title, message, duration });
  },
  warning: (title: string, message?: string, duration?: number) => {
    const { addNotification } = useNotifications();
    addNotification({ type: 'warning', title, message, duration });
  },
  info: (title: string, message?: string, duration?: number) => {
    const { addNotification } = useNotifications();
    addNotification({ type: 'info', title, message, duration });
  }
};