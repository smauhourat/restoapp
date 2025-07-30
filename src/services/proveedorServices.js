import apiClient from '../api/client';

const proveedorService = {

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
    }
}

export default proveedorService;