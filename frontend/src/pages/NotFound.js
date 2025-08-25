import React from 'react';
import { Link } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';
const NotFound = () => {
  return (
    <div className="not-found-page">
      <div className="not-found-container">
        <div className="not-found-content">
          <div className="not-found-icon">
            <AlertCircle size={64} />
          </div>
          <h1>404</h1>
          <h2>Page Not Found</h2>
          <p>
            Sorry, we couldn't find the page you're looking for. 
            The page might have been moved, deleted, or you entered the wrong URL.
          </p>
          <div className="not-found-actions">
            <Link to="/" className="btn btn-primary">
              <Home size={20} />
              Go Home
            </Link>
            <button 
              onClick={() => window.history.back()} 
              className="btn btn-outline"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
      <style jsx>{`
        .not-found-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .not-found-container {
          text-align: center;
          color: white;
        }
        .not-found-content {
          max-width: 600px;
          margin: 0 auto;
        }
        .not-found-icon {
          margin-bottom: 30px;
          opacity: 0.8;
        }
        .not-found-content h1 {
          font-size: 6rem;
          font-weight: 700;
          margin: 0;
          opacity: 0.9;
        }
        .not-found-content h2 {
          font-size: 2rem;
          font-weight: 600;
          margin: 0 0 20px 0;
        }
        .not-found-content p {
          font-size: 1.125rem;
          margin-bottom: 40px;
          opacity: 0.9;
          line-height: 1.6;
        }
        .not-found-actions {
          display: flex;
          gap: 20px;
          justify-content: center;
          flex-wrap: wrap;
        }
        @media (max-width: 480px) {
          .not-found-content h1 {
            font-size: 4rem;
          }
          .not-found-content h2 {
            font-size: 1.5rem;
          }
          .not-found-actions {
            flex-direction: column;
            align-items: center;
          }
          .not-found-actions .btn {
            width: 200px;
          }
        }
      `}</style>
    </div>
  );
};
export default NotFound;
