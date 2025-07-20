const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });

admin.initializeApp();

exports.createUser = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const { name, email, password, role, photoUrl } = req.body;

      if (!email || !password) {
        return res.status(400).send({ error: 'Missing email or password' });
      }

      const userRecord = await admin.auth().createUser({
        email,
        password,
        displayName: name,
        photoURL: photoUrl || null,
      });

      await admin.firestore().collection('users').doc(userRecord.uid).set({
        name,
        email,
        role: role || 'user',
        photoUrl: photoUrl || '',
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return res.status(200).send({ message: 'User created successfully', uid: userRecord.uid });
    } catch (error) {
      console.error('Error creating user:', error);
      return res.status(500).send({ error: error.message });
    }
  });
});
