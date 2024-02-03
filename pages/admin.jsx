import Image from "next/image";
import Head from "next/head";
import Layout from "../layout/Layout";
import Producto from "../components/Producto";
import useMenuMaster from "../hooks/useMenuMaster";
import Categoria from "@/components/Categoria";
import AdminLayout from "@/layout/AdminLayout";
import { useEffect, useState } from "react";
import axios from "axios";// se utiliza para realizar solicitudes HTTP (por ejemplo, solicitudes GET, POST, PUT, DELETE, etc.) desde el lado del cliente
import { getCookie } from "cookies-next";

export default function Admin() {
  const [usuarioActual, setUsuarioActual] = useState({});
  const token = getCookie("_token");

  const getIdUsuario = async () => {
    try {
      const url = "http://localhost:3000/api/decodeToken";
      const response = await axios.post(url, { token });
      getUsuario(response.data.userId);
    } catch (error) {
      /* console.log(error); */
      console.log("Error");
    }
  };

  const getUsuario = async (id) => {
    try {
      const url = `http://localhost:3000/api/usuario/${id}`;
      const response = await axios.get(url);
      /* console.log(response.data); */
      setUsuarioActual(response.data);
    } catch (error) {
      /* console.log(error); */
      console.log("Error");
    }
  };

  useEffect(() => {
    // Obtenemos el rol de usuario para obtener el rol
    getIdUsuario();
  }, []);


  return (
    
    <AdminLayout pagina={"Admin"}>
      <h1 className="text-4xl font-black">Panel de Administrador</h1>
      <p className="text-2xl my-10">Ingresa al panel que deseas ingresar</p>
    </AdminLayout>

  );
}
