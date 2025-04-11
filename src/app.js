require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');

// Import models and middleware
const { Pool, Facility, User, Review, sequelize } = require('./models/index');
const { baseLimit, authLimit } = require('./middleware/rateLimit');
const { validatePool, validateReview, validateId } = require('./middleware/validators');
const { protect, adminOnly } = require('./middleware/auth');
const authRoutes = require('./routes/auth');

// Add these imports at the top
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

app.use(cors());
app.use(express.json());

// Apply rate limiting to all requests (disable for testing)
if (process.env.NODE_ENV !== 'test') {
  app.use(baseLimit);
}

// Connect to PostgreSQL via Sequelize
// Only connect if not testing
if (process.env.NODE_ENV !== 'test') {
  sequelize.sync() // Creates tables if they don't exist
    .then(() => console.log('Database connected'))
    .catch(err => console.error('Unable to connect to database:', err));
}

// Use auth routes
app.use('/api/auth', authRoutes);

// Swagger definition
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Iceland Pools API',
      version: '1.0.0',
      description: 'REST API for swimming pools in Iceland',
      contact: {
        name: 'Github Repo',
        url: 'https://github.com/Lavardur/iceland-pools-api',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://iceland-pools-api-production.up.railway.app',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.js', './src/app.js'], // Path to the API docs
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use('/api', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Root route for basic info
/**
 * @swagger
 * /:
 *   get:
 *     summary: Root endpoint with API information
 *     tags: [System]
 *     responses:
 *       200:
 *         description: API information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                 description:
 *                   type: string
 *                 documentation:
 *                   type: string
 *                 apiDocs:
 *                   type: string
 *                 healthCheck:
 *                   type: string
 *                 repository:
 *                   type: string
 */
app.get('/', (req, res) => {
  res.json({
    name: "Iceland Pools API",
    description: "REST API for swimming pools in Iceland",
    documentation: "/api",
    healthCheck: "/api/health",
    repository: "https://github.com/Lavardur/iceland-pools-api"
  });
});


// GET all pools
/**
 * @swagger
 * /api/pools:
 *   get:
 *     summary: Returns list of all pools
 *     tags: [Pools]
 *     responses:
 *       200:
 *         description: List of pools
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   name:
 *                     type: string
 *                     example: "Laugardalslaug"
 *                   latitude:
 *                     type: number
 *                     example: 64.1388
 *                   longitude:
 *                     type: number
 *                     example: -21.8841
 */
app.get('/api/pools', async (req, res) => {
  try {
    const pools = await Pool.findAll({
      include: [Facility]
    });
    res.json(pools);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET pool by ID with validation
/**
 * @swagger
 * /api/pools/{id}:
 *   get:
 *     summary: Get a specific pool by ID
 *     tags: [Pools]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Pool ID
 *     responses:
 *       200:
 *         description: Pool details with facilities and reviews
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Pool'
 *                 - type: object
 *                   properties:
 *                     Facility:
 *                       $ref: '#/components/schemas/Facility'
 *                     Reviews:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Review'
 *       404:
 *         description: Pool not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 */
app.get('/api/pools/:id', validateId, async (req, res) => {
  try {
    const pool = await Pool.findByPk(req.params.id, {
      include: [
        Facility,
        {
          model: Review,
          include: [
            {
              model: User,
              attributes: ['username'] // Only show the username, not password or email
            }
          ]
        }
      ]
    });
    
    if (!pool) {
      return res.status(404).json({ error: 'Pool not found' });
    }
    
    res.json(pool);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET reviews for a specific pool
/**
 * @swagger
 * /api/pools/{id}/reviews:
 *   get:
 *     summary: Get reviews for a specific pool
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Pool ID
 *     responses:
 *       200:
 *         description: List of reviews for the pool
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Review'
 *       404:
 *         description: Pool not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.get('/api/pools/:id/reviews', validateId, async (req, res) => {
  try {
    const pool = await Pool.findByPk(req.params.id);
    
    if (!pool) {
      return res.status(404).json({ error: 'Pool not found' });
    }
    
    const reviews = await Review.findAll({
      where: { pool_id: req.params.id },
      include: [{
        model: User,
        attributes: ['username']
      }]
    });
    
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST new pool with validation - Admin only
/**
 * @swagger
 * /api/pools:
 *   post:
 *     summary: Add a new pool
 *     tags: [Pools]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 required: true
 *               latitude:
 *                 type: number
 *                 format: float
 *               longitude:
 *                 type: number
 *                 format: float
 *               entry_fee:
 *                 type: integer
 *               description:
 *                 type: string
 *               opening_hours:
 *                 type: string
 *               website:
 *                 type: string
 *               facilities:
 *                 $ref: '#/components/schemas/Facility'
 *     responses:
 *       201:
 *         description: Pool created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Pool'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (admin only)
 */
app.post('/api/pools', protect, adminOnly, validatePool, async (req, res) => {
  try {
    const { facilities, ...poolData } = req.body;
    
    const newPool = await Pool.create(poolData);
    
    if (facilities) {
      await Facility.create({
        ...facilities,
        pool_id: newPool.id
      });
    }
    
    res.status(201).json(newPool);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update existing pool - Admin only
/**
 * @swagger
 * /api/pools/{id}:
 *   put:
 *     summary: Update a pool
 *     tags: [Pools]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Pool ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               latitude:
 *                 type: number
 *                 format: float
 *               longitude:
 *                 type: number
 *                 format: float
 *               entry_fee:
 *                 type: integer
 *               description:
 *                 type: string
 *               opening_hours:
 *                 type: string
 *               website:
 *                 type: string
 *               facilities:
 *                 $ref: '#/components/schemas/Facility'
 *     responses:
 *       200:
 *         description: Pool updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Pool'
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (admin only)
 *       404:
 *         description: Pool not found
 */
app.put('/api/pools/:id', protect, adminOnly, validateId, async (req, res) => {
  try {
    const pool = await Pool.findByPk(req.params.id);
    
    if (!pool) {
      return res.status(404).json({ error: 'Pool not found' });
    }
    
    // Update pool data
    await pool.update(req.body);
    
    // Update facilities if provided
    if (req.body.facilities) {
      const facility = await Facility.findOne({ where: { pool_id: pool.id } });
      if (facility) {
        await facility.update(req.body.facilities);
      } else {
        await Facility.create({
          ...req.body.facilities,
          pool_id: pool.id
        });
      }
    }
    
    // Return updated pool with facilities
    const updatedPool = await Pool.findByPk(req.params.id, {
      include: [Facility]
    });
    
    res.json(updatedPool);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE existing pool - Admin only
/**
 * @swagger
 * /api/pools/{id}:
 *   delete:
 *     summary: Delete a pool
 *     tags: [Pools]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Pool ID
 *     responses:
 *       200:
 *         description: Pool deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Pool deleted successfully"
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (admin only)
 *       404:
 *         description: Pool not found
 */
app.delete('/api/pools/:id', protect, adminOnly, validateId, async (req, res) => {
  try {
    const pool = await Pool.findByPk(req.params.id);
    
    if (!pool) {
      return res.status(404).json({ error: 'Pool not found' });
    }
    
    // Delete pool (cascade should handle facilities)
    await pool.destroy();
    
    res.json({ message: 'Pool deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST new review with validation - Authentication required
/**
 * @swagger
 * /api/reviews:
 *   post:
 *     summary: Add a new review for a pool
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pool_id
 *               - rating
 *             properties:
 *               pool_id:
 *                 type: integer
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *               visit_date:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Review created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Review'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Pool not found
 */
app.post('/api/reviews', protect, validateReview, async (req, res) => {
  try {
    const { pool_id, rating, comment, visit_date } = req.body;
    
    // Check if pool exists
    const pool = await Pool.findByPk(pool_id);
    if (!pool) {
      return res.status(404).json({ error: 'Pool not found' });
    }
    
    // Create review with authenticated user ID
    const review = await Review.create({
      pool_id,
      user_id: req.user.id, // Use authenticated user's ID from token
      rating,
      comment,
      visit_date
    });
    
    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET reviews by a specific user - Users can see their own reviews
/**
 * @swagger
 * /api/users/reviews:
 *   get:
 *     summary: Get reviews by the authenticated user
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of reviews by the user
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 allOf:
 *                   - $ref: '#/components/schemas/Review'
 *                   - type: object
 *                     properties:
 *                       Pool:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           name:
 *                             type: string
 *       401:
 *         description: Not authenticated
 */
app.get('/api/users/reviews', protect, async (req, res) => {
  try {
    const reviews = await Review.findAll({
      where: { user_id: req.user.id },
      include: [{
        model: Pool,
        attributes: ['id', 'name']
      }]
    });
    
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE a review - Users can delete their own reviews, admins can delete any
/**
 * @swagger
 * /api/reviews/{id}:
 *   delete:
 *     summary: Delete a review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Review ID
 *     responses:
 *       200:
 *         description: Review deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Review deleted successfully"
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (can only delete own reviews or admin)
 *       404:
 *         description: Review not found
 */
app.delete('/api/reviews/:id', protect, validateId, async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id);
    
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    // Check if user owns the review or is admin
    if (review.user_id !== req.user.id && !req.user.is_admin) {
      return res.status(403).json({ error: 'Not authorized to delete this review' });
    }
    
    await review.destroy();
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint for Railway
/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [System]
 *     responses:
 *       200:
 *         description: API status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "UP"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date() });
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Pool:
 *       type: object
 *       required:
 *         - name
 *         - latitude
 *         - longitude
 *       properties:
 *         id:
 *           type: integer
 *           description: Auto-generated ID
 *         name:
 *           type: string
 *           description: Name of the swimming pool
 *         latitude:
 *           type: number
 *           format: float
 *           description: Latitude coordinate
 *         longitude:
 *           type: number
 *           format: float
 *           description: Longitude coordinate
 *         entry_fee:
 *           type: integer
 *           description: Entry fee in ISK
 *         description:
 *           type: string
 *           description: Description of the pool
 *         opening_hours:
 *           type: string
 *           description: Opening hours
 *         website:
 *           type: string
 *           description: Website URL
 *       example:
 *         id: 1
 *         name: "Laugardalslaug"
 *         latitude: 64.1388
 *         longitude: -21.8841
 *         entry_fee: 1090
 *         description: "Largest swimming pool in Reykjavík"
 *         opening_hours: "06:30-22:00"
 *         website: "https://reykjavik.is/laugardalslaug"
 *     Facility:
 *       type: object
 *       properties:
 *         hot_tub:
 *           type: boolean
 *         sauna:
 *           type: boolean
 *         water_slide:
 *           type: boolean
 *         child_friendly:
 *           type: boolean
 *       example:
 *         hot_tub: true
 *         sauna: true
 *         water_slide: false
 *         child_friendly: true
 *     Review:
 *       type: object
 *       required:
 *         - pool_id
 *         - rating
 *       properties:
 *         id:
 *           type: integer
 *         pool_id:
 *           type: integer
 *         user_id:
 *           type: integer
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         comment:
 *           type: string
 *         visit_date:
 *           type: string
 *           format: date
 *       example:
 *         id: 1
 *         pool_id: 1
 *         user_id: 2
 *         rating: 5
 *         comment: "Great hot tubs and friendly staff"
 *         visit_date: "2023-06-15"
 *     User:
 *       type: object
 *       required:
 *         - username
 *         - email
 *         - password
 *       properties:
 *         username:
 *           type: string
 *         email:
 *           type: string
 *         password:
 *           type: string
 *           format: password
 *       example:
 *         username: "icelandfan"
 *         email: "user@example.com"
 *         password: "Password123"
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *       example:
 *         error: "Not authorized"
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: User authentication and registration
 *   - name: Pools
 *     description: Swimming pool operations
 *   - name: Reviews
 *     description: Pool reviews operations
 *   - name: System
 *     description: System endpoints
 */

module.exports = app; // Export for testing and for use in index.js