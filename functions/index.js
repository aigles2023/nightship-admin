// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });

admin.initializeApp();

// ===============================
// Création d'un compte Admin (par Ops)
// ===============================
exports.createAdminUser = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const { name, email, role, createdBy } = req.body;

      if (!email || !role) {
        return res.status(400).send({ error: 'Missing email or role' });
      }

      // 🔹 Mot de passe temporaire aléatoire
      const tempPassword = Math.random().toString(36).slice(-8) + "A1"; // 8 chars + maj + chiffre

      // 🔹 Créer utilisateur dans Firebase Auth
      const userRecord = await admin.auth().createUser({
        email,
        displayName: name || '',
        password: tempPassword,
      });

      // 🔹 Ajouter le rôle et flag "mustChangePassword"
      await admin.firestore().collection('admins').doc(userRecord.uid).set({
        name: name || '',
        email,
        role,
        mustChangePassword: true,
        createdBy: createdBy || 'ops',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 🔹 (Optionnel) ajouter aussi dans Auth custom claims
      await admin.auth().setCustomUserClaims(userRecord.uid, { role });

      return res.status(200).send({
        message: 'Admin created successfully',
        uid: userRecord.uid,
        tempPassword,
      });
    } catch (error) {
      console.error('Error creating admin:', error);
      return res.status(500).send({ error: error.message });
    }
  });
});
