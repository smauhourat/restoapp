# Descripcion
App para manejar los **Pedidos** de los **Proveedores** de un Restaurant. En principio un Proveedor tiene muchos **Productos** y un Producto puede ser vendido por uno o mas Proveedores.

La aplicacion deberia poder facilitar al operador la generacion de Pedidos, los mismos son realizados para un Proveedor en particular, tiene una fecha de realizado, un estado (pendiente / enviado / recibido / cancelado), fecha deseada de entrega, y una lista de productos con cantidades.

Una vez creado el pedido con ese encabezado y su lista de Productos se puede visualizar los Pedidos, y enviar al Proveedor, ya sea por Mail o por WhatsApp.

Esta accion de envio deberia quedar registrada de alguna forma, con fecha. y cambiar el estado del Pedido.
Ojota

[https://deepwiki.com/smauhourat/restoapp] (https://deepwiki.com/smauhourat/restoapp)
## Modelo de Base de Datos (Simplificado)

### Tablas y Columnas
**Proveedor**: id, nombre, direccion, telefono, email

**Producto**: id, nombre, descripcion, unidad_medida

**Proveedor_Producto**: proveedor_id, producto_id, precio_unitario, tiempo_entrega

**Pedido**: id, numero_pedido, fecha, proveedor_id, estado, total
**Pedido_Renglon**: id, pedido_id, producto_id, cantidad, precio_unitario, subtotal

**HistorialEnvios**: id, pedido_id, metodo_envio, fecha_envio, destinatario

**NrosPedidos**: id, fecha_generacion, estado, nro_pedido

### Relaciones

**Proveedor**  
  ├──> proveedor_id (FK) → Proveedor_Producto  
  ├──> proveedor_id (FK) → Pedido

**Producto**  
  ├──> producto_id (FK) → Proveedor_Producto  
  ├──> producto_id (FK) → Pedido_Renglon  

**Proveedor_Producto**  
  ├──> proveedor_id (FK) → Proveedor
  ├──> producto_id (FK) → Producto

**Pedido**  
  ├──> proveedor_id (FK) → Proveedor  
  ├──> pedido_id (FK) → Pedido_Renglon  
  ├──> pedido_id (FK) → HistorialEnvios  

**Pedido_Renglon**  
  ├──> pedido_id (FK) → Pedido  
  ├──> producto_id (FK) → Producto  

**HistorialEnvios**  
  ├──> pedido_id (FK) → Pedido  

## TODO:
+ La generacion de un pedido se hace en el tiempo, cuando se baja al deposito y se advierte determinado producto faltante, cuando se esta en la cocina, etc.

+ Algo que podria pensarse es la generacion de un pedido general, y despues cuando se cierra se hace uno por cada proveedor.
+ Sugerir el pedido a un proveedor basado en la historia  


## Documentación de la API
La API está construida con Express.js y utiliza SQLite como base de datos. Todos los endpoints están prefijados con /api y devuelven respuestas en formato JSON.

### Productos (/api/productos)  
```
GET /api/productos
```
*Obtiene una lista paginada de productos.*
+ Parámetros de consulta: page, perPage, sortBy (nombre, descripcion), order (asc, desc), search.  
+ Respuesta: Lista de productos con metadatos de paginación.  

```
GET /api/productos/:id
```
*Obtiene un producto específico por ID.*

```
POST /api/productos
```
*Crea un nuevo producto.*  
+ Body: { nombre, descripcion, unidad_medida }.

```
PUT /api/productos/:id
```
*Actualiza un producto existente.*  
+ Body: { nombre, descripcion, unidad_medida }.

```
DELETE /api/productos/:id
```
*Elimina un producto (solo si no está asociado a proveedores).*

```
POST /api/productos/importar
```
*Importa productos desde un archivo Excel.*
+ Body: Archivo multipart (archivo).

```
POST /api/productos/confirmar-importacion
```
*Confirma la importación de productos.*  
+ Body: { productos: [{ nombre, descripcion, unidad }] }.


### Proveedores (/api/proveedores)

```
GET /api/proveedores
```
*Obtiene una lista paginada de proveedores.*
+ Parámetros de consulta: page, perPage.

```
GET /api/proveedores/:id
```
*Obtiene un proveedor específico por ID.*  

```
POST /api/proveedores
```
*Crea un nuevo proveedor.*
+ Body: { nombre, direccion, telefono, email }.

```
PUT /api/proveedores/:id
```
*Actualiza un proveedor existente.*  
+ Body: { nombre, direccion, telefono, email }.

```
DELETE /api/proveedores/:id
```
*Elimina un proveedor.*  

```
GET /api/proveedores/:id/productos
```
*Obtiene los productos asociados a un proveedor.*  

```
POST /api/proveedores/:id/productos
```
*Asocia un producto a un proveedor.*  
+ Body: { producto_id, precio_unitario, tiempo_entrega }.

```
GET /api/proveedores/:proveedorId/productos/:productoId
```
*Obtiene un producto específico de un proveedor.*  

```
PUT /api/proveedores/:proveedorId/productos/:productoId
```
*Actualiza el precio de un producto para un proveedor.*  
+ Body: { precio_unitario }.

```
DELETE /api/proveedores/:proveedorId/productos/:productoId
```
*Desasocia un producto de un proveedor.*

```
GET /api/proveedores/:id/productos-disponibles
```
*Obtiene productos no asociados a un proveedor.*

### Pedidos (/api/pedidos)

```
GET /api/pedidos
```
*Obtiene una lista paginada de pedidos.*  
+ Parámetros de consulta: page, perPage.

```
POST /api/pedidos
```
*Crea un nuevo pedido.*  
+ Body: { numero_pedido, fecha, proveedor_id, renglones: [{ producto_id, cantidad, precio_unitario }] }.

```
GET /api/pedidos/:id
```
*Obtiene detalles de un pedido específico, incluyendo renglones.*  

```
PATCH /api/pedidos/:id/estado
```
*Actualiza el estado de un pedido.*  
+ Body: { estado }.

```
POST /api/pedidos/:id/envios
```
*Registra un envío para un pedido.*  
+ Body: { metodo_envio, destinatario }.

```
GET /api/pedidos/:id/envios
```
*Obtiene el historial de envíos de un pedido.*

```
POST /api/pedidos/nropedido
```
*Genera un nuevo número de pedido.*

### Estadísticas (/api/stats)

```
GET /api/stats/dashboard
```
*Obtiene estadísticas generales del dashboard (totales de proveedores, productos, pedidos, etc.).*
<br>
<br>

# NOTAS INTERNAS

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


### DB - SQLite
SQLite Studio


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