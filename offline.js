// offline.js - Offline functionality module

class OfflineManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.pendingActions = [];
    this.syncInterval = null;
    
    // Initialize IndexedDB
    this.dbName = 'ReportHubDB';
    this.dbVersion = 1;
    this.db = null;
    
    // Initialize event listeners
    this.initEventListeners();
    this.initDatabase();
  }

  // Initialize event listeners for online/offline status
  initEventListeners() {
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
    
    // Check initial status
    this.isOnline = navigator.onLine;
    if (!this.isOnline) {
      this.showOfflineIndicator();
    }
  }

  // Initialize IndexedDB
  initDatabase() {
    const request = indexedDB.open(this.dbName, this.dbVersion);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create object stores for different data types
      if (!db.objectStoreNames.contains('reports')) {
        db.createObjectStore('reports', { keyPath: 'id', autoIncrement: true });
      }
      
      if (!db.objectStoreNames.contains('pendingActions')) {
        db.createObjectStore('pendingActions', { keyPath: 'id', autoIncrement: true });
      }
      
      if (!db.objectStoreNames.contains('users')) {
        db.createObjectStore('users', { keyPath: 'id' });
      }
    };
    
    request.onsuccess = (event) => {
      this.db = event.target.result;
      this.checkPendingActions();
    };
    
    request.onerror = (event) => {
      console.error('IndexedDB error:', event.target.error);
    };
  }

  // Handle online status
  handleOnline() {
    this.isOnline = true;
    this.hideOfflineIndicator();
    this.checkPendingActions();
    
    // Start sync interval if not already running
    if (!this.syncInterval) {
      this.syncInterval = setInterval(() => this.checkPendingActions(), 30000); // Sync every 30 seconds
    }
  }

  // Handle offline status
  handleOffline() {
    this.isOnline = false;
    this.showOfflineIndicator();
    
    // Clear sync interval
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // Show offline indicator
  showOfflineIndicator() {
    const existingIndicator = document.getElementById('offline-indicator');
    if (existingIndicator) return;
    
    const indicator = document.createElement('div');
    indicator.id = 'offline-indicator';
    indicator.style.position = 'fixed';
    indicator.style.bottom = '20px';
    indicator.style.right = '20px';
    indicator.style.backgroundColor = '#ff6b6b';
    indicator.style.color = 'white';
    indicator.style.padding = '10px 20px';
    indicator.style.borderRadius = '5px';
    indicator.style.zIndex = '1000';
    indicator.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    indicator.textContent = 'You are currently offline. Working in offline mode.';
    
    document.body.appendChild(indicator);
  }

  // Hide offline indicator
  hideOfflineIndicator() {
    const indicator = document.getElementById('offline-indicator');
    if (indicator) {
      indicator.remove();
    }
  }

  // Queue action for when online
  queueAction(actionType, data, callback) {
    if (!this.db) {
      console.error('Database not initialized');
      if (typeof callback === 'function') {
        callback(new Error('Database not initialized'));
      }
      return;
    }
    
    const transaction = this.db.transaction(['pendingActions'], 'readwrite');
    const store = transaction.objectStore('pendingActions');
    
    const action = {
      type: actionType,
      data: data,
      timestamp: new Date().getTime()
    };
    
    const request = store.add(action);
    
    request.onsuccess = () => {
      if (this.isOnline) {
        this.checkPendingActions();
      }
      if (typeof callback === 'function') {
        callback(null, action);
      }
    };
    
    request.onerror = (event) => {
      console.error('Error queuing action:', event.target.error);
      if (typeof callback === 'function') {
        callback(event.target.error);
      }
    };
  }

  // Process pending actions when online
  async checkPendingActions() {
    if (!this.isOnline || !this.db) return;
    
    const transaction = this.db.transaction(['pendingActions'], 'readwrite');
    const store = transaction.objectStore('pendingActions');
    const request = store.getAll();
    
    request.onsuccess = async () => {
      const actions = request.result;
      
      for (const action of actions) {
        try {
          // Process the action based on its type
          switch (action.type) {
            case 'createReport':
              await this.syncCreateReport(action.data);
              break;
            case 'updateReport':
              await this.syncUpdateReport(action.data);
              break;
            case 'deleteReport':
              await this.syncDeleteReport(action.data);
              break;
            case 'sendMessage':
              await this.syncSendMessage(action.data);
              break;
            // Add more action types as needed
          }
          
          // If successful, remove the action from the queue
          const deleteRequest = store.delete(action.id);
          deleteRequest.onerror = (event) => {
            console.error('Error removing action:', event.target.error);
          };
        } catch (error) {
          console.error('Error processing action:', error);
          // Don't remove the action if it failed - will retry later
        }
      }
    };
    
    request.onerror = (event) => {
      console.error('Error getting pending actions:', event.target.error);
    };
  }

  // Sync methods for different actions
  async syncCreateReport(reportData) {
    try {
      const response = await fetch(`${API_BASE_URL}/reports`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reportData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create report');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error syncing report creation:', error);
      throw error;
    }
  }

  async syncUpdateReport(reportData) {
    try {
      const response = await fetch(`${API_BASE_URL}/reports/${reportData.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reportData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update report');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error syncing report update:', error);
      throw error;
    }
  }

  async syncDeleteReport(reportId) {
    try {
      const response = await fetch(`${API_BASE_URL}/reports/${reportId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete report');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error syncing report deletion:', error);
      throw error;
    }
  }

  async syncSendMessage(messageData) {
    try {
      // This would use the WebSocket connection in the real implementation
      // For simplicity, we'll mock it here
      if (chatSocket && chatSocket.readyState === WebSocket.OPEN) {
        chatSocket.send(JSON.stringify({
          type: 'message',
          recipient_id: messageData.recipient_id,
          content: messageData.content
        }));
      } else {
        throw new Error('WebSocket not connected');
      }
    } catch (error) {
      console.error('Error syncing message:', error);
      throw error;
    }
  }

  // Data caching methods
  async cacheReports(reports) {
    if (!this.db) return;
    
    const transaction = this.db.transaction(['reports'], 'readwrite');
    const store = transaction.objectStore('reports');
    
    // Clear existing reports
    store.clear();
    
    // Add new reports
    reports.forEach(report => {
      store.put(report);
    });
  }

  async getCachedReports() {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }
      
      const transaction = this.db.transaction(['reports'], 'readonly');
      const store = transaction.objectStore('reports');
      const request = store.getAll();
      
      request.onsuccess = () => {
        resolve(request.result || []);
      };
      
      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  }

  // Sync all data when online
  async fullSync() {
    if (!this.isOnline) return;
    
    try {
      // Sync reports
      const reports = await this.getCachedReports();
      if (reports.length > 0) {
        const response = await fetch(`${API_BASE_URL}/sync`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            last_sync_time: 0, // Force full sync
            created_reports: reports.filter(r => r.status === 'local'),
            updated_reports: [],
            deleted_report_ids: []
          })
        });
        
        if (!response.ok) {
          throw new Error('Sync failed');
        }
        
        const syncData = await response.json();
        await this.cacheReports(syncData.reports);
      }
      
      // Process any pending actions
      await this.checkPendingActions();
      
      return true;
    } catch (error) {
      console.error('Full sync failed:', error);
      return false;
    }
  }
}

// Create a single instance of the OfflineManager
const offlineManager = new OfflineManager();

// Export the instance
export default offlineManager;
