import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ownerAPI, handleApiError } from '../../services/api';
import { toast } from 'react-toastify';

const OwnerLogin = () => {
  const [step, setStep] = useState('phone'); // 'phone' or 'verify'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    
    if (!phoneNumber) {
      toast.error('Please enter phone number');
      return;
    }

    try {
      setLoading(true);
      await ownerAPI.requestOtp({ phoneNumber });
      setStep('verify');
      toast.success('Verification code sent to your phone');
    } catch (error) {
      toast.error(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    
    if (!otp) {
      toast.error('Please enter verification code');
      return;
    }

    try {
      setLoading(true);
      const response = await ownerAPI.verifyOtp({ phoneNumber, otp });
      login(response.data.data, 'owner');
      toast.success('Login successful!');
      navigate('/owner/dashboard');
    } catch (error) {
      toast.error(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  const handleBackToPhone = () => {
    setStep('phone');
    setOtp('');
  };

  return (
    <div className="owner-login">
      <div className="login-container">
        <div className="login-card">
          <button className="back-button" onClick={handleBackToHome}>
            ← Back to Home
          </button>
          
          <div className="logo">Skipli</div>
          
          {step === 'phone' ? (
            <>
              <h1>Manager Login</h1>
              <p>Enter your phone number to receive verification code</p>

              <form onSubmit={handleRequestOtp} className="login-form">
                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1234567890"
                    required
                    disabled={loading}
                  />
                </div>

                <button type="submit" className="login-button" disabled={loading}>
                  {loading ? 'Sending...' : 'Send Verification Code'}
                </button>
              </form>
            </>
          ) : (
            <>
              <h1>Verify Code</h1>
              <p>Enter the 6-digit code sent to {phoneNumber}</p>

              <form onSubmit={handleVerifyOtp} className="login-form">
                <div className="form-group">
                  <label htmlFor="otp">Verification Code</label>
                  <input
                    type="text"
                    id="otp"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                    required
                    disabled={loading}
                    maxLength={6}
                  />
                </div>

                <button type="submit" className="login-button" disabled={loading}>
                  {loading ? 'Verifying...' : 'Verify & Login'}
                </button>

                <button 
                  type="button" 
                  className="back-link" 
                  onClick={handleBackToPhone}
                  disabled={loading}
                >
                  ← Change Phone Number
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        .owner-login {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .login-container {
          width: 100%;
          max-width: 400px;
        }

        .login-card {
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          padding: 40px;
          text-align: center;
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
        }

        h1 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #333;
          margin: 0 0 8px 0;
        }

        p {
          color: #666;
          margin: 0 0 30px 0;
        }

        .form-group {
          margin-bottom: 20px;
          text-align: left;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: #333;
          font-size: 14px;
        }

        .form-group input {
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 16px;
          box-sizing: border-box;
        }

        .form-group input:focus {
          outline: none;
          border-color: #667eea;
        }

        .form-group input:disabled {
          background: #f5f5f5;
          color: #666;
        }

        .login-button {
          width: 100%;
          padding: 12px 24px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          margin-bottom: 20px;
        }

        .login-button:hover:not(:disabled) {
          background: #5a67d8;
        }

        .login-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .back-link {
          background: none;
          border: none;
          color: #666;
          cursor: pointer;
          font-size: 14px;
        }

        .back-link:hover:not(:disabled) {
          color: #333;
        }

        .back-link:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .login-card {
            padding: 30px 20px;
          }

          .back-button {
            position: static;
            margin-bottom: 20px;
          }
        }
      `}</style>
    </div>
  );
};

export default OwnerLogin;
