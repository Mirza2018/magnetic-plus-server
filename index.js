const express = require('express');
const cors = require('cors');
const app = express();
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

        app.get('/products', async (req, res) => {
            const data = productCollection.find();
            const result = await data.toArray()
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
            const result = await userCollection.insertOne(user)
            req.send(result);
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