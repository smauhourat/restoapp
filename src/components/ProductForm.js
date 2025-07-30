import { useState } from 'react';

export const ProductForm = ({ onSubmit, initialValues }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: '',
        suggestedPrice: initialValues.suggestedPrice || 0
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="form-group">
                <label>Nombre del Producto</label>
                <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                />
            </div>

            <div className="form-group">
                <label>Descripción</label>
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                />
            </div>

            <div className="form-group">
                <label>Categoría</label>
                <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                />
            </div>

            <div className="form-group">
                <label>Precio Sugerido</label>
                <input
                    type="number"
                    name="suggestedPrice"
                    value={formData.suggestedPrice}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    required
                />
            </div>

            <button type="submit">Crear Producto</button>
        </form>
    );
  };