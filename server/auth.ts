import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as TwitterStrategy } from 'passport-twitter';
import session from 'express-session';
import type { Express, Request, RequestHandler } from 'express';
import { storage } from './storage';
import connectPg from 'connect-pg-simple';
import { randomBytes } from 'node:crypto';
import { generateNonce } from 'siwe';
import {
  authRateLimiter,
  csrfProtection,
  issueCsrfToken,
} from './security';
import {
  parseWalletAuthPayload,
  verifyWalletAuthentication,
} from './services/wallet-auth';

function getSessionSecret(): string {
  const configuredSecret = process.env.SESSION_SECRET;
  if (configuredSecret) {
    return configuredSecret;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET is required in production');
  }

  return randomBytes(32).toString('hex');
}

function getExpectedSiweDomain(req: Request): string {
  const configuredOrigin = process.env.PUBLIC_APP_URL ?? process.env.APP_URL;
  if (configuredOrigin) {
    const origin = new URL(configuredOrigin);
    if (!['http:', 'https:'].includes(origin.protocol)) {
      throw new Error('The configured application URL must use HTTP or HTTPS');
    }
    return origin.host;
  }

  const requestHost = req.get('host');
  if (!requestHost || requestHost.length > 255) {
    throw new Error('Unable to determine the application domain');
  }

  const parsedHost = new URL(`http://${requestHost}`);
  if (parsedHost.host !== requestHost) {
    throw new Error('Invalid application domain');
  }
  return parsedHost.host;
}

function regenerateSession(req: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.regenerate((error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

function logIn(req: Request, user: Express.User): Promise<void> {
  return new Promise((resolve, reject) => {
    req.login(user, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

// Configure session middleware
export function getSessionMiddleware() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });

  return session({
    secret: getSessionSecret(),
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    proxy: process.env.NODE_ENV === 'production',
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: sessionTtl,
    },
  });
}

// Passport configuration
export function configurePassport() {
  // Google OAuth Strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
      state: true,
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await storage.findUserByAccount('google', profile.id);
        
        if (!user) {
          // Create new user
          user = await storage.createUser({
            email: profile.emails?.[0]?.value || null,
            username: profile.displayName || profile.username,
            displayName: profile.displayName,
            profileImage: profile.photos?.[0]?.value || null,
          });

          // Create account link
          await storage.createUserAccount({
            userId: user.id,
            provider: 'google',
            providerAccountId: profile.id,
            accessToken,
            refreshToken,
            metadata: {
              googleProfile: {
                displayName: profile.displayName,
                emails: profile.emails,
                photos: profile.photos
              }
            }
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }));
  }

  // Twitter OAuth Strategy
  if (process.env.TWITTER_CONSUMER_KEY && process.env.TWITTER_CONSUMER_SECRET) {
    passport.use(new TwitterStrategy({
      consumerKey: process.env.TWITTER_CONSUMER_KEY,
      consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
      callbackURL: "/auth/twitter/callback"
    }, async (token, tokenSecret, profile, done) => {
      try {
        let user = await storage.findUserByAccount('twitter', profile.id);
        
        if (!user) {
          // Create new user
          user = await storage.createUser({
            username: profile.username,
            displayName: profile.displayName,
            profileImage: profile.photos?.[0]?.value || null,
          });

          // Create account link
          await storage.createUserAccount({
            userId: user.id,
            provider: 'twitter',
            providerAccountId: profile.id,
            accessToken: token,
            metadata: {
              twitterHandle: profile.username
            }
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }));
  }

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
}

// Authentication middleware
export const requireAuth: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Authentication required' });
};

// Optional authentication middleware (doesn't block if not authenticated)
export const optionalAuth: RequestHandler = (req, res, next) => {
  next();
};

// Setup authentication routes
export function setupAuthRoutes(app: Express) {
  // Initialize session and passport
  app.use(getSessionMiddleware());
  app.use(passport.initialize());
  app.use(passport.session());
  
  configurePassport();
  app.use('/auth', authRateLimiter);

  // Bootstrap the synchronizer token before enforcing it on unsafe requests.
  app.get('/auth/csrf-token', issueCsrfToken);
  app.use(csrfProtection);

  // Google OAuth routes
  app.get('/auth/google', 
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );
  
  app.get('/auth/google/callback', 
    passport.authenticate('google', {
      failureRedirect: '/?error=google_auth_failed',
    }),
    (req, res) => {
      res.redirect('/');
    }
  );

  // Twitter OAuth routes
  app.get('/auth/twitter', 
    passport.authenticate('twitter')
  );
  
  app.get('/auth/twitter/callback', 
    passport.authenticate('twitter', { failureRedirect: '/?error=twitter_auth_failed' }),
    (req, res) => {
      res.redirect('/');
    }
  );

  // Wallet Connect authentication
  app.get('/auth/wallet/nonce', (req, res) => {
    const nonce = generateNonce();
    req.session.walletNonce = nonce;
    res.set('Cache-Control', 'no-store');
    res.json({ nonce });
  });

  app.post('/auth/wallet', async (req, res) => {
    let payload;
    try {
      payload = parseWalletAuthPayload(req.body);
    } catch {
      return res.status(400).json({ error: 'Invalid wallet authentication payload' });
    }

    const expectedNonce = req.session.walletNonce;
    delete req.session.walletNonce;
    if (!expectedNonce) {
      return res.status(400).json({ error: 'Request a new wallet challenge' });
    }

    let address: string;
    try {
      address = await verifyWalletAuthentication(
        payload,
        expectedNonce,
        getExpectedSiweDomain(req),
      );
    } catch {
      return res.status(401).json({ error: 'Wallet authentication failed' });
    }

    try {
      const accountId = address.toLowerCase();
      // Find or create user
      let user = await storage.findUserByAccount('wallet', accountId);
      
      if (!user) {
        // Create new user
        user = await storage.createUser({
          username: `wallet_${address.slice(0, 8)}`,
          displayName: `Wallet User ${address.slice(0, 8)}`,
        });

        // Create account link
        await storage.createUserAccount({
          userId: user.id,
          provider: 'wallet',
          providerAccountId: accountId,
          walletAddress: address,
          metadata: {
            walletType: 'ethereum'
          }
        });
      }

      // Rotate the session identifier before establishing authenticated state.
      await regenerateSession(req);
      await logIn(req, user);
      res.json({ success: true, user });
    } catch {
      console.error('Wallet authentication failed during account setup');
      res.status(500).json({ error: 'Authentication failed' });
    }
  });

  // Logout route
  app.post('/auth/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: 'Logout failed' });
      }
      req.session.destroy((destroyError) => {
        if (destroyError) {
          return res.status(500).json({ error: 'Logout failed' });
        }
        res.clearCookie('connect.sid');
        res.json({ success: true });
      });
    });
  });

  // Get current user
  app.get('/auth/user', (req, res) => {
    if (req.isAuthenticated()) {
      res.json(req.user);
    } else {
      res.status(401).json({ error: 'Not authenticated' });
    }
  });

  // Link additional accounts
  app.post('/auth/link-account', requireAuth, async (req, res) => {
    try {
      const { provider, providerAccountId, accessToken, refreshToken, walletAddress, metadata } = req.body;
      const userId = (req.user as any).id;

      // Check if account is already linked to another user
      const existingAccount = await storage.findUserByAccount(provider, providerAccountId);
      if (existingAccount && existingAccount.id !== userId) {
        return res.status(400).json({ error: 'Account already linked to another user' });
      }

      // Create or update account link
      await storage.createUserAccount({
        userId,
        provider,
        providerAccountId,
        accessToken,
        refreshToken,
        walletAddress,
        metadata
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Account linking error:', error);
      res.status(500).json({ error: 'Failed to link account' });
    }
  });

  // Get user accounts
  app.get('/auth/accounts', requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const accounts = await storage.getUserAccounts(userId);
      res.json(accounts);
    } catch (error) {
      console.error('Error fetching user accounts:', error);
      res.status(500).json({ error: 'Failed to fetch accounts' });
    }
  });
}
