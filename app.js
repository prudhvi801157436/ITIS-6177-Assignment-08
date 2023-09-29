const express = require('express');
const maria = require('mariadb');
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');

const app = express();
const port = 3000;

const pool = maria.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'sample',
    port: 3306,
    connectionLimit: 5
});

// json parser
app.use(express.json());

// Swagger
const swaggerOptions = {
    swaggerDefinition: {
        info: {
            title: 'Agents related API',
            version: '1.0.0',
            description: 'Agents related API Information',
        },
            // host: 'localhost:3000',
            host: '165.22.40.34:3000',
            basePath: '/',
    },
    // apis: ['./app.js'],
    apis: ['./server.js'],
};

const specs = swaggerJsDoc(swaggerOptions);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs));

// Error handler function for query middleware
const queryHandler = (req, res, next) => {
    pool.getConnection()
        .then(conn => {
            req.dbConnection = conn;
            next();
        })
        .catch(err => {
            console.error('Error connecting to database:', err);
            res.status(500).send('Error connecting to database');
        });
};

// API routes

// Get all agents
/**
 * @swagger
 * /api/v1/agents:
 *     get:
 *        description: Get all agents
 *        produces:
 *         - application/json
 *        responses:
 *           200:
 *              description: To get all the agents information.
 */
app.get('/api/v1/agents', queryHandler, (req, res) => {
    req.dbConnection.query('SELECT * FROM agents')
        .then(rows => {
            req.dbConnection.release();
            res.json(rows);
        })
        .catch(err => {
            req.dbConnection.release();
            console.error('Error executing query:', err);
            res.status(500).send('Error executing query');
        });
});

// POST a new agent
/**
 * @swagger
 * /api/v1/createAgent:
 *   post:
 *     description: Create a new agent
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: agentData
 *         in: body
 *         description: Agent data to create
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             AGENT_CODE:
 *               type: string
 *               example: A201
 *             AGENT_NAME:
 *               type: string
 *               example: Gabriel
 *             WORKING_AREA:
 *               type: string
 *               example: Costa Rica
 *             COMMISSION:
 *               type: number
 *               example: 0.11
 *             PHONE_NO:
 *               type: string
 *               example: +1-336-454-7880
 *             COUNTRY:
 *               type: string
 *               example: Brazil
 *     responses:
 *       201:
 *         description: Agent created successfully
 */
app.post('/api/v1/createAgent', queryHandler, (req, res) => {
    const agentData = req.body;
    const { AGENT_CODE, AGENT_NAME, WORKING_AREA, COMMISSION, PHONE_NO, COUNTRY} = agentData;
    const insertQuery = 'INSERT INTO agents SET AGENT_CODE = ?, AGENT_NAME = ?, WORKING_AREA = ?, COMMISSION = ?, PHONE_NO = ?, COUNTRY = ?';
    req.dbConnection.query(insertQuery, [AGENT_CODE,  AGENT_NAME, WORKING_AREA, COMMISSION, PHONE_NO, COUNTRY])
        .then(() => {
            req.dbConnection.release();
            res.status(201).send();
        })
        .catch(err => {
            req.dbConnection.release();
            console.error('Error executing query:', err);
            res.status(500).send('Error executing query');
        });
});

// Put an agent
/**
 * @swagger
 * /api/v1/updateAgent/{id}:
 *   put:
 *     description: Update a specific agent
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: id
 *         in: path
 *         description: Agent ID to update
 *         type: string
 *         example: A007
 *       - name: agentData
 *         in: body
 *         description: Agent data to update
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             AGENT_NAME:
 *               type: string
 *               example: John Doe
 *             WORKING_AREA:
 *               type: string
 *               example: New York
 *             COMMISSION:
 *               type: number
 *               example: 0.15
 *             PHONE_NO:
 *               type: string
 *               example: +1-123-456-7890
 *             COUNTRY:
 *               type: string
 *               example: USA
 *     responses:
 *       204:
 *         description: Agent updated successfully
 */
app.put('/api/v1/updateAgent/:id', queryHandler, (req, res) => {
    const agentId = req.params.id;
    const agentData = req.body;
    const { AGENT_NAME, WORKING_AREA, COMMISSION, PHONE_NO, COUNTRY} = agentData;
    const updateQuery = 'UPDATE agents SET AGENT_NAME = ?, WORKING_AREA = ?, COMMISSION = ?, PHONE_NO = ?, COUNTRY = ? WHERE AGENT_CODE = ?';
    req.dbConnection.query(updateQuery, [ AGENT_NAME, WORKING_AREA, COMMISSION, PHONE_NO, COUNTRY, agentId])
        .then(() => {
            req.dbConnection.release();
            res.status(204).send();
        })
        .catch(err => {
            req.dbConnection.release();
            console.error('Error executing query:', err);
            res.status(500).send('Error executing query');
        });
});

// Patch an agent
/**
 * @swagger
 * /api/v1/patchAgent/{id}:
 *   patch:
 *     description: Update a specific agent
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: id
 *         in: path
 *         description: Agent ID to update
 *         type: string,
 *         example: A201
 *       - name: agentData
 *         in: body
 *         description: Agent data to update
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             AGENT_NAME:
 *               type: string
 *               example: Sam
 *             WORKING_AREA:
 *               type: string
 *               example: Melbourne
 *             COUNTRY:
 *               type: string
 *               example: Australia
 *     responses:
 *       204:
 *         description: Agent updated successfully
 */

app.patch('/api/v1/patchAgent/:id', queryHandler, (req, res) => {
    const agentId = req.params.id;
    const agentData = req.body;
    const updateFields = {}; 
    const updateParams = []; 

    if (agentData.AGENT_NAME) {
        updateFields.AGENT_NAME = agentData.AGENT_NAME;
        updateParams.push(agentData.AGENT_NAME); 
    }
    if (agentData.WORKING_AREA) {
        updateFields.WORKING_AREA = agentData.WORKING_AREA;
        updateParams.push(agentData.WORKING_AREA); 
    }
    if (agentData.COMMISSION) {
        updateFields.COMMISSION = agentData.COMMISSION;
        updateParams.push(agentData.COMMISSION); 
    }
    if (agentData.PHONE_NO) {
        updateFields.PHONE_NO = agentData.PHONE_NO;
        updateParams.push(agentData.PHONE_NO); 
    }
    if (agentData.COUNTRY) {
        updateFields.COUNTRY = agentData.COUNTRY;
        updateParams.push(agentData.COUNTRY); 
    }

    if (Object.keys(updateFields).length === 0) {
        res.status(400).send('No valid fields to update.');
        return;
    }

    const updateQuery = 'UPDATE agents SET ' + Object.keys(updateFields).map(field => `${field} = ?`).join(', ') + ' WHERE AGENT_CODE = ?';
    updateParams.push(agentId); 

    req.dbConnection.query(updateQuery, updateParams)
        .then(() => {
            req.dbConnection.release();
            res.status(204).send();
        })
        .catch(err => {
            req.dbConnection.release();
            console.error('Error executing query:', err);
            res.status(500).send('Error executing query');
        });
});

// Delete an agent
/**
 * @swagger
 * /api/v1/deleteAgent:
 *   delete:
 *     description: Delete a specific agent by ID
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: id
 *         in: query
 *         description: Agent ID to delete
 *         required: true
 *         type: string
 *         example: A007
 *     responses:
 *       204:
 *         description: Agent deleted successfully
 */
app.delete('/api/v1/deleteAgent', queryHandler, (req, res) => {
    const agentId = req.query.id;
    req.dbConnection.query('DELETE FROM agents WHERE AGENT_CODE = ?', [agentId])
        .then(() => {
            req.dbConnection.release();
            res.status(204).send();
        })
        .catch(err => {
            req.dbConnection.release();
            console.error('Error executing query:', err);
            res.status(500).send('Error executing query');
        });
});

app.listen(port, () => {
    console.log(`Server is running on localhost:${port}`);
});
