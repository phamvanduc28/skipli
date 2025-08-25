import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authUtils } from '../services/api';
const AuthContext = createContext();
const AUTH_ACTIONS = {
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  UPDATE_USER: 'UPDATE_USER',
};
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN:
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
        error: null,
      };
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
        error: null,
      };
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };
    case AUTH_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };
    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };
    default:
      return state;
  }
};
const initialState = {
  isAuthenticated: false,
  user: null,
  token: null,
  loading: true,
  error: null,
};
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const { token, user } = authUtils.getAuthData();
        if (token && user) {
          dispatch({
            type: AUTH_ACTIONS.LOGIN,
            payload: { token, user },
          });
        } else {
          dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        authUtils.clearAuthData();
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      }
    };
    initializeAuth();
  }, []);
  const login = (token, user) => {
    try {
      authUtils.setAuthData(token, user);
      dispatch({
        type: AUTH_ACTIONS.LOGIN,
        payload: { token, user },
      });
    } catch (error) {
      console.error('Error during login:', error);
      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: 'Failed to save authentication data',
      });
    }
  };
  const logout = () => {
    try {
      authUtils.clearAuthData();
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };
  const setLoading = (loading) => {
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: loading });
  };
  const setError = (error) => {
    dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: error });
  };
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };
  const updateUser = (userData) => {
    try {
      const updatedUser = { ...state.user, ...userData };
      authUtils.setAuthData(state.token, updatedUser);
      dispatch({
        type: AUTH_ACTIONS.UPDATE_USER,
        payload: userData,
      });
    } catch (error) {
      console.error('Error updating user:', error);
      setError('Failed to update user data');
    }
  };
  const hasRole = (role) => {
    return state.user?.role === role;
  };
  const isOwner = () => hasRole('owner');
  const isEmployee = () => hasRole('employee');
  const value = {
    ...state,
    login,
    logout,
    setLoading,
    setError,
    clearError,
    updateUser,
    hasRole,
    isOwner,
    isEmployee,
  };
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
export default AuthContext;
