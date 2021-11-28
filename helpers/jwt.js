const expressJwt = require("express-jwt");

function authJwt() {
  const secret = process.env.secret;
  return expressJwt({
    secret,
    algorithms: ["HS256"],
    isRevoked: isRevoked, // unauthorizing users to add delete and update products
  }).unless({
    path: [
      { url: /\/public\/uploads(.*)/, methods: ["GET", "OPTIONS"] },
      { url: /\/api\/v1\/products(.*)/, methods: ["GET", "OPTIONS"] },
      { url: /\/api\/v1\/categories(.*)/, methods: ["GET", "OPTIONS"] },
      { url: /\/api\/v1\/orders(.*)/, methods: ["GET", "OPTIONS", "POST"] },
      `${process.env.API_URL}/users/login`,
    ],
  });
}

async function isRevoked(req, payload, done) {
  if (!payload.isAdmin) done(null, true);

  done();
}

module.exports = authJwt;
