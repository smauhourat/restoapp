import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useEffect, useState } from "react";
import { getProducts } from "../lib/api";

import icon from "../assets/icon.png";
import { ProductCard } from "./ProductCard";
import { Logo } from "./Logo";

export function Main() {
  const [productos, setProductos] = useState([]);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    async function fetchProductos() {
      const response = await getProducts();
      setProductos(response);
    }
    fetchProductos();
  }, []);

  return (
    <>
      <View
        style={{
          paddingTop: insets.top,
          flex: 1,
          alignItems: "center",
          paddingBottom: insets.bottom,
        }}
      >
        <Image source={icon} style={{ width: 128, height: 128 }} />
        <Text>Productos disponibles:</Text>
        {ActivityIndicator && productos.length === 0 && (
          <ActivityIndicator size="large" color="#0000ff" />
        )}
        <FlatList
          data={productos.data}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <ProductCard producto={item} />}
        />
        {/* <ScrollView>
        {productos.data &&
        productos.data.map((producto) => (
            <ProductCard key={producto.id} producto={producto} />
            ))}
            </ScrollView> */}
        <StatusBar style="auto" />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ddd",
    // backgroundColor: "#fff"
    /*#1976d2*/ alignItems: "center",
    justifyContent: "center",
  },
  btnPpal: {
    backgroundColor: "#1976d2",
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
  },
});
