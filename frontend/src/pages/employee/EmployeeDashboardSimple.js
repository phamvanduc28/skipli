import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { employeeAPI, taskAPI, handleApiError } from '../../services/api';
import { toast } from 'react-toastify';
import ChatComponent from '../../components/ChatComponent';

const EmployeeDashboard = () => {
  const [activeTab, setActiveTab] = useState('tasks');
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);

  const { user, logout } = useAuth();
  const { isConnected } = useSocket();

  useEffect(() => {
    loadEmployeeData();
  }, []);

  const loadEmployeeData = async () => {
    try {
      setLoading(true);
      const [profileResponse, tasksResponse] = await Promise.all([
        employeeAPI.getProfile(),
        employeeAPI.getTasks()
      ]);

      setProfile(profileResponse.data.data);
      setTasks(tasksResponse.data.data);

      // Calculate stats
      const taskStats = {
        total: tasksResponse.data.data.length,
        pending: tasksResponse.data.data.filter(t => t.status === 'pending').length,
        inProgress: tasksResponse.data.data.filter(t => t.status === 'in-progress').length,
        completed: tasksResponse.data.data.filter(t => t.status === 'completed').length
      };
      setStats(taskStats);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      await taskAPI.updateStatus(taskId, newStatus);
      
      // Update local state
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId 
            ? { ...task, status: newStatus, updatedAt: new Date().toISOString() }
            : task
        )
      );

      // Recalculate stats
      const updatedTasks = tasks.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      );
      const taskStats = {
        total: updatedTasks.length,
        pending: updatedTasks.filter(t => t.status === 'pending').length,
        inProgress: updatedTasks.filter(t => t.status === 'in-progress').length,
        completed: updatedTasks.filter(t => t.status === 'completed').length
      };
      setStats(taskStats);

      toast.success('Task status updated successfully');
    } catch (error) {
      console.error('Failed to update task status:', error);
      toast.error(handleApiError(error));
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#fbbf24';
      case 'in-progress': return '#3b82f6';
      case 'completed': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading">Loading...</div>
        <style jsx>{`
          .dashboard {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f8fafc;
          }
          .loading {
            font-size: 18px;
            color: #666;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="header">
        <div className="header-content">
          <div className="header-left">
            <h1>Employee Dashboard</h1>
            <div className="connection-status">
              Status: {isConnected ? 'Connected' : 'Disconnected'}
              <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
            </div>
          </div>
          <div className="header-right">
            <span className="user-name">Hello, {profile?.name || user?.name || 'Employee'}</span>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="main-content">
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'tasks' ? 'active' : ''}`}
            onClick={() => setActiveTab('tasks')}
          >
            Tasks
          </button>
          <button 
            className={`tab ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            Chat
          </button>
          <button 
            className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'tasks' && (
            <div className="tasks-section">
              {stats && (
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-number">{stats.total}</div>
                    <div className="stat-label">Total Tasks</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">{stats.pending}</div>
                    <div className="stat-label">Pending</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">{stats.inProgress}</div>
                    <div className="stat-label">In Progress</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">{stats.completed}</div>
                    <div className="stat-label">Completed</div>
                  </div>
                </div>
              )}

              <div className="tasks-container">
                <h2>My Tasks</h2>
                {tasks.length === 0 ? (
                  <div className="empty-state">
                    <p>No tasks assigned yet</p>
                  </div>
                ) : (
                  <div className="tasks-grid">
                    {tasks.map(task => (
                      <div key={task.id} className="task-card">
                        <div className="task-header">
                          <h3>{task.title}</h3>
                          <div className="task-meta">
                            <span 
                              className="priority-badge"
                              style={{ backgroundColor: getPriorityColor(task.priority) }}
                            >
                              {task.priority}
                            </span>
                            <span 
                              className="status-badge"
                              style={{ backgroundColor: getStatusColor(task.status) }}
                            >
                              {task.status}
                            </span>
                          </div>
                        </div>
                        
                        <p className="task-description">{task.description}</p>
                        
                        <div className="task-dates">
                          <div>Created: {formatDate(task.createdAt)}</div>
                          {task.dueDate && (
                            <div>Due: {formatDate(task.dueDate)}</div>
                          )}
                        </div>

                        <div className="task-actions">
                          {task.status === 'pending' && (
                            <button 
                              onClick={() => updateTaskStatus(task.id, 'in-progress')}
                              className="action-button start"
                            >
                              Start Task
                            </button>
                          )}
                          {task.status === 'in-progress' && (
                            <>
                              <button 
                                onClick={() => updateTaskStatus(task.id, 'pending')}
                                className="action-button pause"
                              >
                                Pause
                              </button>
                              <button 
                                onClick={() => updateTaskStatus(task.id, 'completed')}
                                className="action-button complete"
                              >
                                Complete
                              </button>
                            </>
                          )}
                          {task.status === 'completed' && (
                            <span className="completed-text">Task Completed</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="chat-section">
              <ChatComponent />
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="profile-section">
              <div className="profile-card">
                <h2>Profile Information</h2>
                {profile && (
                  <div className="profile-info">
                    <div className="info-row">
                      <label>Name:</label>
                      <span>{profile.name}</span>
                    </div>
                    <div className="info-row">
                      <label>Email:</label>
                      <span>{profile.email}</span>
                    </div>
                    <div className="info-row">
                      <label>Department:</label>
                      <span>{profile.department}</span>
                    </div>
                    <div className="info-row">
                      <label>Role:</label>
                      <span>{profile.role}</span>
                    </div>
                    <div className="info-row">
                      <label>Joined:</label>
                      <span>{formatDate(profile.createdAt)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .dashboard {
          min-height: 100vh;
          background: #f8fafc;
        }

        .header {
          background: white;
          border-bottom: 1px solid #e2e8f0;
          padding: 20px 0;
        }

        .header-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .header-left h1 {
          margin: 0 0 8px 0;
          font-size: 1.5rem;
          font-weight: 600;
          color: #1a202c;
        }

        .connection-status {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #666;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .status-dot.connected {
          background: #10b981;
        }

        .status-dot.disconnected {
          background: #ef4444;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .user-name {
          font-weight: 500;
          color: #333;
        }

        .logout-button {
          background: #ef4444;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        .logout-button:hover {
          background: #dc2626;
        }

        .main-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        .tabs {
          display: flex;
          gap: 2px;
          margin-bottom: 20px;
          border-bottom: 1px solid #e2e8f0;
        }

        .tab {
          background: none;
          border: none;
          padding: 12px 24px;
          cursor: pointer;
          font-size: 14px;
          border-bottom: 2px solid transparent;
          color: #666;
        }

        .tab.active {
          color: #3b82f6;
          border-bottom-color: #3b82f6;
        }

        .tab:hover:not(.active) {
          color: #333;
        }

        .tab-content {
          background: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          min-height: 500px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
          padding: 20px;
        }

        .stat-card {
          background: #f8fafc;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
        }

        .stat-number {
          font-size: 2rem;
          font-weight: 700;
          color: #1a202c;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 14px;
          color: #666;
        }

        .tasks-container {
          padding: 20px;
        }

        .tasks-container h2 {
          margin: 0 0 20px 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: #1a202c;
        }

        .empty-state {
          text-align: center;
          padding: 40px;
          color: #666;
        }

        .tasks-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 20px;
        }

        .task-card {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 20px;
          background: white;
        }

        .task-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .task-header h3 {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
          color: #1a202c;
          flex: 1;
        }

        .task-meta {
          display: flex;
          gap: 8px;
          margin-left: 12px;
        }

        .priority-badge,
        .status-badge {
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
          color: white;
          text-transform: capitalize;
        }

        .task-description {
          color: #666;
          font-size: 14px;
          margin: 0 0 16px 0;
          line-height: 1.4;
        }

        .task-dates {
          font-size: 12px;
          color: #666;
          margin-bottom: 16px;
        }

        .task-dates > div {
          margin-bottom: 4px;
        }

        .task-actions {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .action-button {
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
        }

        .action-button.start {
          background: #3b82f6;
          color: white;
        }

        .action-button.start:hover {
          background: #2563eb;
        }

        .action-button.pause {
          background: #f59e0b;
          color: white;
        }

        .action-button.pause:hover {
          background: #d97706;
        }

        .action-button.complete {
          background: #10b981;
          color: white;
        }

        .action-button.complete:hover {
          background: #059669;
        }

        .completed-text {
          color: #10b981;
          font-size: 12px;
          font-weight: 500;
        }

        .chat-section,
        .profile-section {
          padding: 20px;
        }

        .profile-card {
          background: white;
          border-radius: 8px;
          padding: 20px;
        }

        .profile-card h2 {
          margin: 0 0 20px 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: #1a202c;
        }

        .profile-info {
          max-width: 400px;
        }

        .info-row {
          display: flex;
          margin-bottom: 16px;
          align-items: center;
        }

        .info-row label {
          font-weight: 500;
          color: #333;
          width: 120px;
          flex-shrink: 0;
        }

        .info-row span {
          color: #666;
        }

        @media (max-width: 768px) {
          .header-content {
            flex-direction: column;
            gap: 16px;
            text-align: center;
          }

          .tasks-grid {
            grid-template-columns: 1fr;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .task-header {
            flex-direction: column;
            gap: 8px;
          }

          .task-meta {
            margin-left: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default EmployeeDashboard;
