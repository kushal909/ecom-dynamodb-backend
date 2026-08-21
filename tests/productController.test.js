import { jest } from "@jest/globals";


// =====================================================
// MOCK DYNAMODB
// =====================================================

const dbMock = {
  send: jest.fn()
};


// =====================================================
// MOCK S3
// =====================================================

const s3Mock = {
  send: jest.fn()
};


// =====================================================
// MOCK TABLES
// =====================================================

const TABLES_MOCK = {
  PRODUCTS: "Products",
  COMMENTS: "Comments",
  REVIEWS: "Reviews",
  INVENTORY: "Inventory"
};


// =====================================================
// MOCK AWS CONFIG
// =====================================================

jest.unstable_mockModule(
  "../config/aws.js",
  () => ({
    db: dbMock,
    TABLES: TABLES_MOCK
  })
);


// =====================================================
// MOCK S3 CONFIG
// =====================================================

jest.unstable_mockModule(
  "../config/s3.js",
  () => ({
    s3: s3Mock
  })
);


// =====================================================
// MOCK generateId
// =====================================================

const generateIdMock = jest.fn();

jest.unstable_mockModule(
  "../utils/helpers.js",
  () => ({
    generateId: generateIdMock
  })
);


// =====================================================
// MOCK uploadToS3
// =====================================================

const uploadToS3Mock = jest.fn();

jest.unstable_mockModule(
  "../utils/uploadToS3.js",
  () => ({
    uploadToS3: uploadToS3Mock
  })
);


// =====================================================
// IMPORT CONTROLLER AFTER MOCKS
// =====================================================

const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct
} = await import(
  "../controllers/productController.js"
);


// =====================================================
// MOCK EXPRESS RESPONSE
// =====================================================

const createResponse = () => {

  const res = {};

  res.status = jest.fn().mockReturnValue(res);

  res.json = jest.fn().mockReturnValue(res);

  return res;
};


// =====================================================
// RESET MOCKS
// =====================================================

beforeEach(() => {

//   jest.clearAllMocks();
jest.resetAllMocks();

});


// =====================================================
// CREATE PRODUCT
// =====================================================

describe("createProduct", () => {


  // ---------------------------------------------------
  // 1. Missing fields
  // ---------------------------------------------------

  test("should return 400 when required fields are missing", async () => {

    const req = {

      body: {
        name: "",
        price: undefined,
        stock: undefined
      },

      files: []

    };

    const res = createResponse();


    await createProduct(req, res);


    expect(res.status)
      .toHaveBeenCalledWith(400);


    expect(res.json)
      .toHaveBeenCalledWith({

        success: false,

        message:
          "Name, price and stock are required"

      });


    expect(dbMock.send)
      .not
      .toHaveBeenCalled();

  });


  // ---------------------------------------------------
  // 2. Successful creation
  // ---------------------------------------------------

  test("should create product successfully", async () => {

    const req = {

      body: {

        name: "iPhone 17",

        description: "Apple phone",

        price: "79999",

        categoryId: "CAT001",

        brand: "Apple",

        stock: "10",

        discount: "5"

      },

      files: []

    };


    const res = createResponse();


    // generateId()

    generateIdMock
      .mockReturnValue("PROD001");


    // DynamoDB PutCommand

    dbMock
      .send
      .mockResolvedValueOnce({});


    await createProduct(req, res);


    // Check generateId

    expect(generateIdMock)
      .toHaveBeenCalledWith("PROD");


    // Check DynamoDB

    expect(dbMock.send)
      .toHaveBeenCalledTimes(1);


    // Check response status

    expect(res.status)
      .toHaveBeenCalledWith(201);


    // Check response

    expect(res.json)
      .toHaveBeenCalledWith(

        expect.objectContaining({

          success: true,

          message:
            "Product created successfully",

          product:
            expect.objectContaining({

              productId: "PROD001",

              name: "iPhone 17",

              price: 79999,

              stock: 10,

              discount: 5,

              images: [],

              likeCount: 0,

              commentCount: 0,

              rating: 0,

              reviewCount: 0,

              isActive: true

            })

        })

      );

  });


  // ---------------------------------------------------
  // 3. Create with images
  // ---------------------------------------------------

  test("should upload images and create product", async () => {

    const file1 = {

      originalname: "phone1.jpg"

    };


    const file2 = {

      originalname: "phone2.jpg"

    };


    const req = {

      body: {

        name: "iPhone 17",

        price: "79999",

        stock: "10"

      },

      files: [

        file1,

        file2

      ]

    };


    const res = createResponse();


    generateIdMock
      .mockReturnValue("PROD001");


    uploadToS3Mock

      .mockResolvedValueOnce({

        key: "products/PROD001/phone1.jpg",

        url: "https://example.com/phone1.jpg"

      })

      .mockResolvedValueOnce({

        key: "products/PROD001/phone2.jpg",

        url: "https://example.com/phone2.jpg"

      });


    dbMock
      .send
      .mockResolvedValueOnce({});


    await createProduct(req, res);


    expect(uploadToS3Mock)
      .toHaveBeenCalledTimes(2);


    expect(uploadToS3Mock)
      .toHaveBeenNthCalledWith(

        1,

        file1,

        "PROD001"

      );


    expect(uploadToS3Mock)
      .toHaveBeenNthCalledWith(

        2,

        file2,

        "PROD001"

      );


    expect(dbMock.send)
      .toHaveBeenCalledTimes(1);


    expect(res.status)
      .toHaveBeenCalledWith(201);

  });


  // ---------------------------------------------------
  // 4. DynamoDB error
  // ---------------------------------------------------

  test("should return 500 when DynamoDB fails", async () => {

    const req = {

      body: {

        name: "iPhone",

        price: 79999,

        stock: 10

      },

      files: []

    };


    const res = createResponse();


    generateIdMock
      .mockReturnValue("PROD001");


    dbMock
      .send
      .mockRejectedValue(
        new Error("DynamoDB error")
      );


    await createProduct(req, res);


    expect(res.status)
      .toHaveBeenCalledWith(500);


    expect(res.json)
      .toHaveBeenCalledWith({

        success: false,

        message:
          "Failed to create product",

        error:
          "DynamoDB error"

      });

  });

});


// =====================================================
// GET PRODUCTS
// =====================================================

describe("getProducts", () => {


  // ---------------------------------------------------
  // 1. Get all products
  // ---------------------------------------------------

  test("should return all products", async () => {

    const req = {

      query: {}

    };


    const res = createResponse();


    dbMock
      .send
      .mockResolvedValueOnce({

        Items: [

          {
            productId: "PROD001",
            name: "iPhone"
          },

          {
            productId: "PROD002",
            name: "Samsung"
          }

        ]

      });


    await getProducts(req, res);


    expect(dbMock.send)
      .toHaveBeenCalledTimes(1);


    expect(res.json)
      .toHaveBeenCalledWith({

        success: true,

        count: 2,

        products: [

          {
            productId: "PROD001",
            name: "iPhone"
          },

          {
            productId: "PROD002",
            name: "Samsung"
          }

        ]

      });

  });


  // ---------------------------------------------------
  // 2. Search
  // ---------------------------------------------------

  test("should search products by name", async () => {

    const req = {

      query: {

        search: "iphone"

      }

    };


    const res = createResponse();


    dbMock
      .send
      .mockResolvedValueOnce({

        Items: [

          {
            productId: "PROD001",
            name: "iPhone 17"
          },

          {
            productId: "PROD002",
            name: "Samsung S26"
          }

        ]

      });


    await getProducts(req, res);


    expect(res.json)
      .toHaveBeenCalledWith({

        success: true,

        count: 1,

        products: [

          {
            productId: "PROD001",
            name: "iPhone 17"
          }

        ]

      });

  });


  // ---------------------------------------------------
  // 3. Category filter
  // ---------------------------------------------------

  test("should filter products by category", async () => {

    const req = {

      query: {

        categoryId: "CAT001"

      }

    };


    const res = createResponse();


    dbMock
      .send
      .mockResolvedValueOnce({

        Items: [

          {
            productId: "PROD001",
            name: "iPhone",
            categoryId: "CAT001"
          },

          {
            productId: "PROD002",
            name: "TV",
            categoryId: "CAT002"
          }

        ]

      });


    await getProducts(req, res);


    expect(res.json)
      .toHaveBeenCalledWith({

        success: true,

        count: 1,

        products: [

          {
            productId: "PROD001",
            name: "iPhone",
            categoryId: "CAT001"
          }

        ]

      });

  });


  // ---------------------------------------------------
  // 4. DynamoDB error
  // ---------------------------------------------------

  test("should return 500 when getting products fails", async () => {

    const req = {

      query: {}

    };


    const res = createResponse();


    dbMock
      .send
      .mockRejectedValue(
        new Error("DynamoDB error")
      );


    await getProducts(req, res);


    expect(res.status)
      .toHaveBeenCalledWith(500);


    expect(res.json)
      .toHaveBeenCalledWith({

        success: false,

        message:
          "Failed to get products",

        error:
          "DynamoDB error"

      });

  });

});


// =====================================================
// GET PRODUCT BY ID
// =====================================================

describe("getProductById", () => {


  // ---------------------------------------------------
  // 1. Product not found
  // ---------------------------------------------------

  test("should return 404 when product does not exist", async () => {

    const req = {

      params: {

        id: "PROD001"

      }

    };


    const res = createResponse();


    dbMock
      .send
      .mockResolvedValueOnce({

        Item: undefined

      });


    await getProductById(req, res);


    expect(res.status)
      .toHaveBeenCalledWith(404);


    expect(res.json)
      .toHaveBeenCalledWith({

        success: false,

        message:
          "Product not found"

      });


    expect(dbMock.send)
      .toHaveBeenCalledTimes(1);

  });


  // ---------------------------------------------------
  // 2. Complete product details
  // ---------------------------------------------------

  test("should return complete product details", async () => {

    const req = {

      params: {

        id: "PROD001"

      }

    };


    const res = createResponse();


    // 1. Product

    dbMock
      .send
      .mockResolvedValueOnce({

        Item: {

          productId: "PROD001",

          name: "iPhone 17",

          price: 79999

        }

      });


    // 2. Comments

    dbMock
      .send
      .mockResolvedValueOnce({

        Items: [

          {

            commentId: "COM001",

            comment: "Good phone"

          }

        ]

      });


    // 3. Reviews

    dbMock
      .send
      .mockResolvedValueOnce({

        Items: [

          {

            reviewId: "REV001",

            rating: 5

          }

        ]

      });


    // 4. Inventory

    dbMock
      .send
      .mockResolvedValueOnce({

        Item: {

          productId: "PROD001",

          stock: 10

        }

      });


    await getProductById(req, res);


    expect(dbMock.send)
      .toHaveBeenCalledTimes(4);


    expect(res.status)
      .toHaveBeenCalledWith(200);


    expect(res.json)
      .toHaveBeenCalledWith({

        success: true,

        product: {

          productId: "PROD001",

          name: "iPhone 17",

          price: 79999,

          comments: [

            {

              commentId: "COM001",

              comment: "Good phone"

            }

          ],

          reviews: [

            {

              reviewId: "REV001",

              rating: 5

            }

          ],

          inventory: {

            productId: "PROD001",

            stock: 10

          }

        }

      });

  });


  // ---------------------------------------------------
  // 3. DynamoDB error
  // ---------------------------------------------------

  test("should return 500 when getting product details fails", async () => {

    const req = {

      params: {

        id: "PROD001"

      }

    };


    const res = createResponse();


    dbMock
      .send
      .mockRejectedValue(
        new Error("DynamoDB error")
      );


    await getProductById(req, res);


    expect(res.status)
      .toHaveBeenCalledWith(500);


    expect(res.json)
      .toHaveBeenCalledWith({

        success: false,

        message:
          "Failed to get product details",

        error:
          "DynamoDB error"

      });

  });

});


// =====================================================
// UPDATE PRODUCT
// =====================================================

describe("updateProduct", () => {


  // ---------------------------------------------------
  // 1. Missing fields
  // ---------------------------------------------------

  test("should return 400 when required fields are missing", async () => {

    const req = {

      params: {

        id: "PROD001"

      },

      body: {

        name: "",

        price: undefined,

        stock: undefined

      },

      files: []

    };


    const res = createResponse();


    await updateProduct(req, res);


    expect(res.status)
      .toHaveBeenCalledWith(400);


    expect(res.json)
      .toHaveBeenCalledWith({

        success: false,

        message:
          "Name, price and stock are required"

      });


    expect(dbMock.send)
      .not
      .toHaveBeenCalled();

  });


  // ---------------------------------------------------
  // 2. Product not found
  // ---------------------------------------------------

  test("should return 404 when product does not exist", async () => {

    const req = {

      params: {

        id: "PROD001"

      },

      body: {

        name: "iPhone",

        price: 79999,

        stock: 10

      },

      files: []

    };


    const res = createResponse();


    dbMock
      .send
      .mockResolvedValueOnce({

        Item: undefined

      });


    await updateProduct(req, res);


    expect(res.status)
      .toHaveBeenCalledWith(404);


    expect(res.json)
      .toHaveBeenCalledWith({

        success: false,

        message:
          "Product not found"

      });


    expect(dbMock.send)
      .toHaveBeenCalledTimes(1);

  });


  // ---------------------------------------------------
  // 3. Successful update
  // ---------------------------------------------------

  test("should update product successfully", async () => {

    const req = {

      params: {

        id: "PROD001"

      },

      body: {

        name: "New iPhone",

        description: "Updated",

        price: "89999",

        categoryId: "CAT001",

        brand: "Apple",

        stock: "20",

        discount: "10"

      },

      files: []

    };


    const res = createResponse();


    // Existing product

    dbMock
      .send
      .mockResolvedValueOnce({

        Item: {

          productId: "PROD001",

          images: []

        }

      });


    // Update result

    dbMock
      .send
      .mockResolvedValueOnce({

        Attributes: {

          productId: "PROD001",

          name: "New iPhone",

          price: 89999,

          stock: 20

        }

      });


    await updateProduct(req, res);


    expect(dbMock.send)
      .toHaveBeenCalledTimes(2);


    expect(res.json)
      .toHaveBeenCalledWith({

        success: true,

        message:
          "Product updated successfully",

        product: {

          productId: "PROD001",

          name: "New iPhone",

          price: 89999,

          stock: 20

        }

      });

  });


  // ---------------------------------------------------
  // 4. Update with new images
  // ---------------------------------------------------

  test("should replace old images with new images", async () => {

    const oldFile = {

      key:
        "products/PROD001/old.jpg"

    };


    const newFile = {

      originalname:
        "new.jpg"

    };


    const req = {

      params: {

        id: "PROD001"

      },

      body: {

        name: "iPhone",

        price: "80000",

        stock: "10"

      },

      files: [

        newFile

      ]

    };


    const res = createResponse();


    // Existing product

    dbMock
      .send
      .mockResolvedValueOnce({

        Item: {

          productId: "PROD001",

          images: [

            oldFile

          ]

        }

      });


    // Upload new image

    uploadToS3Mock
      .mockResolvedValueOnce({

        key:
          "products/PROD001/new.jpg",

        url:
          "https://example.com/new.jpg"

      });


    // Delete old S3 image

    s3Mock
      .send
      .mockResolvedValueOnce({});


    // Update DynamoDB

    dbMock
      .send
      .mockResolvedValueOnce({

        Attributes: {

          productId: "PROD001",

          name: "iPhone"

        }

      });


    await updateProduct(req, res);


    expect(uploadToS3Mock)
      .toHaveBeenCalledWith(

        newFile,

        "PROD001"

      );


    expect(s3Mock.send)
      .toHaveBeenCalledTimes(1);


    expect(dbMock.send)
      .toHaveBeenCalledTimes(2);


    expect(res.json)
      .toHaveBeenCalledWith(

        expect.objectContaining({

          success: true,

          message:
            "Product updated successfully"

        })

      );

  });


  // ---------------------------------------------------
  // 5. DynamoDB error
  // ---------------------------------------------------

  test("should return 500 when update fails", async () => {

    const req = {

      params: {

        id: "PROD001"

      },

      body: {

        name: "iPhone",

        price: 79999,

        stock: 10

      },

      files: []

    };


    const res = createResponse();


    dbMock
      .send
      .mockRejectedValue(
        new Error("DynamoDB error")
      );


    await updateProduct(req, res);


    expect(res.status)
      .toHaveBeenCalledWith(500);


    expect(res.json)
      .toHaveBeenCalledWith({

        success: false,

        message:
          "Failed to update product",

        error:
          "DynamoDB error"

      });

  });

});


// =====================================================
// DELETE PRODUCT
// =====================================================

describe("deleteProduct", () => {


  // ---------------------------------------------------
  // 1. Product not found
  // ---------------------------------------------------

  test("should return 404 when product does not exist", async () => {

    const req = {

      params: {

        id: "PROD001"

      }

    };


    const res = createResponse();


    dbMock
      .send
      .mockResolvedValueOnce({

        Item: undefined

      });


    await deleteProduct(req, res);


    expect(res.status)
      .toHaveBeenCalledWith(404);


    expect(res.json)
      .toHaveBeenCalledWith({

        success: false,

        message:
          "Product not found"

      });

  });


  // ---------------------------------------------------
  // 2. Delete product without images
  // ---------------------------------------------------

  test("should delete product without images", async () => {

    const req = {

      params: {

        id: "PROD001"

      }

    };


    const res = createResponse();


    // Get product

    dbMock
      .send
      .mockResolvedValueOnce({

        Item: {

          productId: "PROD001",

          images: []

        }

      });


    // Delete product

    dbMock
      .send
      .mockResolvedValueOnce({});


    await deleteProduct(req, res);


    expect(s3Mock.send)
      .not
      .toHaveBeenCalled();


    expect(dbMock.send)
      .toHaveBeenCalledTimes(2);


    expect(res.json)
      .toHaveBeenCalledWith({

        success: true,

        message:
          "Product and images deleted successfully"

      });

  });


  // ---------------------------------------------------
  // 3. Delete product with images
  // ---------------------------------------------------

  test("should delete product and images successfully", async () => {

    const req = {

      params: {

        id: "PROD001"

      }

    };


    const res = createResponse();


    // Get product

    dbMock
      .send
      .mockResolvedValueOnce({

        Item: {

          productId: "PROD001",

          images: [

            {
              key:
                "products/PROD001/image1.jpg"
            },

            {
              key:
                "products/PROD001/image2.jpg"
            }

          ]

        }

      });


    // S3 delete

    s3Mock
      .send
      .mockResolvedValueOnce({});


    // DynamoDB delete

    dbMock
      .send
      .mockResolvedValueOnce({});


    await deleteProduct(req, res);


    expect(s3Mock.send)
      .toHaveBeenCalledTimes(1);


    expect(dbMock.send)
      .toHaveBeenCalledTimes(2);


    expect(res.json)
      .toHaveBeenCalledWith({

        success: true,

        message:
          "Product and images deleted successfully"

      });

  });


  // ---------------------------------------------------
  // 4. Delete error
  // ---------------------------------------------------

  test("should return 500 when delete fails", async () => {

    const req = {

      params: {

        id: "PROD001"

      }

    };


    const res = createResponse();


    dbMock
      .send
      .mockRejectedValue(
        new Error("DynamoDB error")
      );


    await deleteProduct(req, res);


    expect(res.status)
      .toHaveBeenCalledWith(500);


    expect(res.json)
      .toHaveBeenCalledWith({

        success: false,

        message:
          "Failed to delete product",

        error:
          "DynamoDB error"

      });

  });

});