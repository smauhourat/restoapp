import React, { useState, useEffect } from 'react';
//import ProductList, ProductForm, ProductAssignmentList } from './';
import { ProductList } from './ProductList.js';
import { ProductForm } from './ProductForm.js';
import { ProductAssignmentList } from './ProductAssignmentList.js';    

import proveedorService from '../services/proveedorServices';
import productoService from '../services/productoServices';
import { Dialog } from '@mui/material';

const ProductSupplierAssignment = () => {
    const [supplier, setSupplier] = useState(null);
    const [products, setProducts] = useState([]);
    const [assignedProducts, setAssignedProducts] = useState([]);
    const [showProductForm, setShowProductForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Cargar datos iniciales
    useEffect(() => {
        const loadInitialData = async () => {
            const supplierData = await proveedorService.getSupplier(1);
            const productsData = await productoService.getProducts();
            //console.log('productsData:', productsData.data);
            const assignedData = await proveedorService.getSupplierProducts(1);
            console.log('assignedData:', assignedData);

            setSupplier(supplierData.data);
            setProducts(productsData.data);
            setAssignedProducts(assignedData);
        };

        loadInitialData();
    }, []);

    // Filtrar productos no asignados
    const unassignedProducts = products.filter(product =>
        !assignedProducts.some(ap => ap.productId === product.id) &&
        product.nombre.toLowerCase().includes(searchTerm?.toLowerCase())
    );

    const handleAssignProduct = (productId, price) => {
        const productToAssign = products.find(p => p.id === productId);

        setAssignedProducts([...assignedProducts, {
            productId,
            name: productToAssign.name,
            price,
            supplierId: supplier.id
        }]);
    };

    const handleRemoveAssignment = (productId) => {
        setAssignedProducts(assignedProducts.filter(ap => ap.productId !== productId));
    };

    const handleCreateProduct = async (newProduct) => {
        // const createdProduct = await api.createProduct(newProduct);
        // setProducts([...products, createdProduct]);
        setShowProductForm(false);

        // Opcional: asignar automáticamente el nuevo producto
        //handleAssignProduct(createdProduct.id, newProduct.suggestedPrice || 0);
    };

    const handleSaveAssignments = async () => {
        //await api.updateSupplierProducts(supplier.id, assignedProducts);
        // Mostrar feedback de éxito
    };

    return (
        <div className="product-supplier-assignment">
            <h1>Asignar Productos a {supplier?.name}</h1>

            <div className="assignment-container">
                {/* Sección de productos asignados */}
                <div className="assigned-products">
                    <h2>Productos Asignados</h2>
                    <ProductAssignmentList
                        items={assignedProducts}
                        onRemove={handleRemoveAssignment}
                        onUpdatePrice={(productId, newPrice) => {
                            setAssignedProducts(assignedProducts.map(ap =>
                                ap.productId === productId ? { ...ap, price: newPrice } : ap
                            ));
                        }}
                    />
                    <button onClick={handleSaveAssignments}>Guardar Asignaciones</button>
                </div>

                {/* Sección para buscar y asignar productos */}
                <div className="assign-products">
                    <h2>Asignar Nuevos Productos</h2>
                    <div className="search-bar">
                        <input
                            type="text"
                            placeholder="Buscar productos..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {unassignedProducts.length > 0 ? (
                        <ProductList
                            items={unassignedProducts}
                            onAssign={handleAssignProduct}
                        />
                    ) : (
                        <p>No se encontraron productos o todos están asignados</p>
                    )}

                    <button onClick={() => setShowProductForm(true)}>
                        Crear Nuevo Producto
                    </button>
                </div>
            </div>

            {/* Modal para crear nuevo producto */}
            {showProductForm && (
                <Dialog onClose={() => setShowProductForm(false)}>
                    <ProductForm
                        onSubmit={handleCreateProduct}
                        initialValues={{ suggestedPrice: 0 }}
                    />
                </Dialog>
            )}
        </div>
    );
};

export default ProductSupplierAssignment;