export const ProductAssignmentList = ({ items, onRemove, onUpdatePrice }) => {
    return (
        <ul className="assignment-list">
            {items.map(item => (
                <li key={item.productId}>
                    <span>{item.name}</span>
                    <input
                        type="number"
                        value={item.price}
                        onChange={(e) => onUpdatePrice(item.productId, parseFloat(e.target.value))}
                        min="0"
                        step="0.01"
                    />
                    <button onClick={() => onRemove(item.productId)}>Eliminar</button>
                </li>
            ))}
        </ul>
    );
  };