import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { employeeAPI, handleApiError } from '../../services/api';
import { toast } from 'react-toastify';
const EmployeeLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('login'); 
  const [setupToken, setSetupToken] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }
    try {
      setLoading(true);
      const response = await employeeAPI.login(formData);
      if (response.data.requiresSetup) {
        setSetupToken(response.data.setupToken);
        setStep('setup');
        toast.info('Please complete your account setup');
      } else {
        login(response.data.data, 'employee');
        toast.success('Login successful!');
        navigate('/employee/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };
  const handleSetup = async (e) => {
    e.preventDefault();
    const setupData = new FormData(e.target);
    const data = {
      name: setupData.get('name'),
      password: setupData.get('password'),
      confirmPassword: setupData.get('confirmPassword'),
      department: setupData.get('department'),
      role: setupData.get('role')
    };
    if (!data.name || !data.password || !data.confirmPassword || !data.department || !data.role) {
      toast.error('Please fill in all fields');
      return;
    }
    if (data.password !== data.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (data.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    try {
      setLoading(true);
      const response = await employeeAPI.completeSetup({
        ...data,
        setupToken
      });
      login(response.data.data, 'employee');
      toast.success('Account setup completed successfully!');
      navigate('/employee/dashboard');
    } catch (error) {
      console.error('Setup error:', error);
      toast.error(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };
  const handleBack = () => {
    if (step === 'setup') {
      setStep('login');
      setSetupToken('');
    } else {
      navigate('/');
    }
  };
  return (
    <div className="employee-login">
      <div className="login-container">
        <div className="login-card">
          <button className="back-button" onClick={handleBack}>
            ← Back
          </button>
          <div className="header">
            <h1>{step === 'login' ? 'Employee Login' : 'Account Setup'}</h1>
            <p>{step === 'login' ? 'Sign in to access your tasks' : 'Complete your profile'}</p>
          </div>
          {step === 'login' ? (
            <form onSubmit={handleLogin} className="login-form">
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  required
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                />
              </div>
              <button type="submit" className="submit-button" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSetup} className="setup-form">
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  placeholder="Enter your full name"
                  required
                  disabled={loading}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="department">Department</label>
                  <select id="department" name="department" required disabled={loading}>
                    <option value="">Select Department</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Sales">Sales</option>
                    <option value="Support">Support</option>
                    <option value="HR">Human Resources</option>
                    <option value="Finance">Finance</option>
                    <option value="Operations">Operations</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="role">Role</label>
                  <input
                    type="text"
                    id="role"
                    name="role"
                    placeholder="e.g. Software Developer"
                    required
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="password">Create Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  placeholder="Create a secure password"
                  required
                  disabled={loading}
                  minLength={6}
                />
              </div>
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="Confirm your password"
                  required
                  disabled={loading}
                  minLength={6}
                />
              </div>
              <button type="submit" className="submit-button" disabled={loading}>
                {loading ? 'Setting up...' : 'Complete Setup'}
              </button>
            </form>
          )}
        </div>
      </div>
      <style jsx>{`
        .employee-login {
          min-height: 100vh;
          background: #f8f9fa;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .login-container {
          width: 100%;
          max-width: 450px;
        }
        .login-card {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          padding: 40px;
          position: relative;
        }
        .back-button {
          position: absolute;
          top: 20px;
          left: 20px;
          background: none;
          border: none;
          color: #666;
          cursor: pointer;
          font-size: 14px;
          padding: 5px;
        }
        .back-button:hover {
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .header h1 {
          font-size: 1.5rem;
          color: #333;
          margin: 0 0 8px 0;
          font-weight: 600;
        }
        .header p {
          color: #666;
          margin: 0;
          font-size: 14px;
        }
        .login-form,
        .setup-form {
          display: flex;
          flex-direction: column;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .form-group {
          margin-bottom: 20px;
        }
        .form-group label {
          display: block;
          margin-bottom: 6px;
          font-weight: 500;
          color: #333;
          font-size: 14px;
        }
        .form-group input,
        .form-group select {
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 16px;
          box-sizing: border-box;
        }
        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: #10b981;
        }
        .form-group input:disabled,
        .form-group select:disabled {
          background: #f5f5f5;
          color: #666;
        }
        .submit-button {
          width: 100%;
          padding: 12px;
          background: #10b981;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
        }
        .submit-button:hover:not(:disabled) {
          background: #059669;
        }
        .submit-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        @media (max-width: 480px) {
          .login-card {
            padding: 30px 20px;
          }
          .back-button {
            position: static;
            margin-bottom: 20px;
            text-align: left;
          }
          .form-row {
            grid-template-columns: 1fr;
            gap: 0;
          }
        }
      `}</style>
    </div>
  );
};
export default EmployeeLogin;
