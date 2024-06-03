const express = require('express');
const cors = require('cors');
const app = express();
const jwt = require('jsonwebtoken')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()

const port = process.env.PORT || 5000;

//middleware
app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@magneticplus.somyfzj.mongodb.net/?retryWrites=true&w=majority&appName=MagneticPlus`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        // Send a ping to confirm a successful connection

        const productCollection = client.db('MERN').collection('products')
        const addToCartCollection = client.db('MERN').collection('carts')
        const userCollection = client.db('MERN').collection('users')
        const itemCollection = client.db('MERN').collection('items')


        //Jwt related Api
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
            res.send({ token })
        })

        //Varify token midelware
        const varifyToken = (req, res, next) => {
            if (!req.headers.authorization) {
                return res.status(401).send({ message: 'Unauthorized access' })
            }
            const token = req.headers.authorization.split(' ')[1]

            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
                if (err) {
                    return res.status(401).send({ message: 'Unauthorized access' })
                }
                req.decoded = decoded;
                next();
            })
        }
        //use varify admin after varify token
        const varifyAdmin = async (req, res, next) => {
            const email = req.decoded.email;
            const query = { email: email };
            const user = await userCollection.findOne(query);
            const isAdmin = user?.role === 'admin'
            if (!isAdmin) {
                return res.status(403).send({ message: 'forbidden access' });
            }
            next();
        }



        app.get('/products', async (req, res) => {
            const data = productCollection.find();
            const result = await data.toArray()
            res.send(result)
        })

        ////get items

        app.get('/items', async (req, res) => {
            const result = await itemCollection.find().toArray()
            res.send(result)
        })

        /// Get single Item
        app.get('/item/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await itemCollection.findOne(query);
            res.send(result)
        })

        app.post('/items', varifyToken, varifyAdmin, async (req, res) => {
            const item = req.body;
            const result = await itemCollection.insertOne(item);
            res.send(result)
        })
        ///Item delete
        app.delete('/items/:id', varifyToken, varifyAdmin, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await itemCollection.deleteOne(query);
            res.send(result)
        })
        //Item Patch
        app.patch('/item/:id', varifyToken, varifyAdmin, async (req, res) => {
            const item = req.body;
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedDoc = {
                $set: {
                    name:item.name,
                    price:item.price,
                    desc:item.desc,
                    categories:item.categories,
                    img:item.img
                }}
            const result = await itemCollection.updateOne(filter, updatedDoc)
            res.send(result)
            })



        // post add to cart data data
        // app.post('/addtocart', async (req, res) => {

        //     const data = addToCartCollection.find();
        //     const previousAddToCart = await data.toArray()

        //     const user = req.body.user;
        //     const itemId = req.body.itemId;
        //     const docs = {
        //         user,
        //         itemId
        //     }

        //     const oldUser = previousAddToCart.find(p => p.user === user)
        //     console.log("olduser", oldUser);


        //     if (oldUser) {
        //         const oldItemIds = oldUser.itemId
        //         oldItemIds.push(itemId)
        //         const filter = { _id: oldUser._id }
        //         const updateAddToCart = {
        //             $set: {
        //                 itemId: oldItemIds,
        //                 user: oldUser.user
        //             }
        //         }
        //         const options = { upsert: true }
        //         const result = await addToCartCollection.updateOne(filter, updateAddToCart, options)
        //         console.log("I am result1", result);
        //         res.send(result)
        //     }

        //     else {
        //         const result = await addToCartCollection.insertOne(docs)
        //         console.log("I am result2", result);

        //         // res.send(result)
        //     }



        // })

        app.post('/addtocart', async (req, res) => {
            const item = req.body;
            const result = await addToCartCollection.insertOne(item);
            res.send(result)
        })


        // app.get('/carts', verifyJwt, async (req, res) => {
        //     const email = req.query.email
        //     console.log(email);
        //     const query = { email: email }


        //     if (!email) {
        //         res.send([])
        //     }


        //     const decodedEmail = req.decoded.email;
        //     if (email !== decodedEmail) {
        //         return res.status(403).send({ error: true, message: "Forbidden Access" })
        //     }

        //     const result = await cartCollection.find(query).toArray();
        //     res.send(result)
        // })

        // get add to cart data

        app.get('/addtocart', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const result = await addToCartCollection.find(query).toArray()
            res.send(result)
        })

        // Delete from add to cart add to cart
        app.delete('/addtocart/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await addToCartCollection.deleteOne(query);
            res.send(result)
        })

        //user related api
        app.post('/users', async (req, res) => {
            const user = req.body
            const query = { email: user.email }
            const existingUser = await userCollection.findOne(query);
            if (existingUser) {
                return res.send({ message: "User Alrady Exists", InsertedId: null })
            }
            const result = await userCollection.insertOne(user)
            res.send(result);
        })
        //Users get
        app.get('/users', varifyToken, varifyAdmin, async (req, res) => {

            const result = await userCollection.find().toArray();
            res.send(result)
        })
        //user delete

        app.delete('/users/:id', varifyToken, varifyAdmin, async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await userCollection.deleteOne(query);
            res.send(result)
        })

        //get admin check
        app.get('/users/admin/:email', varifyToken, async (req, res) => {
            const email = req.params.email;
            if (email !== req.decoded.email) {
                return res.status(403).send({ message: 'Forbidden access' })
            }
            const query = { email: email }
            const user = await userCollection.findOne(query);
            let admin = false;
            if (user) {
                admin = user?.role === 'admin';

            }
            res.send({ admin });
        })

        //user admin role implement
        app.patch('/users/admin/:id', varifyToken, varifyAdmin, async (req, res) => {

            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await userCollection.updateOne(filter, updatedDoc)
            res.send(result)
        })




        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);







app.get('/', (req, res) => {
    res.send('Magnetic-plus is running')
})

app.listen(port, () => {

    console.log(`Magnetic-plus server is running on port ${port}`);

})