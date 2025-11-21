import apiClient from '../api/client';

const pedidoService = {

    async getPedidos() {
        const response = await apiClient.get('/pedidos', {
            params: { page:1, perPage:100, sortBy:'nombre', order:'asc' }
        });
        return response;        
    },

    async getAll(page = 1, perPage = 10, sortBy = 'numero_pedido', order = 'asc', search = '') {
        const response = await apiClient.get('/pedidos', {
            params: { page, perPage, sortBy, order, search }
        });
        return response;
    },

    async delete(id) {
        const response = await apiClient.delete(`/pedidos/${id}`);
        return response;
    },

    async getById(id) {
        const response = await apiClient.get(`/pedidos/${id}`);
        return response;
    },

    async create(pedido) {
        console.log('Creando pedido =>', pedido);
        const response = await apiClient.post('/pedidos', JSON.stringify(pedido));
        return response.data;
    },

    async update(id, producto) {
        const response = await apiClient.put(`/pedidos/${id}`, JSON.stringify(producto));
        return response.data;
    },

    async updateEstado(id, estado) {
        const response = await apiClient.patch(`/pedidos/${id}/estado`, JSON.stringify({ estado }));
        return response.data;
    },

    async getNroPedido() {
        const response = await apiClient.post('/pedidos/nropedido');
        return response;
    }
}

export default pedidoService;