import React from "react";
import {
  TLoginDTO,
  TResetPasswordDTO,
  TSignupDTO,
  TUpdateResetPasswordDTO,
  validateLoginResponse,
} from "../dtos/auth";
import validateUserModel, { TUserModel } from "../models/user";
import { useApi } from "./ApiProvider";
import { useLoader } from "./LoaderProvider";
import {confirmDialog, infoDialog} from "../components/Dialog";
import Modal from "../components/Modal/Modal";
import useDebouncedEffect from "../hooks/useDebouncedEffect";
import { useDisconnect, useAccount } from "@particle-network/connectkit";

export type TAuthProvider = {
  error: string | null;
  errors: { [k: string]: string[] };
  errorSignup: { [k: string]: string[] } | string | null;
  errorResetPassword: { [k: string]: string[] } | string | null;
  login: (
    credentials: TLoginDTO,
    abortController?: AbortController | undefined
  ) => Promise<Response>;
  signup: (
    credentials: TSignupDTO,
    abortController?: AbortController | undefined
  ) => Promise<Response>;
  resetPassword: (
    credentials: TResetPasswordDTO,
    abortController?: AbortController | undefined
  ) => Promise<Response>;
  updateResetPassword: (
    credentials: TUpdateResetPasswordDTO,
    abortController?: AbortController | undefined
  ) => Promise<Response>;
  logout: (showConfirm: boolean) => void;
  user: null | TUserModel;
  loginWithGoogle: () => Promise<void>;
  refreshUser: () => void;
  terminateSession: () => void
};

export const AuthContext = React.createContext<TAuthProvider>({
  error: null,
  errors: {},
  errorSignup: null,
  errorResetPassword: null,
  login: () => Promise.resolve<Response>(new Response()),
  signup: () => Promise.resolve<Response>(new Response()),
  resetPassword: () => Promise.resolve<Response>(new Response()),
  updateResetPassword: () => Promise.resolve<Response>(new Response()),
  logout: () => void 0,
  user: null,
  loginWithGoogle: async () => {},
  refreshUser: () => void 0,
  terminateSession: () => void 0
});

export function AuthProvider(props: React.PropsWithChildren) {
  const [user, setUser] = React.useState<TUserModel | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [errors, setErrors] = React.useState<{ [k: string]: string[] }>({});
  const [errorSignup, setErrorSignup] = React.useState<
    { [k: string]: string[] } | string | null
  >(null);
  const [errorResetPassword, setErrorResetPassword] = React.useState<
    { [k: string]: string[] } | string | null
  >(null);
  const [showLogoutConfirm, setShowLogoutConfirm] =
    React.useState<boolean>(false);
  const [initialized, setInitialized] = React.useState<boolean>(false);
  const [latestCheck, setLatestCheck] = React.useState(new Date().getTime());
  const { call } = useApi();
  const { createLoader } = useLoader();
  const [verifyEmailSent, setVerifyEmailSent] = React.useState<boolean>(false);
  const { isConnected: connectedParticle  } = useAccount();
  const { disconnect } = useDisconnect();

  const login = React.useCallback(
    async (
      credentials: TLoginDTO,
      abortController?: AbortController | undefined
    ): Promise<Response> => {
      const closeLoader = createLoader("Authenticating...");
      setErrors({});

      try {
        const f = new FormData();
        f.set("email", credentials.email);
        f.set("password", credentials.password);
        f.set("csrfmiddlewaretoken", credentials.csrfmiddlewaretoken);

        const result = call("login", {
          abortController,
          body: f,
          headers: {
            Accept: "application/json",
          },
        });

        let response = await result.promise;
        const data = await response.json();

        if (data.errors) {
          setErrors(data.errors);
        } else {
          const vr = validateLoginResponse(data);

          if (!vr.isValid) {
            setError(
              "Invalid user data received from the server. Please try again!"
            );
          } else {
            const queries = new URLSearchParams(window.location.search);
            const nextUrl = queries.get("next");

            if (nextUrl) {
              window.location.href = nextUrl;
            }

            setLatestCheck(new Date().getTime());
          }
        }

        closeLoader();
        return response;
      } catch (r2) {
        if (r2 instanceof Error) {
          setError(r2.message);
        }

        closeLoader();
        throw r2;
      }
    },
    [call, createLoader]
  );

  const loginWithGoogle = async () => {
    const oauthUrl = window.APP_SETTINGS.hostname + "redirect/";
    window.location.href = oauthUrl;
  };

  const signup = React.useCallback(
    async (
      credentials: TSignupDTO,
      abortController?: AbortController | undefined
    ): Promise<Response> => {
      const closeLoader = createLoader("Authenticating...");
      setErrorSignup(null);

      try {
        const result = call("signup", {
          abortController,
          body: credentials,
        });

        let response = await result.promise;
        const data = await response.json();

        if (data.validation_errors || data.error) {
          setErrorSignup(data.validation_errors || data.error);
        } else if (response.ok) {
          setLatestCheck(new Date().getTime());
        }

        closeLoader();
        return response;
      } catch (r2) {
        if (r2 instanceof Error) {
          setErrorSignup(r2.message);
        }

        closeLoader();
        throw r2;
      }
    },
    [call, createLoader]
  );

  const resetPassword = React.useCallback(
    async (
      credentials: TResetPasswordDTO,
      abortController?: AbortController | undefined
    ): Promise<Response> => {
      const closeLoader = createLoader("Authenticating...");
      setErrorSignup(null);

      try {
        const result = call("resetPassword", {
          abortController,
          body: credentials,
        });

        let response = await result.promise;
        const data = await response.json();

        if (data.validation_errors || data.error) {
          setErrorSignup(data.validation_errors || data.error);
        } else if (response.ok) {
          setLatestCheck(new Date().getTime());
        }

        closeLoader();
        return response;
      } catch (r2) {
        if (r2 instanceof Error) {
          setErrorSignup(r2.message);
        }

        closeLoader();
        throw r2;
      }
    },
    [call, createLoader]
  );

  const updateResetPassword = React.useCallback(
    async (
      credentials: TUpdateResetPasswordDTO,
      abortController?: AbortController | undefined
    ): Promise<Response> => {
      const closeLoader = createLoader("Updating...");
      setErrorResetPassword(null);

      try {
        const result = call("resetPasswordConfirm", {
          abortController,
          body: {new_password: credentials.password},
          params: {
            uidb64: credentials.uidb64,
            token: credentials.token,
          },
        });

        let response = await result.promise;
        const data = await response.json();

        if (data.validation_errors || data.error) {
          setErrorResetPassword(data.validation_errors || data.error);
        } else if (response.ok) {
          setLatestCheck(new Date().getTime());
        }

        closeLoader();
        return response;
      } catch (r2) {
        if (r2 instanceof Error) {
          setErrorResetPassword(r2.message);
        }

        closeLoader();
        throw r2;
      }
    },
    [call, createLoader]
  );

  const terminateSession = React.useCallback(() => {
    // setUser(null);
    // navigate("/user/login");
    window.location.href = window.APP_SETTINGS.hostname + "logout";
  }, []);

  const logout = React.useCallback(
    (showConfirm: boolean = true) => {
      if (showConfirm) {
        setShowLogoutConfirm(true);
        return;
      }

      terminateSession();
    },
    [terminateSession]
  );

  const refreshUser = React.useCallback(() => {
    setLatestCheck(new Date().getTime());
  }, []);

  React.useEffect(() => {
    if (!showLogoutConfirm) {
      return;
    }

    confirmDialog({
      message: "Are you sure you want to logout?",
      onSubmit() {
        sessionStorage.removeItem('hasReloaded');
        if (connectedParticle) {
          try {
            disconnect();
          } catch (e) {}
        }
        terminateSession();
      },
      onCancel() {
        setShowLogoutConfirm(false);
      },
    });
  }, [showLogoutConfirm, terminateSession, disconnect, connectedParticle]);

  useDebouncedEffect(() => {
    const closeLoader = createLoader("Checking credentials...");
    const abortController = new AbortController();

    call("whoami", { abortController })
      .promise.then(async (r) => {
        if (!(r instanceof Response) || !r.ok) {
          return;
        }

        const data = await r.json();
        const vr = validateUserModel(data);

        if (vr.isValid) {
          setUser(vr.data);
        } else {
          console.error(vr);
        }
      })
      .catch(() => {
        if (abortController.signal.aborted) {
          return;
        }
      })
      .finally(() => {
        closeLoader();

        if (abortController.signal.aborted) {
          return;
        }

        setInitialized(true);
      });

    return () => {
      abortController.abort("Unmounted");
    };
  }, [call, latestCheck, createLoader]);

  const providerValue = React.useMemo(
    () => ({
      error,
      errors,
      errorSignup,
			errorResetPassword,
      login,
      logout,
      signup,
      user,
      loginWithGoogle,
      refreshUser,
      resetPassword,
      updateResetPassword,
      terminateSession
    }),
    [
      error,
      errors,
			errorSignup,
			errorResetPassword,
      login,
      logout,
      signup,
      user,
      refreshUser,
      resetPassword,
      updateResetPassword,
      terminateSession
    ]
  );

  if (!initialized) {
    return null;
  }

  if (user && !user.is_verified) {
    return (
      <Modal
        open={true}
        title="Email verification"
        displayClose={false}
        disableSubmit={verifyEmailSent}
        submitText="Verify"
        onSubmit={() => {
          const ar = call("verifyEmail");

          ar.promise
            .then(r => {
              if (r.ok) {
                setVerifyEmailSent(true);
                return;
              }

              throw new Error();
            })
            .catch(() => {
              infoDialog({
                title: "Error",
                message: "We were unable to send the verification email. Please try again.",
              });
            })
        }}
        cancelText="Logout"
        onCancel={() => {
          terminateSession();
        }}
      >
        {
          verifyEmailSent
            ? "We've just sent you an email to verify your email address. " +
            "Please click on the link in the email to complete your registration. " +
            "If you don't see the email, please check your spam folder."
            : "Your email address is not verified yet."
        }
      </Modal>
    )
  }

  return (
    <>
      <AuthContext.Provider value={providerValue}>
        {props.children}
      </AuthContext.Provider>
    </>
  );
}

export function useAuth(): TAuthProvider {
  return React.useContext(AuthContext);
}
