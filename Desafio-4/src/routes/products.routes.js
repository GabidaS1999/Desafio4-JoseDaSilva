import ProductManager from '../Product-Manager.js';
let productManager = new ProductManager();



import { Router } from "express"

const router = Router();

let products = await productManager.getProducts();

router.get('/home', (req, res) => {
    res.render('home', {
        products
    })
})
router.get('/realtimeproducts', (req, res) => {
    res.render('realTimeProducts')
});




router.get('/', async (req, res) => {

    let todosLosProductos = await productManager.getProducts();

    let limit = parseInt(req.query.limit);
    if (!isNaN(limit) && limit > 0) {
        let productosLimitados = todosLosProductos.slice(0, limit);
        res.send(productosLimitados);
    } else {
        res.json(todosLosProductos);
    }
})

router.get('/:pid', async (req, res) => {
    let todosLosProductos = await productManager.getProducts();
    let { pid } = req.params;

    const producto = todosLosProductos.find(p => p.id == parseInt(pid))
    if (producto) {
        res.json({ producto })
    } else {
        res.send({ msg: "Producto no encontrado" })
    }


})



router.post('/realtimeproducts', async (req, res) => {
    const socket = req.io;

    try {
        const product = req.body;
        const numRandom = Math.floor(Math.random() * 100 + 1);
        product.id = numRandom;

        if (!product.title || !product.description || !product.code || !product.price || !product.stock || !product.category || !product.thumbnails) {
            return res.status(400).send({ status: 'error', msg: 'Valores incompletos, revisar datos' });
        }

        const codeExists = await productManager.getProductByCode(product.code);
        if (codeExists) {
            return res.status(400).send({ status: 'error', msg: 'Código de producto duplicado' });
        }

        await productManager.addProduct(product.title, product.description, product.price, product.thumbnails, product.code, product.stock);
        socket.emit('newProduct', product);
        res.send({ status: 'success', msg: `Producto creado` });

    } catch (error) {
        console.error(`Error al agregar un nuevo producto: ${error}`);
        res.status(500).send({ status: 'error', error: 'Error al agregar un nuevo producto' });
    }
});

router.put('/:pid', async (req, res) => {

    let productId = parseInt(req.params.pid)
    let productUpdate = req.body

    const productPosition = products.findIndex((p => p.id === productId));
    if (productPosition < 0) {
        return res.status(202).send({ status: "info", error: "Producto no encontrado" });
    }
    products[productPosition] = productUpdate;

    try {
        await productManager.updateProduct(productId, products[productPosition])
        res.send({ status: "success", msg: "Producto actualizado", datos: products[productPosition] });
    } catch (error) {
        console.error(`Error al escribir en el archivo JSON: ${error}`);
        res.status(500).send({ status: "error", error: "Error al actualizar el archivo JSON" });
    }
})

router.delete('/realtimeproducts/:pid', async (req, res) => {
    const socket = req.io;
    const productId = parseInt(req.params.pid);

    try {
        const productPosition = products.findIndex((p) => p.id === productId);

        


        products.splice(productPosition, 1);
        await productManager.deleteProduct(productId);
        const updatedProducts = await productManager.getProducts();
        socket.emit('products', updatedProducts);
        res.send({ status: "success", msg: "Producto eliminado" });
    } catch (error) {
        console.error(`Error al eliminar el producto: ${error}`);
        res.status(500).send({ status: "error", error: "Error al eliminar el producto" });
    }
});



export default router;