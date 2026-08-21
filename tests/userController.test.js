import { jest } from "@jest/globals";


// =====================================================
// MOCK bcryptjs
// =====================================================

const bcryptMock = {
  hash: jest.fn(),
  compare: jest.fn()
};

jest.unstable_mockModule(
  "bcryptjs",
  () => ({
    default: bcryptMock
  })
);


// =====================================================
// MOCK AWS
// =====================================================

const dbMock = {
  send: jest.fn()
};

const TABLES_MOCK = {
  USERS: "Users"
};

jest.unstable_mockModule(
  "../config/aws.js",
  () => ({
    db: dbMock,
    TABLES: TABLES_MOCK
  })
);


// =====================================================
// MOCK HELPERS
// =====================================================

const generateIdMock = jest.fn();

jest.unstable_mockModule(
  "../utils/helpers.js",
  () => ({
    generateId: generateIdMock
  })
);


// =====================================================
// MOCK JWT
// =====================================================

const generateTokenMock = jest.fn();

jest.unstable_mockModule(
  "../utils/jwt.js",
  () => ({
    generateToken: generateTokenMock
  })
);


// =====================================================
// IMPORT CONTROLLER AFTER MOCKS
// =====================================================

const {
  register,
  login,
  getMe
} = await import(
  "../controllers/authController.js"
);


// =====================================================
// HELPERS
// =====================================================

const createResponse = () => {

  const res = {};

  res.status = jest.fn().mockReturnValue(res);

  res.json = jest.fn().mockReturnValue(res);

  return res;
};


// =====================================================
// RESET BEFORE EACH TEST
// =====================================================

beforeEach(() => {

  jest.clearAllMocks();

});


// =====================================================
// REGISTER TESTS
// =====================================================
describe("User Controller", () => {
  test("basic test", () => {
    expect(1 + 1).toBe(2);
  });
});
describe("register", () => {


  // ---------------------------------------------------
  // 1. Missing fields
  // ---------------------------------------------------

  test("should return 400 when required fields are missing", async () => {

    const req = {
      body: {
        name: "",
        email: "",
        password: ""
      }
    };

    const res = createResponse();


    await register(req, res);


    expect(res.status).toHaveBeenCalledWith(400);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Name, email and password are required"
    });

    expect(dbMock.send).not.toHaveBeenCalled();

  });


  // ---------------------------------------------------
  // 2. Existing email
  // ---------------------------------------------------

  test("should return 409 when email already exists", async () => {

    const req = {
      body: {
        name: "Kushal",
        email: "kushal@gmail.com",
        password: "123456",
        role: "USER"
      }
    };

    const res = createResponse();


    dbMock.send.mockResolvedValueOnce({
      Items: [
        {
          id: "USER001",
          email: "kushal@gmail.com"
        }
      ]
    });


    await register(req, res);


    expect(res.status).toHaveBeenCalledWith(409);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Email already registered"
    });

  });


  // ---------------------------------------------------
  // 3. Successful registration
  // ---------------------------------------------------

  test("should register user successfully", async () => {

    const req = {
      body: {
        name: "Kushal",
        email: "kushal@gmail.com",
        password: "123456",
        role: "USER"
      }
    };

    const res = createResponse();


    // ScanCommand result
    dbMock.send.mockResolvedValueOnce({
      Items: []
    });


    generateIdMock.mockReturnValue(
      "USER001"
    );


    bcryptMock.hash.mockResolvedValue(
      "hashed-password"
    );


    generateTokenMock.mockReturnValue(
      "jwt-token"
    );


    // PutCommand
    dbMock.send.mockResolvedValueOnce({});


    await register(req, res);


    // Check status

    expect(res.status).toHaveBeenCalledWith(201);


    // Check response

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({

        success: true,

        message:
          "User registered successfully",

        token: "jwt-token"

      })
    );


    // Password hashing

    expect(
      bcryptMock.hash
    ).toHaveBeenCalledWith(
      "123456",
      10
    );


    // ID generation

    expect(
      generateIdMock
    ).toHaveBeenCalledWith(
      "USER"
    );


    // JWT

    expect(
      generateTokenMock
    ).toHaveBeenCalled();


    // DynamoDB called twice:
    // 1. Scan
    // 2. Put

    expect(
      dbMock.send
    ).toHaveBeenCalledTimes(2);

  });


  // ---------------------------------------------------
  // 4. DynamoDB error
  // ---------------------------------------------------

  test("should return 500 when DynamoDB fails", async () => {

    const req = {
      body: {
        name: "Kushal",
        email: "kushal@gmail.com",
        password: "123456"
      }
    };

    const res = createResponse();


    dbMock.send.mockRejectedValue(
      new Error("DynamoDB error")
    );


    await register(req, res);


    expect(res.status).toHaveBeenCalledWith(500);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Failed to create user",
      error: "DynamoDB error"
    });

  });

});


// =====================================================
// LOGIN TESTS
// =====================================================

describe("login", () => {


  // ---------------------------------------------------
  // 1. Missing fields
  // ---------------------------------------------------

  test("should return 400 when email or password is missing", async () => {

    const req = {
      body: {
        email: "",
        password: ""
      }
    };

    const res = createResponse();


    await login(req, res);


    expect(res.status).toHaveBeenCalledWith(400);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Email and password are required"
    });

  });


  // ---------------------------------------------------
  // 2. User not found
  // ---------------------------------------------------

  test("should return 401 when user does not exist", async () => {

    const req = {
      body: {
        email: "unknown@gmail.com",
        password: "123456"
      }
    };

    const res = createResponse();


    dbMock.send.mockResolvedValueOnce({
      Items: []
    });


    await login(req, res);


    expect(res.status).toHaveBeenCalledWith(401);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Invalid email or password"
    });

  });


  // ---------------------------------------------------
  // 3. Wrong password
  // ---------------------------------------------------

  test("should return 401 when password is incorrect", async () => {

    const req = {
      body: {
        email: "kushal@gmail.com",
        password: "wrong-password"
      }
    };

    const res = createResponse();


    dbMock.send.mockResolvedValueOnce({

      Items: [
        {
          id: "USER001",
          name: "Kushal",
          email: "kushal@gmail.com",
          password: "hashed-password",
          role: "USER"
        }
      ]

    });


    bcryptMock.compare.mockResolvedValue(
      false
    );


    await login(req, res);


    expect(
      bcryptMock.compare
    ).toHaveBeenCalledWith(
      "wrong-password",
      "hashed-password"
    );


    expect(res.status).toHaveBeenCalledWith(401);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Invalid email or password"
    });

  });


  // ---------------------------------------------------
  // 4. Successful login
  // ---------------------------------------------------

  test("should login successfully", async () => {

    const req = {
      body: {
        email: "kushal@gmail.com",
        password: "123456"
      }
    };

    const res = createResponse();


    dbMock.send.mockResolvedValueOnce({

      Items: [
        {
          id: "USER001",
          name: "Kushal",
          email: "kushal@gmail.com",
          password: "hashed-password",
          role: "USER"
        }
      ]

    });


    bcryptMock.compare.mockResolvedValue(
      true
    );


    generateTokenMock.mockReturnValue(
      "jwt-token"
    );


    await login(req, res);


    expect(
      bcryptMock.compare
    ).toHaveBeenCalledWith(
      "123456",
      "hashed-password"
    );


    expect(
      generateTokenMock
    ).toHaveBeenCalled();


    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({

        success: true,

        message:
          "Login successful",

        token: "jwt-token"

      })
    );

  });


  // ---------------------------------------------------
  // 5. DynamoDB error
  // ---------------------------------------------------

  test("should return 500 when login DynamoDB fails", async () => {

    const req = {
      body: {
        email: "kushal@gmail.com",
        password: "123456"
      }
    };

    const res = createResponse();


    dbMock.send.mockRejectedValue(
      new Error("DynamoDB error")
    );


    await login(req, res);


    expect(res.status).toHaveBeenCalledWith(500);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Login failed",
      error: "DynamoDB error"
    });

  });

});


// =====================================================
// GET ME TESTS
// =====================================================

describe("getMe", () => {


  // ---------------------------------------------------
  // 1. User not found
  // ---------------------------------------------------

  test("should return 404 when user is not found", async () => {

    const req = {
      user: {
        id: "USER001"
      }
    };

    const res = createResponse();


    dbMock.send.mockResolvedValueOnce({
      Item: undefined
    });


    await getMe(req, res);


    expect(res.status).toHaveBeenCalledWith(404);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "User not found"
    });

  });


  // ---------------------------------------------------
  // 2. Successful getMe
  // ---------------------------------------------------

  test("should return current user without password", async () => {

    const req = {
      user: {
        id: "USER001"
      }
    };

    const res = createResponse();


    dbMock.send.mockResolvedValueOnce({

      Item: {
        id: "USER001",
        name: "Kushal",
        email: "kushal@gmail.com",
        password: "hashed-password",
        role: "USER"
      }

    });


    await getMe(req, res);


    expect(res.json).toHaveBeenCalledWith({

      success: true,

      user: {
        id: "USER001",
        name: "Kushal",
        email: "kushal@gmail.com",
        role: "USER"
      }

    });

  });


  // ---------------------------------------------------
  // 3. DynamoDB error
  // ---------------------------------------------------

  test("should return 500 when getMe DynamoDB fails", async () => {

    const req = {
      user: {
        id: "USER001"
      }
    };

    const res = createResponse();


    dbMock.send.mockRejectedValue(
      new Error("DynamoDB error")
    );


    await getMe(req, res);


    expect(res.status).toHaveBeenCalledWith(500);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Failed to get user",
      error: "DynamoDB error"
    });

  });

});