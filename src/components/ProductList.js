import { useState } from 'react';

export const ProductList = ({ items, onAssign }) => {
    const [prices, setPrices] = useState({});

    const handlePriceChange = (productId, value) => {
        setPrices({ ...prices, [productId]: value });
    };

    return (
        <ul className="product-list">
            {items.map(product => (
                <li key={product.id}>
                    <span>{product.name}</span>
                    <input
                        type="number"
                        placeholder="Precio"
                        value={prices[product.id] || ''}
                        onChange={(e) => handlePriceChange(product.id, e.target.value)}
                        min="0"
                        step="0.01"
                    />
                    <button
                        onClick={() => onAssign(product.id, parseFloat(prices[product.id] || 0))}
                        disabled={!prices[product.id]}
                    >
                        Asignar
                    </button>
                </li>
            ))}
        </ul>
    );
  };