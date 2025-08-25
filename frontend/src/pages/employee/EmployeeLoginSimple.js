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
  const [step, setStep] = useState('login'); // 'login' or 'setup'
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

  const handleBackToHome = () => {
    navigate('/');
  };

  const handleBackToLogin = () => {
    setStep('login');
    setSetupToken('');
  };

  return (
    <div className="employee-login">
      <div className="login-container">
        <div className="login-card">
          <button className="back-button" onClick={handleBackToHome}>
            ← Back to Home
          </button>
          
          <div className="logo">Skipli</div>
          
          {step === 'login' ? (
            <>
              <h1>Employee Login</h1>
              <p>Sign in to access your tasks</p>

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

                <button type="submit" className="login-button" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>

                <div className="login-help">
                  <p>Don't have an account? Contact your manager to get access.</p>
                </div>
              </form>
            </>
          ) : (
            <>
              <h1>Complete Setup</h1>
              <p>Please complete your account setup</p>

              <form onSubmit={handleSetup} className="setup-form">
                <button type="button" className="back-link" onClick={handleBackToLogin}>
                  ← Back to Login
                </button>

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
                  <small>Password must be at least 6 characters long</small>
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

                <button type="submit" className="setup-button" disabled={loading}>
                  {loading ? 'Setting up...' : 'Complete Setup'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        .employee-login {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .login-container {
          width: 100%;
          max-width: 500px;
        }

        .login-card {
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
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
        }

        .back-button:hover {
          color: #333;
        }

        .logo {
          font-size: 2rem;
          font-weight: 700;
          color: #333;
          margin-bottom: 24px;
          text-align: center;
        }

        h1 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #333;
          margin: 0 0 8px 0;
          text-align: center;
        }

        p {
          color: #666;
          margin: 0 0 30px 0;
          text-align: center;
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
          margin-bottom: 8px;
          font-weight: 500;
          color: #333;
          font-size: 14px;
        }

        .form-group input,
        .form-group select {
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 16px;
          box-sizing: border-box;
        }

        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: #667eea;
        }

        .form-group input:disabled,
        .form-group select:disabled {
          background: #f5f5f5;
          color: #666;
        }

        .form-group small {
          display: block;
          margin-top: 4px;
          font-size: 12px;
          color: #666;
        }

        .login-button,
        .setup-button {
          width: 100%;
          padding: 12px 24px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          margin-top: 10px;
        }

        .login-button:hover:not(:disabled),
        .setup-button:hover:not(:disabled) {
          background: #5a67d8;
        }

        .login-button:disabled,
        .setup-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .back-link {
          background: none;
          border: none;
          color: #666;
          cursor: pointer;
          font-size: 14px;
          margin-bottom: 20px;
        }

        .back-link:hover:not(:disabled) {
          color: #333;
        }

        .login-help {
          text-align: center;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #eee;
        }

        .login-help p {
          color: #666;
          font-size: 14px;
        }

        @media (max-width: 768px) {
          .login-card {
            padding: 30px 20px;
          }

          .back-button {
            position: static;
            margin-bottom: 20px;
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
