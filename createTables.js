import dotenv from "dotenv";

import {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand
} from "@aws-sdk/client-dynamodb";

dotenv.config();

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,

  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const tables = [

  // =====================================================
  // 1. USERS
  // =====================================================

  {
    TableName: "Users",

    KeySchema: [
      {
        AttributeName: "id",
        KeyType: "HASH"
      }
    ],

    AttributeDefinitions: [
      {
        AttributeName: "id",
        AttributeType: "S"
      }
    ]
  },


  // =====================================================
  // 2. CATEGORIES
  // =====================================================

  {
    TableName: "Categories",

    KeySchema: [
      {
        AttributeName: "categoryId",
        KeyType: "HASH"
      }
    ],

    AttributeDefinitions: [
      {
        AttributeName: "categoryId",
        AttributeType: "S"
      }
    ]
  },


  // =====================================================
  // 3. PRODUCTS
  // =====================================================

  {
    TableName: "Products",

    KeySchema: [
      {
        AttributeName: "productId",
        KeyType: "HASH"
      }
    ],

    AttributeDefinitions: [
      {
        AttributeName: "productId",
        AttributeType: "S"
      }
    ]
  },


  // =====================================================
  // 4. COMMENTS
  // =====================================================
  // productId = Partition Key
  // commentId = Sort Key
  // =====================================================

  {
    TableName: "Comments",

    KeySchema: [
      {
        AttributeName: "productId",
        KeyType: "HASH"
      },
      {
        AttributeName: "commentId",
        KeyType: "RANGE"
      }
    ],

    AttributeDefinitions: [
      {
        AttributeName: "productId",
        AttributeType: "S"
      },
      {
        AttributeName: "commentId",
        AttributeType: "S"
      }
    ]
  },


  // =====================================================
  // 5. LIKES
  // =====================================================
  // productId = Partition Key
  // userId = Sort Key
  // =====================================================

  {
    TableName: "Likes",

    KeySchema: [
      {
        AttributeName: "productId",
        KeyType: "HASH"
      },
      {
        AttributeName: "userId",
        KeyType: "RANGE"
      }
    ],

    AttributeDefinitions: [
      {
        AttributeName: "productId",
        AttributeType: "S"
      },
      {
        AttributeName: "userId",
        AttributeType: "S"
      }
    ]
  },


  // =====================================================
  // 6. CARTS
  // =====================================================

  {
    TableName: "Carts",

    KeySchema: [
      {
        AttributeName: "cartId",
        KeyType: "HASH"
      }
    ],

    AttributeDefinitions: [
      {
        AttributeName: "cartId",
        AttributeType: "S"
      }
    ]
  },


  // =====================================================
  // 7. ORDERS
  // =====================================================

  {
    TableName: "Orders",

    KeySchema: [
      {
        AttributeName: "orderId",
        KeyType: "HASH"
      }
    ],

    AttributeDefinitions: [
      {
        AttributeName: "orderId",
        AttributeType: "S"
      }
    ]
  },


  // =====================================================
  // 8. ORDER ITEMS
  // =====================================================
  // orderId = Partition Key
  // productId = Sort Key
  // =====================================================

  {
    TableName: "OrderItems",

    KeySchema: [
      {
        AttributeName: "orderId",
        KeyType: "HASH"
      },
      {
        AttributeName: "productId",
        KeyType: "RANGE"
      }
    ],

    AttributeDefinitions: [
      {
        AttributeName: "orderId",
        AttributeType: "S"
      },
      {
        AttributeName: "productId",
        AttributeType: "S"
      }
    ]
  },


  // =====================================================
  // 9. REVIEWS
  // =====================================================

  {
    TableName: "Reviews",

    KeySchema: [
      {
        AttributeName: "productId",
        KeyType: "HASH"
      },
      {
        AttributeName: "reviewId",
        KeyType: "RANGE"
      }
    ],

    AttributeDefinitions: [
      {
        AttributeName: "productId",
        AttributeType: "S"
      },
      {
        AttributeName: "reviewId",
        AttributeType: "S"
      }
    ]
  },


  // =====================================================
  // 10. ADDRESSES
  // =====================================================

  {
    TableName: "Addresses",

    KeySchema: [
      {
        AttributeName: "userId",
        KeyType: "HASH"
      },
      {
        AttributeName: "addressId",
        KeyType: "RANGE"
      }
    ],

    AttributeDefinitions: [
      {
        AttributeName: "userId",
        AttributeType: "S"
      },
      {
        AttributeName: "addressId",
        AttributeType: "S"
      }
    ]
  },


  // =====================================================
  // 11. PAYMENTS
  // =====================================================

  {
    TableName: "Payments",

    KeySchema: [
      {
        AttributeName: "paymentId",
        KeyType: "HASH"
      }
    ],

    AttributeDefinitions: [
      {
        AttributeName: "paymentId",
        AttributeType: "S"
      }
    ]
  },


  // =====================================================
  // 12. INVENTORY
  // =====================================================

  {
    TableName: "Inventory",

    KeySchema: [
      {
        AttributeName: "productId",
        KeyType: "HASH"
      }
    ],

    AttributeDefinitions: [
      {
        AttributeName: "productId",
        AttributeType: "S"
      }
    ]
  },


  // =====================================================
  // 13. SHIPMENTS
  // =====================================================

  {
    TableName: "Shipments",

    KeySchema: [
      {
        AttributeName: "shipmentId",
        KeyType: "HASH"
      }
    ],

    AttributeDefinitions: [
      {
        AttributeName: "shipmentId",
        AttributeType: "S"
      }
    ]
  },


  // =====================================================
  // 14. RETURNS
  // =====================================================

  {
    TableName: "Returns",

    KeySchema: [
      {
        AttributeName: "returnId",
        KeyType: "HASH"
      }
    ],

    AttributeDefinitions: [
      {
        AttributeName: "returnId",
        AttributeType: "S"
      }
    ]
  },


  // =====================================================
  // 15. REFUNDS
  // =====================================================

  {
    TableName: "Refunds",

    KeySchema: [
      {
        AttributeName: "refundId",
        KeyType: "HASH"
      }
    ],

    AttributeDefinitions: [
      {
        AttributeName: "refundId",
        AttributeType: "S"
      }
    ]
  },


  // =====================================================
  // 16. WISHLIST
  // =====================================================

  {
    TableName: "Wishlist",

    KeySchema: [
      {
        AttributeName: "userId",
        KeyType: "HASH"
      },
      {
        AttributeName: "productId",
        KeyType: "RANGE"
      }
    ],

    AttributeDefinitions: [
      {
        AttributeName: "userId",
        AttributeType: "S"
      },
      {
        AttributeName: "productId",
        AttributeType: "S"
      }
    ]
  },


  // =====================================================
  // 17. COUPONS
  // =====================================================

  {
    TableName: "Coupons",

    KeySchema: [
      {
        AttributeName: "couponId",
        KeyType: "HASH"
      }
    ],

    AttributeDefinitions: [
      {
        AttributeName: "couponId",
        AttributeType: "S"
      }
    ]
  },


  // =====================================================
  // 18. NOTIFICATIONS
  // =====================================================

  {
    TableName: "Notifications",

    KeySchema: [
      {
        AttributeName: "notificationId",
        KeyType: "HASH"
      }
    ],

    AttributeDefinitions: [
      {
        AttributeName: "notificationId",
        AttributeType: "S"
      }
    ]
  },


  // =====================================================
  // 19. SELLERS
  // =====================================================

  {
    TableName: "Sellers",

    KeySchema: [
      {
        AttributeName: "sellerId",
        KeyType: "HASH"
      }
    ],

    AttributeDefinitions: [
      {
        AttributeName: "sellerId",
        AttributeType: "S"
      }
    ]
  },


  // =====================================================
  // 20. SELLER PRODUCTS
  // =====================================================
  // sellerId = Partition Key
  // productId = Sort Key
  // =====================================================

  {
    TableName: "SellerProducts",

    KeySchema: [
      {
        AttributeName: "sellerId",
        KeyType: "HASH"
      },
      {
        AttributeName: "productId",
        KeyType: "RANGE"
      }
    ],

    AttributeDefinitions: [
      {
        AttributeName: "sellerId",
        AttributeType: "S"
      },
      {
        AttributeName: "productId",
        AttributeType: "S"
      }
    ]
  }

];


// =====================================================
// CREATE TABLES
// =====================================================

const createTables = async () => {

  for (const table of tables) {

    try {

      // Check whether table already exists

      await client.send(
        new DescribeTableCommand({
          TableName: table.TableName
        })
      );

      console.log(
        `⚠️ ${table.TableName} already exists`
      );

    } catch (error) {

      // Table doesn't exist

      if (error.name === "ResourceNotFoundException") {

        try {

          await client.send(
            new CreateTableCommand({

              TableName: table.TableName,

              KeySchema: table.KeySchema,

              AttributeDefinitions:
                table.AttributeDefinitions,

              BillingMode: "PAY_PER_REQUEST"

            })
          );

          console.log(
            `✅ ${table.TableName} created successfully`
          );

        } catch (createError) {

          console.error(
            `❌ Failed to create ${table.TableName}:`,
            createError.message
          );

        }

      } else {

        console.error(
          `❌ Error checking ${table.TableName}:`,
          error.message
        );

      }

    }

  }

};


// =====================================================
// RUN
// =====================================================

createTables();