import { useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { authApi } from '../api/auth';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';

export const useAuth = () => {
  const { setAuth, logout, setUser, isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();

  const loginMutation = useMutation({
    mutationFn: (credentials: URLSearchParams) => authApi.login(credentials),
    onSuccess: async (data) => {
      // Temporarily set token so getMe works
      useAuthStore.setState({ token: data.access_token });
      try {
        const userData = await authApi.getMe();
        setAuth(userData, data.access_token);
        navigate('/cameras');
      } catch (err) {
        logout();
      }
    },
  });

  const { data: userData, isLoading: isFetchingUser, isError: isUserError, isSuccess: isUserSuccess } = useQuery({
    queryKey: ['me'],
    queryFn: authApi.getMe,
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (isUserSuccess && userData) {
      setUser(userData);
    } else if (isUserError) {
      logout();
      navigate('/login');
    }
  }, [isUserSuccess, userData, isUserError, setUser, logout, navigate]);

  return {
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    error: loginMutation.error,
    user,
    isAuthenticated,
    isFetchingUser,
    logout: () => {
      logout();
      navigate('/login');
    },
  };
};
