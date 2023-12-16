const express = require('express')
// const { ObjectId } = require('mongodb');
const app = express()
const jwt = require('jsonwebtoken');
const cors = require('cors')
const port = process.env.PORT || 5000
require('dotenv').config()

// middlewares
app.use(cors())
app.use(express.json())


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
        const classCollection = client.db("ClassRoom").collection("classs");
        const assignmentCollection = client.db("ClassRoom").collection("assignments");
        const enrollCollection = client.db("ClassRoom").collection("enroll");
        const assignmentAnsCollection = client.db("ClassRoom").collection("answer");


        // middlewares

        // verify Token

        const verifyToken = (req, res, next) => {
            if (!req.headers.authorization) {
                return res.status(401).send({ message: "forbiddenAccess" })
            }

            const token = req.headers.authorization.split(' ')[1]
            jwt.verify(token, process.env.TOKEN, function (err, decoded) {
                if (err) {
                    return res.status(401).send({ message: "not Authorized" })
                }
                req.decoded = decoded
                next()
            });
        }

        // verifyadmin

        const verifyAdmin = async (req, res, next) => {
            const email = req.decoded.email;
            const query = { email: email }
            const result = await userCollection.findOne(query)
            const isAdmin = result?.role === "admin";
            if (!isAdmin) {
                return res.status(403).send({ message: "not valid user" })
            }
            next()
        }

        // verifyteacher

        const verifyTeacher = async (req, res, next) => {
            const email = req.decoded.email;
            const query = { email: email };
            const result = await teacherCollection.findOne(query)
            const isTeacher = result?.status === "accepted";
            if (!isTeacher) {
                return res.status(403).send({ message: "not valid User" })
            }
            next();
        }

        // verifyStudent
        const verifyStudent = async (req, res, next) => {
            const email = req.decoded.email;
            const query = { user: email };
            const result = await enrollCollection.findOne(query);
            if (!result) {
                return res.status(403).send({ message: "not valid user" })
            }
            next()
        }

        app.post("/users", async (req, res) => {
            const users = req.body;
            const result = await userCollection.insertOne(users);
            res.send(result)
        })

        app.post("/teacher", async (req, res) => {
            const teachers = req.body;
            const result = await teacherCollection.insertOne(teachers)
            res.send(result)
        })

        app.get("/student/allclass", async (req, res) => {
            const query = { status: "approved" };
            const result = await classCollection.find(query).toArray()
            res.send(result)
        })

        // jwt relqated Token

        app.post("/jwt", async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.TOKEN, {
                expiresIn: "1h"
            })


            res.send({ token })


        })

        app.get("/user/admin/:email", verifyToken, async (req, res) => {
            const email = req.params.email
            if (email !== req.decoded.email) {
                return res.status(401).send({ message: "UnAuthorized" })
            }

            const query = { email: email };
            const result = await userCollection.findOne(query)

            let admin = false
            if (result) {
                admin = result?.role === "admin";
            }
            res.send({ admin })

        })

        app.get("/user/teacher/:email", verifyToken, async (req, res) => {
            const email = req.params.email;
            if (email !== req.decoded.email) {
                return res.status(401).send({ message: "UnAuthorized" })
            }
            const query = { email: email }
            const result = await teacherCollection.findOne(query);
            let teacher = false
            if (result) {
                teacher = result?.status === "accepted"


            }
            res.send({ teacher })
        })

        app.get("/user/student/:email", verifyToken, async (req, res) => {
            const email = req.params.email;
            if (email !== req.decoded.email) {
                return res.status(401).send({ message: "unAuthorized" })
            }
            const query = { user: email }
            const result = await enrollCollection.findOne(query);
            let student = false
            if (result) {
                student = true
            }
            res.send({ student })
        })

        app.get("/admin/techereq", async (req, res) => {
            const teacherRequest = await teacherCollection.find().toArray()
            res.send(teacherRequest)

        })

        app.get("/admin/users", async (req, res) => {
            const userRequest = await userCollection.find().toArray()
            res.send(userRequest)

        })

        app.patch("/admin/updateAccept/:id", verifyToken, verifyAdmin, async (req, res) => {

            const acceptStatus = req.body

            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedStatus = {
                $set: {
                    status: acceptStatus.status

                }
            }
            const options = { upsert: true };
            const result = await teacherCollection.updateOne(filter, updatedStatus, options)
            res.send(result)


        })
        app.patch("/admin/updateReject/:id", verifyToken, verifyAdmin, async (req, res) => {

            const acceptStatus = req.body

            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedStatus = {
                $set: {
                    status: acceptStatus.status

                }
            }
            const options = { upsert: true };
            const result = await teacherCollection.updateOne(filter, updatedStatus, options)
            res.send(result)


        })

        app.get("/users", verifyToken, verifyAdmin, async (req, res) => {
            const result = await userCollection.find().toArray();
            res.send(result)

        })


        app.get("/admin/allclass", verifyToken, verifyAdmin, async (req, res) => {
            const classInformation = await classCollection.find().toArray()
            res.send(classInformation)
        })

        app.patch("/admin/allclassaccept/:id", verifyToken, verifyAdmin, async (req, res) => {

            const acceptStatus = req.body

            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedStatus = {
                $set: {
                    status: acceptStatus.status

                }
            }
            const options = { upsert: true };
            const result = await classCollection.updateOne(filter, updatedStatus, options)
            res.send(result)


        })

        app.patch("/admin/allclassreject/:id", verifyToken, verifyAdmin, async (req, res) => {

            const acceptStatus = req.body

            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedStatus = {
                $set: {
                    status: acceptStatus.status

                }
            }
            const options = { upsert: true };
            const result = await classCollection.updateOne(filter, updatedStatus, options)
            res.send(result)


        })



        // Adding Class related Info:
        app.post("/teacher/addClass", verifyToken, verifyTeacher, async (req, res) => {
            const classes = req.body;
            const result = await classCollection.insertOne(classes)
            res.send(result)
        })

        app.get("/teacher/myClass/:email", verifyToken, verifyTeacher, async (req, res) => {
            const email = req.params.email;

            const query = { email: email };


            const findClass = await classCollection.find(query).toArray()


            res.send(findClass)
        })

        app.patch("/teacher/updateClass/:email", verifyToken, verifyTeacher, async (req, res) => {
            const data = req.body
            const email = req.params.email;
            const query = { email: email }
            const updateClass = {
                $set: {
                    title: data.title,
                    name: data.name,
                    email: data.email,
                    description: data.description,
                    price: data.price,
                    image: data.image

                }
            }
            const options = { upsert: true };
            const result = await classCollection.updateOne(query, updateClass, options)
            res.send(result);
        })


        app.delete("/teacher/deleteClass/:id", verifyToken, verifyTeacher, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await classCollection.deleteOne(query);
            res.send(result)
        })

        // asisgnments
        app.post("/assignment", verifyToken, verifyTeacher, async (req, res) => {
            const assignment = req.body;
            const result = await assignmentCollection.insertOne(assignment)
            res.send(result)

        })

        // student side 

        // getting class details

        app.get("/student/classDetails/:id", async (req, res) => {
            const id = req.params.id;

            const query = { _id: new ObjectId(id) }

            const classInformation = await classCollection.find(query).toArray();
            res.send(classInformation)


        })

        // enrollment:
        app.post("/student/enroll", async (req, res) => {
            const data = req.body;
            const enroll = await enrollCollection.insertOne(data);
            res.send(enroll)
        })

        // enroll class info:
        app.get("/user/studnet/enrollclass/:email", async (req, res) => {

            const email = req.params.email;
            console.log("enroll", email);

            const result = await enrollCollection
                .aggregate([
                    {
                        $addFields: {
                            menuItemsObjectIds: {

                                $convert: {
                                    input: "$classId",
                                    to: "objectId"

                                }
                            },
                        },
                    },
                    {
                        $lookup: {
                            from: "classs",
                            localField: "menuItemsObjectIds",
                            foreignField: "_id",
                            as: "menuItemsData",
                        },
                    },
                    {
                        $unwind: '$menuItemsData'
                    },

                    {
                        $project: {
                            _id: "$menuItemsData._id",
                            title: "$menuItemsData.title",
                            name: "$menuItemsData.name",
                            image: "$menuItemsData.image",


                        }
                    }
                ])
                .toArray();


            res.send(result)
        })

        // Continue Course:
        app.get("/student/continueCourse/:id", async (req, res) => {
            const classId = req.params.id;
            const query = { classId: classId }

            const result = await assignmentCollection.find(query).toArray()
            res.send(result)
        })

        app.get("/student/doAssignments/:id", async (req, res) => {
            const assignmentId = req.params.id;
            const query = { _id: new ObjectId(assignmentId) }

            const result = await assignmentCollection.find(query).toArray()
            res.send(result)
        })

        app.post("/student/submitAns", async (req, res) => {
            const answer = req.body;
            const result = await assignmentAnsCollection.insertOne(answer);
            res.send(result)

        })


        // evaluate assignments by teacher:

        app.get("/evaluateAssignment", async (req, res) => {

            const result = await assignmentAnsCollection.aggregate([

                {
                    $addFields: {
                        assignmentObjectIds: {

                            $convert: {
                                input: "$assignmentId",
                                to: "objectId"

                            }
                        },
                    },
                },
                {
                    $lookup:{
                        from:"assignments",
                        localField:"assignmentObjectIds",
                        foreignField:"_id",
                        as:"assignmentFromAnswer"

                    }
                },
                {
                    $unwind:"$assignmentFromAnswer"
                },

                {
                    $addFields: {
                        classObjectIds: {

                            $convert: {
                                input: "$assignmentFromAnswer.classId",
                                to: "objectId"

                            }
                        },
                    },
                },
                {
                    $lookup:{
                        from:"classs",
                        localField:"classObjectIds",
                        foreignField:"_id",
                        as:"classFromAssignment"
                    }
                },
                {
                    $unwind:"$classFromAssignment"
                }
              
                
                



            ]).toArray()
            
            res.send(result)

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