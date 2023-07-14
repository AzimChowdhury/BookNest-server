require('dotenv').config();
const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

const cors = require('cors');

app.use(cors());
app.use(express.json());


const client = new MongoClient(process.env.DB_URI, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

async function run() {
    try {
        await client.connect();
        const Books = client.db("BookNest").collection('books')
        console.log("successfully connected to MongoDB!");


        // get all books
        app.get('/books', async (req, res) => {
            const result = await Books.find().toArray()
            res.send({ status: true, data: result })
        })

        // get a single book
        app.get('/book/:id', async (req, res) => {
            const id = req.params.id
            const result = await Books.findOne({ _id: new ObjectId(id) });
            res.send({ status: true, data: result })
        })

        // add a new book
        app.post('/book', async (req, res) => {
            const newBook = req.body;
            const result = await Books.insertOne(newBook)
            res.send({ status: true, data: result })
        })

        // delete a book
        app.delete('/book/:id', async (req, res) => {
            const id = req.params.id;
            const result = await Books.deleteOne({ _id: new ObjectId(id) })
            res.send({ status: true, data: result })
        })

        // update a book
        app.patch('/book/:id', async (req, res) => {
            const id = req.params.id
            const updateDoc = {
                $set: req.body
            }
            const result = await Books.updateOne({ _id: new ObjectId(id) }, updateDoc, { upsert: true })
            res.send({ status: true, data: result })
        })





    } finally {
        // await client.close();
    }
}


run().catch(console.dir);





app.get('/', (req, res) => {
    res.send('server running ');
});



app.listen(port, () => {
    console.log(`server running on the port -  ${port}`);
});
