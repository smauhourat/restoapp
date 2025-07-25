# Descripcion
La idea es tener un App para manejar los **Pedidos** de los **Proveedores** de un Restaurant. En principio un Proveedor tiene muchos **Productos** y un Producto puede ser vendido por uno o mas Proveedores.

La aplicacion deberia poder facilitar al operador la generacion de Pedidos, los mismos son realizados para un Proveedor en particular, tiene una fecha de realizado, un estado (pendiente / enviado / recibido / cancelado), fecha deseada de entrega??

Una vez creado el pedido con ese encabezado y una lista de Productos se puede visualizar los Pedidos, y **enviar al Proveedor, ya sea por Mail o por WhatsApp**.

Esta accion de envio deberia quedar registrada de alguna forma, con fecha. y cambiar el estado del Pedido.



develop

## Project
This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)




### TODO


GET /api/stats/products

```
{
  "products_by_category": [
    {"category": "Electrónicos", "count": 320},
    {"category": "Hogar", "count": 150}
  ],
  "low_stock_products": 18,
  "out_of_stock_products": 5,
  "average_price": 45.99,
  "most_expensive_product": {
    "id": 789,
    "name": "Laptop Premium",
    "price": 1299.99
  }
}
```


GET /api/stats/suppliers

```
{
  "suppliers_by_region": [
    {"region": "Norte", "count": 15},
    {"region": "Sur", "count": 10}
  ],
  "top_suppliers": [
    {
      "supplier_id": 23,
      "name": "TecnoSuministros",
      "product_count": 85,
      "last_order_date": "2023-11-15"
    }
  ],
  "average_lead_time": 7.5
}

```


GET /api/stats/orders?timeframe=monthly

**Parámetros opcionales:**

    - timeframe (daily, weekly, monthly, yearly)

    - start_date & end_date (para rangos personalizados)

```
{
  "total_orders": 568,
  "total_revenue": 284500.75,
  "average_order_value": 500.88,
  "orders_by_status": {
    "completed": 420,
    "pending": 45,
    "cancelled": 23
  },
  "order_trends": [
    {"period": "Ene", "count": 45, "revenue": 22500.00},
    {"period": "Feb", "count": 52, "revenue": 26000.00}
  ]
}
```

GET /api/stats/suppliers/{supplierId}/performance

```
{
  "supplier_id": 23,
  "name": "TecnoSuministros",
  "total_products_supplied": 85,
  "total_orders": 42,
  "total_revenue_generated": 125000.50,
  "order_fulfillment_rate": 0.98,
  "average_delivery_time": 3.2,
  "products": [
    {
      "product_id": 456,
      "name": "Teclado inalámbrico",
      "units_sold": 125,
      "revenue": 6250.00
    }
  ]
}
```