import type { AuthProvider } from "@refinedev/core";
import { API_URL, dataProvider } from "./data";

export const authCredentials = {
  email: "michael.scott@dundermifflin.com",
  password: "demodemo",
};

export const authProvider: AuthProvider = {
  // 1. Login logic
  login: async ({ email }) => {
    try {
      const { data } = await dataProvider.custom({
        url: API_URL,
        method: "post",
        headers: {},
        meta: {
          variables: { email },
          rawQuery: `
                mutation Login($email: String!) {
                    login(loginInput: { email: $email }) {
                      accessToken
                    }
                }
          `,
        },
      });

      if (data?.login?.accessToken) {
        localStorage.setItem("access_token", data.login.accessToken);
        return {
          success: true,
          redirectTo: "/",
        };
      } else {
        return {
          success: false,
          error: {
            message: "Login failed: No access token returned",
            name: "LoginError",
          },
        };
      }
    } catch (e) {
      const error = e as Error;
      return {
        success: false,
        error: {
          message: error.message || "Login failed",
          name: error.name || "LoginError",
        },
      };
    }
  },

  // 2. Logout logic
  logout: async () => {
    localStorage.removeItem("access_token");
    return {
      success: true,
      redirectTo: "/login",
    };
  },

  // 3. Authentication check logic
  check: async () => {
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
      return {
        authenticated: false,
        redirectTo: "/login",
      };
    }

    try {
      await dataProvider.custom({
        url: API_URL,
        method: "post",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        meta: {
          rawQuery: `
                query Me {
                    me {
                      name
                    }
                }
          `,
        },
      });

      return {
        authenticated: true,
        redirectTo: "/",
      };
    } catch (error) {
      return {
        authenticated: false,
        redirectTo: "/login",
      };
    }
  },

  // 4. Get identity logic
  getIdentity: async () => {
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
      return undefined;
    }

    try {
      const { data } = await dataProvider.custom({
        url: API_URL,
        method: "post",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        meta: {
          rawQuery: `
                query Me {
                    me {
                        id,
                        name,
                        email,
                        phone,
                        jobTitle,
                        timezone,
                        avatarUrl
                    }
                }
          `,
        },
      });

      return data?.me || undefined;
    } catch (error) {
      return undefined;
    }
  },

  // 5. Error handling
  onError: async (error) => {
    if (error.statusCode === "UNAUTHENTICATED") {
      return { logout: true };
    }
    return { error };
  },
};
