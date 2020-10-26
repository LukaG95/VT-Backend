const passport = require('passport');

const SteamStrategy = require('passport-steam').Strategy;
const DiscordStrategy = require('passport-discord').Strategy;

const envURL = (process.env.NODE_ENV === 'production') ? 'https://justlearningfront.website/' : 'http://localhost:3000/';

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

passport.use(new SteamStrategy({
  returnURL: `${envURL}api/auth/steam/return`,
  realm: `${envURL}`,
  apiKey: process.env.STEAM_API_KEY,

},

  (identifier, profile, done) => {
    profile.method = 'steam';
    profile.username = profile.displayName;

    return done(null, profile);
  })
)

passport.use(new DiscordStrategy({
  clientID: process.env.DISCORD_CLIENT_ID,
  clientSecret: process.env.DISCORD_CLIENT_SECRET,
  callbackURL: `${envURL}api/auth/discord/callback`,
  scope: ['identify'],

},
  ((accessToken, refreshToken, profile, cb) => {
    profile.method = 'discord';


    return cb(null, profile);
  })));


module.exports = passport;
