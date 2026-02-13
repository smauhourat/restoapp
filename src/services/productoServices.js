import apiClient from '../api/client';

const productService = {

    async getProducts() {
        const response = await apiClient.get('/productos', {
            params: { page:1, perPage:100, sortBy:'nombre', order:'asc' }
        });
        return response;        
    },

    async getAll(page = 1, perPage = 10, sortBy = 'nombre', order = 'asc', search = '') {
        const response = await apiClient.get('/productos', {
            params: { page, perPage, sortBy, order, search }
        });
        return response;
    },

    async delete(id) {
        const response = await apiClient.delete(`/productos/${id}`);
        return response;
    },

    async getById(id) {
        const response = await apiClient.get(`/productos/${id}`);
        return response;
    },

    async create(producto) {
        const response = await apiClient.post('/productos', JSON.stringify(producto));
        return response.data;
    },

    async update(id, producto) {
        const response = await apiClient.put(`/productos/${id}`, JSON.stringify(producto));
        return response.data;
    },

    async getProveedoresByProductoId(id) {
        const response = await apiClient.get(`/productos/${id}/proveedores`);
        console.log('Respuesta de proveedores:', response);
        return response;
    }
}

export default productService;