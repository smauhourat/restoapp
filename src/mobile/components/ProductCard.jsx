import { StyleSheet, Text, Image } from "react-native";

export function ProductCard({ producto }) {
  return (
    <>
      <Image
        source={{
          uri: `https://picsum.photos/200/300?random=${producto.id}`,
        }}
        style={{ width: 50, height: 50, borderRadius: 10 }}
      />
      <Text style={styles.title}>{producto.nombre}</Text>
      <Text style={styles.score}>${producto.precio_promedio}</Text>
      <Text style={styles.description}>{producto.descricion}</Text>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 42,
  },
  image: {
    width: 107,
    height: 147,
    borderRadius: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#444",
    marginTop: 10,
  },
  description: {
    fontSize: 11,
    color: "#eee",
  },
  score: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#777",
    marginBottom: 25,
  },
});
