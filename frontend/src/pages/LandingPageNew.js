import React from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <div className="container">
        <div className="form-container">
          <div className="logo">
            <h1>Skipli</h1>
          </div>
          
          <div className="login-form">
            <h2>Welcome Back</h2>
            <p>Choose your login type</p>
            
            <div className="button-group">
              <button 
                className="login-button manager"
                onClick={() => navigate('/owner/login')}
              >
                Manager Login
              </button>
              
              <button 
                className="login-button employee"
                onClick={() => navigate('/employee/login')}
              >
                Employee Login
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .landing-page {
          min-height: 100vh;
          background: #f8f9fa;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .container {
          width: 100%;
          max-width: 400px;
        }

        .form-container {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          padding: 40px;
          text-align: center;
        }

        .logo h1 {
          font-size: 2rem;
          font-weight: 600;
          color: #333;
          margin: 0 0 30px 0;
        }

        .login-form h2 {
          font-size: 1.5rem;
          color: #333;
          margin: 0 0 8px 0;
          font-weight: 500;
        }

        .login-form p {
          color: #666;
          margin: 0 0 30px 0;
          font-size: 14px;
        }

        .button-group {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .login-button {
          width: 100%;
          padding: 12px 24px;
          border: none;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .login-button.manager {
          background: #3b82f6;
          color: white;
        }

        .login-button.manager:hover {
          background: #2563eb;
        }

        .login-button.employee {
          background: #10b981;
          color: white;
        }

        .login-button.employee:hover {
          background: #059669;
        }

        @media (max-width: 480px) {
          .form-container {
            padding: 30px 20px;
          }
          
          .logo h1 {
            font-size: 1.75rem;
          }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
