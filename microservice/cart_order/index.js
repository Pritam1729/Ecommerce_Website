const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    console.log(req.path, req.method);
    next();
});

const schema = mongoose.Schema;
const prodschema = new schema({
    product: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        default: 1
    }
});

const cartschema = new schema({
    products: [prodschema],
    total: Number
}, { timestamps: true });

const historyschema = new schema({
    user: {
        type: String,
        required: true,
        unique: true
    },
    curr_cart: {
        type: [prodschema],
    },
    cart_history: {
        type: [cartschema],
        default: []
    }
});

const singleprod = mongoose.model('singleprod', prodschema);
const userhistory = mongoose.model('userhistory', historyschema);
const listofprods = mongoose.model('listofprods', cartschema);

app.get('/', async (req, res) => {
    try {
        res.json({ message: "Hello from uc3" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/addcart', async (req, res) => {
    try {
        const { user, id, quan } = req.body;
        const temp = new singleprod({ product: id, quantity: quan });
        const uresult = await userhistory.findOneAndUpdate({ user: user }, { $push: { curr_cart: temp } });
        if (uresult) {
            res.status(200).json(id);
        } else {
            const cresult = await userhistory.create({ user: user, curr_cart: [temp] });
            res.status(200).json(id);
        }
        console.log("added product to cart");
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/delcart', async (req, res) => {
    try {
        const { user, id } = req.body;
        const uresult = await userhistory.findOneAndUpdate({ user: user }, { $pull: { curr_cart: { product: id } } });
        res.status(200).json(uresult);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/buy', async (req, res) => {
    try {
        const { user, ctotal } = req.body;
        const uresult = await userhistory.find({ user: user });
        const temp = new listofprods({ products: [...uresult[0].curr_cart], total: ctotal });
        const nresult = await userhistory.findOneAndUpdate({ user: user }, { curr_cart: [], $push: { cart_history: temp } });
        res.status(200).json(nresult);
        console.log("shifted items from current cart to cart history");
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/getcart/:user', async (req, res) => {
    try {
        const user = req.params.user;
        const uresult = await userhistory.findOne({ user: user });
        if (!uresult) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json(uresult.curr_cart);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/history/:user', async (req, res) => {
    try {
        const user = req.params.user;
        const uresult = await userhistory.findOne({ user: user });
        if (!uresult) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json(uresult.cart_history);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

mongoose.connect("mongodb+srv://pritamgurav95272:Nt3zmHAuIWan3hdO@cluster0.xxzqufh.mongodb.net/")
    .then(() => {
        app.listen(5003, () => console.log("uc3 running"));
    }).catch((error) => {
        console.log(error);
    });
