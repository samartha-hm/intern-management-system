import React, { createContext, useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectCurrentUser,
  selectIsAuthenticated,
  selectAuthLoading,
  selectAuthError,
  selectAuthToken,
  login,
  logout,
  fetchCurrentUser,
} from '../redux/slices/authSlice';
import type { AppDispatch } from '../redux/store';

interface AuthContextType {
  currentUser: any;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useDispatch<AppDispatch>();
  const currentUser = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);
  const token = useSelector(selectAuthToken);

  const loginUser = async (email: string, password: string) => {
    await dispatch(login({ email, password })).unwrap();
  };

  const logoutUser = async () => {
    await dispatch(logout()).unwrap();
  };

  // Validate persisted token on mount
  useEffect(() => {
    if (token && !currentUser) {
      // We have a persisted token but no user data — validate it
      dispatch(fetchCurrentUser());
    }
  }, [dispatch, token, currentUser]);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        loading,
        error,
        login: loginUser,
        logout: logoutUser,
      }}
    >
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