import { useState, useEffect } from 'react'
import { useSocket } from '../contexts/SocketContext'
import { Clock, Check, X, User, Monitor, AlertCircle } from 'lucide-react'

export default function PermissionRequests() {
  const { socket } = useSocket()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Load permission requests
    loadPermissionRequests()

    // Listen for new permission requests
    socket?.on('permission_request', (request) => {
      setRequests(prev => [request, ...prev])
    })

    return () => {
      socket?.off('permission_request')
    }
  }, [socket])

  const loadPermissionRequests = async () => {
    setLoading(true)
    try {
      // Mock data for now - replace with actual API call
      const mockRequests = [
        {
          id: '1',
          userId: 'user1',
          userName: 'John Doe',
          userEmail: 'john@company.com',
          deviceId: 'device1',
          deviceName: 'DESKTOP-ABC123',
          requestType: 'unlock',
          reason: 'Need to access work files urgently',
          status: 'pending',
          createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          priority: 'high'
        },
        {
          id: '2',
          userId: 'user2',
          userName: 'Jane Smith',
          userEmail: 'jane@company.com',
          deviceId: 'device2',
          deviceName: 'LAPTOP-XYZ789',
          requestType: 'remote_access',
          reason: 'Technical support needed',
          status: 'pending',
          createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          priority: 'medium'
        },
        {
          id: '3',
          userId: 'user3',
          userName: 'Bob Wilson',
          userEmail: 'bob@company.com',
          deviceId: 'device3',
          deviceName: 'WORKSTATION-DEF456',
          requestType: 'unlock',
          reason: 'Forgot to unlock before leaving',
          status: 'approved',
          createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          approvedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
          approvedBy: 'Admin User',
          priority: 'low'
        }
      ]
      setRequests(mockRequests)
    } catch (error) {
      console.error('Failed to load permission requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApproveRequest = async (requestId) => {
    try {
      socket?.emit('approve_permission', { requestId })
      setRequests(prev => prev.map(req => 
        req.id === requestId 
          ? { ...req, status: 'approved', approvedAt: new Date().toISOString(), approvedBy: 'Current User' }
          : req
      ))
    } catch (error) {
      console.error('Failed to approve request:', error)
    }
  }

  const handleRejectRequest = async (requestId) => {
    try {
      socket?.emit('reject_permission', { requestId })
      setRequests(prev => prev.map(req => 
        req.id === requestId 
          ? { ...req, status: 'rejected', rejectedAt: new Date().toISOString(), rejectedBy: 'Current User' }
          : req
      ))
    } catch (error) {
      console.error('Failed to reject request:', error)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-warning-100 text-warning-800'
      case 'approved':
        return 'bg-success-100 text-success-800'
      case 'rejected':
        return 'bg-danger-100 text-danger-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'text-danger-600'
      case 'medium':
        return 'text-warning-600'
      case 'low':
        return 'text-success-600'
      default:
        return 'text-gray-600'
    }
  }

  const formatTimeAgo = (timestamp) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInMinutes = Math.floor((now - time) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }

  const pendingRequests = requests.filter(req => req.status === 'pending')
  const processedRequests = requests.filter(req => req.status !== 'pending')

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Permission Requests</h2>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            {pendingRequests.length} pending requests
          </div>
          <button
            onClick={loadPermissionRequests}
            disabled={loading}
            className="btn-secondary flex items-center space-x-2"
          >
            <Clock className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-warning-600" />
            <span>Pending Requests</span>
          </h3>
          
          <div className="space-y-3">
            {pendingRequests.map((request) => (
              <div key={request.id} className="card border-l-4 border-l-warning-400">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{request.userName}</span>
                        <span className="text-sm text-gray-500">({request.userEmail})</span>
                      </div>
                      <span className={`text-sm font-medium ${getPriorityColor(request.priority)}`}>
                        {request.priority.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2 mb-2">
                      <Monitor className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{request.deviceName}</span>
                      <span className="text-sm text-gray-400">•</span>
                      <span className="text-sm text-gray-600 capitalize">{request.requestType.replace('_', ' ')}</span>
                    </div>
                    
                    <p className="text-sm text-gray-700 mb-3">{request.reason}</p>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Requested {formatTimeAgo(request.createdAt)}</span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleApproveRequest(request.id)}
                      className="btn-success flex items-center space-x-1 text-sm px-3 py-1"
                    >
                      <Check className="h-3 w-3" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => handleRejectRequest(request.id)}
                      className="btn-danger flex items-center space-x-1 text-sm px-3 py-1"
                    >
                      <X className="h-3 w-3" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Processed Requests */}
      {processedRequests.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
          
          <div className="space-y-3">
            {processedRequests.map((request) => (
              <div key={request.id} className="card bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{request.userName}</span>
                        <span className="text-sm text-gray-500">({request.userEmail})</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 mb-2">
                      <Monitor className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{request.deviceName}</span>
                      <span className="text-sm text-gray-400">•</span>
                      <span className="text-sm text-gray-600 capitalize">{request.requestType.replace('_', ' ')}</span>
                    </div>
                    
                    <p className="text-sm text-gray-700 mb-3">{request.reason}</p>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Requested {formatTimeAgo(request.createdAt)}</span>
                      {request.approvedAt && (
                        <span>Approved {formatTimeAgo(request.approvedAt)} by {request.approvedBy}</span>
                      )}
                      {request.rejectedAt && (
                        <span>Rejected {formatTimeAgo(request.rejectedAt)} by {request.rejectedBy}</span>
                      )}
                    </div>
                  </div>
                  
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                    {request.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {requests.length === 0 && !loading && (
        <div className="text-center py-12">
          <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Permission Requests</h3>
          <p className="text-gray-600">
            Permission requests from users will appear here for approval.
          </p>
        </div>
      )}

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading requests...</p>
        </div>
      )}
    </div>
  )
}
