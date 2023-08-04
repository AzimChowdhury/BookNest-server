import cors from 'cors';
require('dotenv').config();
import express, { json } from 'express';
import { MongoClient, ServerApiVersion, ObjectId } from 'mongodb';
const app = express();
const port = process.env.PORT || 5000;

const corsOptions = {
    origin: 'https://boooknest.netlify.app',
};

app.use(cors(corsOptions));
app.use(json());


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
        const Wishlists = client.db("BookNest").collection('wishlists')
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
        app.delete('/book', async (req, res) => {
            const id = req.query.id;
            const email = req.query.user;
            const selectedBook = await Books.findOne({ _id: new ObjectId(id) })
            if (selectedBook.user === email) {
                const result = await Books.deleteOne({ _id: new ObjectId(id) })
                res.send({ status: true, data: result })
            } else {
                res.status(401).json({ status: false, message: 'you are not authorized to delete this book' })
            }
        })

        // update a book
        app.patch('/book/:id', async (req, res) => {
            const id = req.params.id
            const oldBook = await Books.findOne({ _id: new ObjectId(id) })
            const updateDoc = {
                $set: req.body
            }
            if (oldBook.user === req.body.user) {
                const result = await Books.updateOne({ _id: new ObjectId(id) }, updateDoc, { upsert: true })
                res.send({ status: true, data: result })
            } else {
                res.status(401).json({ status: false, message: 'you are not authorized to edit this book' })
            }
        })


        // leave a review
        app.patch('/review/:id', async (req, res) => {
            const id = req.params.id
            const newReview = req.body.review
            const book = await Books.findOne({ _id: new ObjectId(id) })
            book.Reviews.push(newReview)
            const result = await Books.updateOne({ _id: new ObjectId(id) }, { $set: book }, { upsert: true })
            res.send({ status: true, data: result })
        })

        // search on title genre and author
        app.post('/search', async (req, res) => {
            const query = req.query.query
            const result = await Books.find({
                $or: [
                    { Title: { $regex: query, $options: 'i' } },
                    { Genre: { $regex: query, $options: 'i' } },
                    { Author: { $regex: query, $options: 'i' } },
                ],
            }).toArray()
            res.send(result)
        })

        app.post('/wishlist', async (req, res) => {
            const { user, stage, book } = req.body;
            const foundUser = await Wishlists.findOne({ user })
            if (!foundUser) {
                const newData = {
                    user,
                    nowReading: [],
                    willRead: [],
                    alreadyRead: []
                }
                if (stage === "willRead") {
                    newData.willRead.push(book)
                } else if (stage === 'nowReading') {
                    newData.nowReading.push(book)
                } else if (stage === 'alreadyRead') {
                    newData.alreadyRead.push(book)
                }
                const result = await Wishlists.insertOne(newData)
                res.send(result)
            } else {
                if (stage === "willRead") {
                    foundUser.willRead.push(book)
                } else if (stage === 'nowReading') {
                    foundUser.nowReading.push(book)
                } else if (stage === 'alreadyRead') {
                    foundUser.alreadyRead.push(book)
                }
                const result = await Wishlists.updateOne({ user: user }, { $set: foundUser }, { upsert: true })
                res.send(result)
            }
        })


        // get wishlists
        app.get('/wishlist/:email', async (req, res) => {
            const email = req.params.email
            const result = await Wishlists.findOne({ user: email })
            res.send(result)
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
