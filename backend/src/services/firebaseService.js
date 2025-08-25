const admin = require('firebase-admin');
let db;
const initializeFirebase = () => {
  try {
    const serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: process.env.FIREBASE_AUTH_URI,
      token_uri: process.env.FIREBASE_TOKEN_URI,
      auth_provider_x509_cert_url: `https:
      client_x509_cert_url: `https:
    };
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID
    });
    db = admin.firestore();
    console.log('✅ Firebase initialized successfully');
    return db;
  } catch (error) {
    console.error('❌ Firebase initialization error:', error);
    throw error;
  }
};
const getFirestore = () => {
  if (!db) {
    throw new Error('Firebase not initialized. Call initializeFirebase() first.');
  }
  return db;
};
const Collections = {
  OWNERS: 'owners',
  EMPLOYEES: 'employees',
  TASKS: 'tasks',
  MESSAGES: 'messages',
  EMPLOYEE_CREDENTIALS: 'employee_credentials'
};
const dbHelpers = {
  async create(collection, data) {
    const docRef = db.collection(collection).doc();
    const docData = {
      id: docRef.id,
      ...data,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    await docRef.set(docData);
    return { id: docRef.id, ...data };
  },
  async findById(collection, id) {
    const doc = await db.collection(collection).doc(id).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  },
  async findOne(collection, field, value) {
    const snapshot = await db.collection(collection).where(field, '==', value).limit(1).get();
    return snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
  },
  async findMany(collection, filters = []) {
    let query = db.collection(collection);
    filters.forEach(filter => {
      query = query.where(filter.field, filter.operator, filter.value);
    });
    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
  async update(collection, id, data) {
    await db.collection(collection).doc(id).update({
      ...data,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return await this.findById(collection, id);
  },
  async delete(collection, id) {
    await db.collection(collection).doc(id).delete();
    return true;
  },
  async createOwner(phoneNumber) {
    return await this.create(Collections.OWNERS, { phoneNumber });
  },
  async findOwnerByPhone(phoneNumber) {
    return await this.findOne(Collections.OWNERS, 'phoneNumber', phoneNumber);
  },
  async updateOwnerAccessCode(phoneNumber, accessCode) {
    const owner = await this.findOwnerByPhone(phoneNumber);
    if (owner) {
      return await this.update(Collections.OWNERS, owner.id, { accessCode });
    }
    return null;
  },
  async createEmployee(employeeData) {
    return await this.create(Collections.EMPLOYEES, {
      ...employeeData,
      isActive: true
    });
  },
  async findEmployeeByEmail(email) {
    return await this.findOne(Collections.EMPLOYEES, 'email', email);
  },
  async findEmployeeById(id) {
    return await this.findById(Collections.EMPLOYEES, id);
  },
  async getAllEmployees() {
    return await this.findMany(Collections.EMPLOYEES, [
      { field: 'isActive', operator: '==', value: true }
    ]);
  },
  async updateEmployee(id, data) {
    return await this.update(Collections.EMPLOYEES, id, data);
  },
  async deactivateEmployee(id) {
    return await this.update(Collections.EMPLOYEES, id, { isActive: false });
  },
  async createEmployeeCredentials(employeeId, credentials) {
    return await this.create(Collections.EMPLOYEE_CREDENTIALS, {
      employeeId,
      ...credentials
    });
  },
  async findCredentialsByEmployeeId(employeeId) {
    return await this.findOne(Collections.EMPLOYEE_CREDENTIALS, 'employeeId', employeeId);
  },
  async findCredentialsByUsername(username) {
    return await this.findOne(Collections.EMPLOYEE_CREDENTIALS, 'username', username);
  },
  async createTask(taskData) {
    return await this.create(Collections.TASKS, {
      ...taskData,
      status: taskData.status || 'pending'
    });
  },
  async findTaskById(id) {
    return await this.findById(Collections.TASKS, id);
  },
  async findTasksByEmployee(employeeId) {
    return await this.findMany(Collections.TASKS, [
      { field: 'assignedTo', operator: '==', value: employeeId }
    ]);
  },
  async findTasksByOwner(ownerId) {
    return await this.findMany(Collections.TASKS, [
      { field: 'createdBy', operator: '==', value: ownerId }
    ]);
  },
  async getAllTasks() {
    return await this.findMany(Collections.TASKS);
  },
  async updateTask(id, data) {
    return await this.update(Collections.TASKS, id, data);
  },
  async deleteTask(id) {
    return await this.delete(Collections.TASKS, id);
  },
  async createMessage(messageData) {
    return await this.create(Collections.MESSAGES, messageData);
  },
  async findMessagesBetweenUsers(user1, user2, limit = 50) {
    const snapshot = await db.collection(Collections.MESSAGES)
      .where('participants', 'array-contains-any', [user1, user2])
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(msg => 
        (msg.from === user1 && msg.to === user2) || 
        (msg.from === user2 && msg.to === user1)
      )
      .reverse();
  }
};
module.exports = {
  initializeFirebase,
  getFirestore,
  Collections,
  dbHelpers,
  admin
};
