// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Callable – jen přihlášený uživatel (context.auth) a jen sám sebe
exports.revokeUserTokens = functions.https.onCall(async (data, context) => {
  if (!context.auth?.uid) {
    throw new functions.https.HttpsError('unauthenticated', 'Musíte být přihlášen.');
  }
  const { uid } = data || {};
  if (!uid || uid !== context.auth.uid) {
    throw new functions.https.HttpsError('permission-denied', 'Nemáte oprávnění.');
  }

  try {
    await admin.auth().revokeRefreshTokens(uid);
    // Pozn.: klient zůstane přihlášen do expirace stávajícího ID tokenu (~1 hod).
    return { ok: true };
  } catch (e) {
    console.error(e);
    throw new functions.https.HttpsError('internal', 'Revokace se nezdařila.');
  }
});
