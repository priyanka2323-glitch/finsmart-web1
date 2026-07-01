import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function decodeJwtExpiry(token) {
  if (!token) return null;
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

async function refreshDjangoAccessToken(token) {
  if (!token?.refreshToken) return token;

  try {
    const res = await fetch(`${BASE_URL}/auth/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: token.refreshToken }),
    });

    if (!res.ok) throw new Error('Failed to refresh access token');

    const data = await res.json();
    return {
      ...token,
      accessToken: data.access,
      accessTokenExpires: decodeJwtExpiry(data.access) || Date.now() + 55 * 60 * 1000,
      error: undefined,
    };
  } catch (error) {
    console.error('Django access token refresh failed:', error);
    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }
}

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          const res = await fetch(`${BASE_URL}/auth/login/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: credentials.username,
              password: credentials.password,
            }),
          });

          if (!res.ok) return null;

          const data = await res.json();
          return {
            id: data.user.id,
            name: data.user.username,
            email: data.user.email,
            accessToken: data.tokens.access,
            refreshToken: data.tokens.refresh,
          };
        } catch {
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, account }) {
      // On first sign-in
      if (user) {
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.username = user.name;
        token.accessTokenExpires = decodeJwtExpiry(user.accessToken);
      }
      // Google sign-in — exchange Google access_token for Django JWT
      if (account?.provider === 'google' && account?.access_token) {
        try {
          const res = await fetch(`${BASE_URL}/auth/google/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ access_token: account.access_token }),
          });
          if (res.ok) {
            const data = await res.json();
            token.accessToken  = data.tokens.access;
            token.refreshToken = data.tokens.refresh;
            token.username     = data.user.username;
            token.accessTokenExpires = decodeJwtExpiry(data.tokens.access);
          }
        } catch (e) {
          console.error('Google token exchange failed:', e);
        }
      }

      if (token.accessTokenExpires && Date.now() < token.accessTokenExpires - 60_000) {
        return token;
      }

      if (token.refreshToken) {
        return refreshDjangoAccessToken(token);
      }

      return token;
    },

    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.refreshToken = token.refreshToken;
      session.user.username = token.username || session.user.name;
      session.error = token.error;
      return session;
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  session: {
    strategy: 'jwt',
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
