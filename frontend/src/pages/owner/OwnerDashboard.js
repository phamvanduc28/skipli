import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ownerAPI, taskAPI, handleApiError } from '../../services/api';
import { toast } from 'react-toastify';
const OwnerDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({});
  const { logout } = useAuth();
  useEffect(() => {
    loadData();
  }, []);
  const loadData = async () => {
    try {
      setLoading(true);
      const [employeesResponse, tasksResponse] = await Promise.all([
        ownerAPI.getEmployees(),
        taskAPI.getTasks()
      ]);
      setEmployees(employeesResponse.data.data);
      setTasks(tasksResponse.data.data);
      const taskStats = {
        totalEmployees: employeesResponse.data.data.length,
        totalTasks: tasksResponse.data.data.length,
        pendingTasks: tasksResponse.data.data.filter(t => t.status === 'pending').length,
        completedTasks: tasksResponse.data.data.filter(t => t.status === 'completed').length
      };
      setStats(taskStats);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };
  const handleLogout = () => {
    logout();
    toast.info('Logged out successfully');
  };
  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }
  return (
    <div className="dashboard">
      <header className="header">
        <div className="container">
          <h1>Skipli Dashboard</h1>
          <div className="header-actions">
            <span>Welcome, Manager</span>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </div>
        </div>
      </header>
      <div className="container">
        <nav className="tabs">
          <button 
            className={activeTab === 'dashboard' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
          <button 
            className={activeTab === 'employees' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('employees')}
          >
            Employees ({employees.length})
          </button>
          <button 
            className={activeTab === 'tasks' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('tasks')}
          >
            Tasks ({tasks.length})
          </button>
          <button 
            className={activeTab === 'messages' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('messages')}
          >
            Messages
          </button>
        </nav>
        <main className="content">
          {activeTab === 'dashboard' && (
            <div className="dashboard-content">
              <h2>Overview</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>{stats.totalEmployees}</h3>
                  <p>Total Employees</p>
                </div>
                <div className="stat-card">
                  <h3>{stats.totalTasks}</h3>
                  <p>Total Tasks</p>
                </div>
                <div className="stat-card">
                  <h3>{stats.pendingTasks}</h3>
                  <p>Pending Tasks</p>
                </div>
                <div className="stat-card">
                  <h3>{stats.completedTasks}</h3>
                  <p>Completed Tasks</p>
                </div>
              </div>
              <div className="recent-section">
                <div className="recent-employees">
                  <h3>Recent Employees</h3>
                  {employees.slice(0, 5).map(employee => (
                    <div key={employee.id} className="employee-item">
                      <strong>{employee.name}</strong>
                      <span>{employee.department}</span>
                    </div>
                  ))}
                </div>
                <div className="recent-tasks">
                  <h3>Recent Tasks</h3>
                  {tasks.slice(0, 5).map(task => (
                    <div key={task.id} className="task-item">
                      <strong>{task.title}</strong>
                      <span className={`status ${task.status}`}>{task.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {activeTab === 'employees' && (
            <div className="employees-content">
              <div className="section-header">
                <h2>Employees</h2>
                <button className="add-btn">Add Employee</button>
              </div>
              <div className="employees-table">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Department</th>
                      <th>Role</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map(employee => (
                      <tr key={employee.id}>
                        <td>{employee.name}</td>
                        <td>{employee.email}</td>
                        <td>{employee.department}</td>
                        <td>{employee.role}</td>
                        <td>
                          <button className="edit-btn">Edit</button>
                          <button className="delete-btn">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {activeTab === 'tasks' && (
            <div className="tasks-content">
              <div className="section-header">
                <h2>Tasks</h2>
                <button className="add-btn">Create Task</button>
              </div>
              <div className="tasks-table">
                <table>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Assigned To</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Due Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map(task => (
                      <tr key={task.id}>
                        <td>{task.title}</td>
                        <td>{task.assignedEmployee?.name || 'Unassigned'}</td>
                        <td><span className={`priority ${task.priority}`}>{task.priority}</span></td>
                        <td><span className={`status ${task.status}`}>{task.status}</span></td>
                        <td>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}</td>
                        <td>
                          <button className="edit-btn">Edit</button>
                          <button className="delete-btn">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {activeTab === 'messages' && (
            <div className="messages-content">
              <h2>Messages</h2>
              <div className="placeholder">
                <p>Real-time chat functionality</p>
                <p>Select an employee to start chatting</p>
              </div>
            </div>
          )}
        </main>
      </div>
      <style jsx>{`
        .dashboard {
          min-height: 100vh;
          background: #f5f5f5;
        }
        .header {
          background: white;
          border-bottom: 1px solid #ddd;
          padding: 15px 0;
        }
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }
        .header .container {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .header h1 {
          margin: 0;
          color: #333;
        }
        .header-actions {
          display: flex;
          align-items: center;
          gap: 15px;
        }
        .logout-btn {
          background: #dc3545;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
        }
        .logout-btn:hover {
          background: #c82333;
        }
        .tabs {
          display: flex;
          gap: 10px;
          margin: 20px 0;
          border-bottom: 2px solid #ddd;
        }
        .tab {
          background: none;
          border: none;
          padding: 10px 20px;
          cursor: pointer;
          border-bottom: 3px solid transparent;
          font-size: 16px;
        }
        .tab:hover {
          background: #f8f9fa;
        }
        .tab.active {
          border-bottom-color: #007bff;
          color: #007bff;
          font-weight: 500;
        }
        .content {
          background: white;
          border-radius: 8px;
          padding: 30px;
          margin-bottom: 20px;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin: 20px 0;
        }
        .stat-card {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
        }
        .stat-card h3 {
          font-size: 2rem;
          margin: 0 0 5px 0;
          color: #007bff;
        }
        .stat-card p {
          margin: 0;
          color: #666;
        }
        .recent-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          margin-top: 30px;
        }
        .recent-employees,
        .recent-tasks {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
        }
        .recent-employees h3,
        .recent-tasks h3 {
          margin: 0 0 15px 0;
          color: #333;
        }
        .employee-item,
        .task-item {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #ddd;
        }
        .employee-item:last-child,
        .task-item:last-child {
          border-bottom: none;
        }
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .section-header h2 {
          margin: 0;
          color: #333;
        }
        .add-btn {
          background: #28a745;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
        }
        .add-btn:hover {
          background: #218838;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th, td {
          text-align: left;
          padding: 12px;
          border-bottom: 1px solid #ddd;
        }
        th {
          background: #f8f9fa;
          font-weight: 600;
        }
        .edit-btn {
          background: #007bff;
          color: white;
          border: none;
          padding: 5px 10px;
          border-radius: 3px;
          cursor: pointer;
          margin-right: 5px;
        }
        .delete-btn {
          background: #dc3545;
          color: white;
          border: none;
          padding: 5px 10px;
          border-radius: 3px;
          cursor: pointer;
        }
        .status, .priority {
          padding: 3px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }
        .status.pending {
          background: #fff3cd;
          color: #856404;
        }
        .status.in-progress {
          background: #cce5ff;
          color: #004085;
        }
        .status.completed {
          background: #d4edda;
          color: #155724;
        }
        .priority.high {
          background: #f8d7da;
          color: #721c24;
        }
        .priority.medium {
          background: #fff3cd;
          color: #856404;
        }
        .priority.low {
          background: #d1ecf1;
          color: #0c5460;
        }
        .placeholder {
          text-align: center;
          padding: 50px;
          color: #666;
        }
        .loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
        }
        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #007bff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          .recent-section {
            grid-template-columns: 1fr;
          }
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          table {
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
};
export default OwnerDashboard;
