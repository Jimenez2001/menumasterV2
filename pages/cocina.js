import useSWR from "swr"; //Importamos swr que nos permite consultar en tiempo real la api de ordenes
import axios from "axios"; // se utiliza para realizar solicitudes HTTP (por ejemplo, solicitudes GET, POST, PUT, DELETE, etc.) desde el lado del cliente
import CocinaLayout from "../layout/CocinaLayout";
import Orden from "../components/Orden"; //Para mandar a llamar el componente Orden
import { getCookie } from "cookies-next";
import Image from "next/image"; //Importamos las imagenes para poder verlas en el panel de cocina
import { useEffect, useState } from "react";

export default function Cocina() {
  const fetcher = () => axios.get("/api/ordenes").then((datos) => datos.data); //Usamos axios para hacer la consulta a la API get de la data de las ordenes
  const { data, error, isLoading } = useSWR("/api/ordenes", fetcher, {
    refreshInterval: 100,
  }); //Retorna los datos de la consulta, tambien algún error y también muestra contenido antes de la nueva consulta y mandamos a llamar la funcion fetcher
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

  //EJECUTA LA FUNCION GET MESAS
  useEffect(() => {
    // 5
    getIdUsuario();
  }, []);
  /* console.log(data);
    console.log(error);
    console.log(isLoading); */

  return (
    <CocinaLayout pagina={"Cocina"}>
      <h1 className="text-4xl font-black">Panel de Cocina</h1>
      <p className="text-2xl my-10">Revisa las ordenes</p>

      {data && data.length ? (
        data.map(
          (
            orden //Aqui mostramos si hay ordenes
          ) => <Orden key={orden.id} orden={orden} />
        )
      ) : (
        <p>No hay ordenes pendientes</p>
      )}
    </CocinaLayout>
  );
}
