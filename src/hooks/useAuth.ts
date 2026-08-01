import { trpc } from "@/providers/trpc";
import { useCallback, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router";
import { LOGIN_PATH } from "@/const";
import { loginRedirectWithReturnTo } from "@/lib/authRedirect";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = LOGIN_PATH } =
    options ?? {};

  const navigate = useNavigate();
  const location = useLocation();

  const utils = trpc.useUtils();

  const {
    data: user,
    isLoading,
    error,
    refetch,
  } = trpc.auth.me.useQuery(undefined, {
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: async () => {
      await utils.invalidate();
      navigate(redirectPath);
    },
  });

  const logout = useCallback(() => logoutMutation.mutate(), [logoutMutation]);

  useEffect(() => {
    if (redirectOnUnauthenticated && !isLoading && !user) {
      if (location.pathname !== redirectPath) {
        navigate(loginRedirectWithReturnTo(redirectPath, location), {
          replace: true,
        });
      }
    }
  }, [
    redirectOnUnauthenticated,
    isLoading,
    user,
    navigate,
    redirectPath,
    location,
  ]);

  return useMemo(
    () => ({
      user: user ?? null,
      isAuthenticated: !!user,
      isLoading: isLoading || logoutMutation.isPending,
      error,
      logout,
      refresh: refetch,
    }),
    [user, isLoading, logoutMutation.isPending, error, logout, refetch]
  );
}
