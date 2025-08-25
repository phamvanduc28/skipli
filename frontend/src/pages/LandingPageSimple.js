import React from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <div className="container">
        <header className="header">
          <h1>Skipli</h1>
          <p>Employee Task Management System</p>
        </header>

        <main className="main-content">
          <div className="login-options">
            <div className="login-card">
              <h2>Owner/Manager Login</h2>
              <p>Login with phone number verification</p>
              <button 
                className="login-btn"
                onClick={() => navigate('/owner/login')}
              >
                Login as Manager
              </button>
            </div>

            <div className="login-card">
              <h2>Employee Login</h2>
              <p>Login with email and password</p>
              <button 
                className="login-btn"
                onClick={() => navigate('/employee/login')}
              >
                Login as Employee
              </button>
            </div>
          </div>
        </main>
      </div>

      <style jsx>{`
        .landing-page {
          min-height: 100vh;
          background: #f5f5f5;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }

        .header {
          text-align: center;
          margin-bottom: 50px;
        }

        .header h1 {
          font-size: 3rem;
          margin-bottom: 10px;
          color: #333;
        }

        .header p {
          font-size: 1.2rem;
          color: #666;
        }

        .login-options {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
        }

        .login-card {
          background: white;
          padding: 40px;
          border-radius: 8px;
          text-align: center;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .login-card h2 {
          margin-bottom: 15px;
          color: #333;
        }

        .login-card p {
          margin-bottom: 25px;
          color: #666;
        }

        .login-btn {
          background: #007bff;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          width: 100%;
        }

        .login-btn:hover {
          background: #0056b3;
        }

        @media (max-width: 768px) {
          .login-options {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
