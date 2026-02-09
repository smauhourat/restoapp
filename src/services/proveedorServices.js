import apiClient from '../api/client';

const proveedorService = {

    async get() {
        const response = await apiClient.get('/proveedores', {
            params: { page:1, perPage:99999, sortBy:'nombre', order:'asc' }
        });
        return response;        
    },

    async getAll(page = 1, perPage = 10, sortBy = 'nombre', order = 'asc') {
        const response = await apiClient.get('/proveedores', {
            params: { page, perPage, sortBy, order }
        });
        return response;
    },

    async delete(id) {
        const response = await apiClient.delete(`/proveedores/${id}`);
        return response;
    },

    async getById(id) {
        const response = await apiClient.get(`/proveedores/${id}`);
        return response;
    },

    async create(proveedor) {
        const response = await apiClient.post('/proveedores', JSON.stringify(proveedor));
        return response.data;
    },

    async update(id, proveedor) {
        const response = await apiClient.put(`/proveedores/${id}`, JSON.stringify(proveedor));
        return response.data;
    },

    async productos(id) {
        const response = await apiClient.get(`/proveedores/${id}/productos`);
        return response;
    },    

    async getProductoProveedor(proveedorId, productoId) {
        const response = await apiClient.get(`/proveedores/${proveedorId}/productos/${productoId}`);
        console.log('Servicio Producto Proveedor =>', response)
        return response;
    },

    async updateProductoProveedor(proveedorId, productoId, productoProveedor) {
        const response = await apiClient.put(`/proveedores/${proveedorId}/productos/${productoId}`, JSON.stringify(productoProveedor));
        return response.data;
    }   
}

export default proveedorService;