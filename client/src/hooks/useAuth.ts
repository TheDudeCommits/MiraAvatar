import { useQuery } from "@tanstack/react-query";

interface UserData {
  id: number;
  email?: string;
  username?: string;
  displayName?: string;
  profileImage?: string;
}

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<UserData>({
    queryKey: ["/auth/user"],
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error
  };
}