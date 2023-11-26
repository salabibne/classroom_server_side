const express = require('express')

const app = express()
const jwt = require('jsonwebtoken');
const cors = require('cors')
const port = process.env.PORT || 5000
require('dotenv').config()

// middlewares
app.use(cors())
app.use(express.json())


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ovwhpk1.mongodb.net/?retryWrites=true&w=majority`

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
        const userCollection = client.db("ClassRoom").collection("Users");
        const teacherCollection = client.db("ClassRoom").collection("teachers");

        app.post("/users", async(req,res)=>{
            const users = req.body;
            const result = await userCollection.insertOne(users);
            res.send(result)
        })

        app.post("/teacher", async(req,res)=>{
            const teachers = req.body;
            const result = await teacherCollection.insertOne(teachers)
            res.send(result)
        })

        // jwt relqated Token

        app.post("/jwt", async(req,res)=>{
            const user = req.body;
            const token = jwt.sign( user, process.env.TOKEN, {
                expiresIn: "1h"
            })
            

            res.send({token})
                
           
        })






        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get("/", (req, res) => {
    res.send("classroom server is Running")
})

app.listen(port, () => {
    console.log(`server is running at ${port}`);
})