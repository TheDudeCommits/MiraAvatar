import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as TwitterStrategy } from 'passport-twitter';
import session from 'express-session';
import type { Express, RequestHandler } from 'express';
import { storage } from './storage';
import { verifyMessage } from 'ethers';
import connectPg from 'connect-pg-simple';

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
    secret: process.env.SESSION_SECRET || 'dev-secret-mira-chat-session-2025',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Set to false for development
      maxAge: sessionTtl,
    },
  });
}

// Passport configuration
export function configurePassport() {
  // Google OAuth Strategy - set default values for development
  const googleClientId = process.env.GOOGLE_CLIENT_ID || 'dev-google-client-id';
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || 'dev-google-client-secret';
  
  if (googleClientId && googleClientSecret) {
    passport.use(new GoogleStrategy({
      clientID: googleClientId,
      clientSecret: googleClientSecret,
      callbackURL: "/auth/google/callback"
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

  // Google OAuth routes
  app.get('/auth/google', 
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );
  
  app.get('/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: '/?error=google_auth_failed' }),
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
  app.post('/auth/wallet', async (req, res) => {
    try {
      const { message, signature, address } = req.body;
      
      if (!message || !signature || !address) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Verify the signature
      const recoveredAddress = verifyMessage(message, signature);
      if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
        return res.status(400).json({ error: 'Invalid signature' });
      }

      // Find or create user
      let user = await storage.findUserByAccount('wallet', address);
      
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
          providerAccountId: address,
          walletAddress: address,
          metadata: {
            walletType: 'ethereum'
          }
        });
      }

      // Log the user in
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ error: 'Login failed' });
        }
        res.json({ success: true, user });
      });

    } catch (error) {
      console.error('Wallet authentication error:', error);
      res.status(500).json({ error: 'Authentication failed' });
    }
  });

  // Logout route
  app.post('/auth/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: 'Logout failed' });
      }
      res.json({ success: true });
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