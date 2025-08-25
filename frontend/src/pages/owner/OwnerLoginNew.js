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

  const handleBack = () => {
    if (step === 'verify') {
      setStep('phone');
      setOtp('');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="owner-login">
      <div className="login-container">
        <div className="login-card">
          <button className="back-button" onClick={handleBack}>
            ← Back
          </button>
          
          <div className="header">
            <h1>Manager Login</h1>
            <p>{step === 'phone' ? 'Enter your phone number' : 'Enter verification code'}</p>
          </div>

          {step === 'phone' ? (
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

              <button type="submit" className="submit-button" disabled={loading}>
                {loading ? 'Sending...' : 'Send Code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="login-form">
              <div className="form-group">
                <label htmlFor="otp">Verification Code</label>
                <input
                  type="text"
                  id="otp"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  required
                  disabled={loading}
                />
              </div>

              <button type="submit" className="submit-button" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify & Login'}
              </button>

              <button type="button" className="resend-button" onClick={() => setStep('phone')}>
                Change Phone Number
              </button>
            </form>
          )}
        </div>
      </div>

      <style jsx>{`
        .owner-login {
          min-height: 100vh;
          background: #f8f9fa;
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

        .login-form {
          display: flex;
          flex-direction: column;
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

        .form-group input {
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 16px;
          box-sizing: border-box;
        }

        .form-group input:focus {
          outline: none;
          border-color: #3b82f6;
        }

        .form-group input:disabled {
          background: #f5f5f5;
          color: #666;
        }

        .submit-button {
          width: 100%;
          padding: 12px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          margin-bottom: 12px;
        }

        .submit-button:hover:not(:disabled) {
          background: #2563eb;
        }

        .submit-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .resend-button {
          background: none;
          border: none;
          color: #666;
          cursor: pointer;
          font-size: 14px;
          text-decoration: underline;
        }

        .resend-button:hover {
          color: #333;
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
        }
      `}</style>
    </div>
  );
};

export default OwnerLogin;
