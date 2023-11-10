import Head from "next/head";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { setCookie } from "cookies-next";
import useMenuMaster from "../hooks/useMenuMaster";
import { useRouter } from "next/router";
import axios from "axios";
import Swal from "sweetalert2";
import { Router } from "next/router";
import Modal from "react-modal";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getCookie } from "cookies-next";
import { deleteCookie } from "cookies-next";
import { formatDate } from "@/helpers";
import { format, parseISO } from "date-fns";
import { startOfDay, endOfDay } from "date-fns";
import jsPDF from "jspdf";
import "jspdf-autotable";

export default function Venta() {
  const router = useRouter();
  const [ventas, setVentas] = useState([]);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [editedUserData, setEditedUserData] = useState({
    username: "",
    email: "",
    password: "",
    rol_id: "",
  });
  const token = getCookie("_token");
  const [loading, setLoading] = useState(false);
  const [usuarioActual, setUsuarioActual] = useState({});
  const isAdmin = usuarioActual?.rol?.rol === "administrador";
  const isCajero = usuarioActual?.rol?.rol === "cajero";

  const [fechaInicio, setFechaInicio] = useState(null);
  const [fechaFin, setFechaFin] = useState(null);
  const [ventasFiltradas, setVentasFiltradas] = useState([]);
  const [filtroActivo, setFiltroActivo] = useState(false);

  const getIdUsuario = async () => {
    try {
      const url =
        "https://menumasterv2-production.up.railway.app/api/decodeToken";
      const response = await axios.post(url, { token });
      await getUsuario(response.data.userId);
    } catch (error) {
      /* console.log(error); */
      console.log("Error");
    }
  };

  const getUsuario = async (id) => {
    try {
      /* console.log(id); */
      const url = `https://menumasterv2-production.up.railway.app/api/usuario/${id}`;
      const response = await axios.get(url);
      /* console.log(response.data); */
      setUsuarioActual(response.data);
    } catch (error) {
      /* console.log(error); */
      console.log("Error");
    }
  };

  const obtenerImagenRol = () => {
    if (usuarioActual?.rol?.rol === "administrador") {
      return "/assets/img/administrador.png";
    } else if (usuarioActual?.rol?.rol === "cajero") {
      return "/assets/img/cajero.png";
    } else if (usuarioActual?.rol?.rol === "coinero") {
      return "/assets/img/cocinero.png";
    } else if (usuarioActual?.rol?.rol === "mesero") {
      return "/assets/img/mesero.png";
    } else {
      return "/assets/img/user.png";
    }
  };

  useEffect(() => {
    getIdUsuario();
  }, []);

  useEffect(() => {
    if (!token) {
      setLoading(true);
      const timeout = setTimeout(() => {
        router.push("/");
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [token, router]);

  /* useEffect(() => {
    obtenerVentas();
  }, [fechaInicio, fechaFin]); */

  const filtrarPorFecha = () => {
    const ventasFiltradas = ventas.filter((venta) => {
      const fechaVenta = parseISO(venta.fechaVenta); // Parsea la fecha de la base de datos
      const fechaInicioFiltro = fechaInicio
        ? startOfDay(parseISO(fechaInicio))
        : null;
      const fechaFinFiltro = fechaFin ? endOfDay(parseISO(fechaFin)) : null;

      // Ajustar la zona horaria a UTC+6
      const fechaVentaUTC6 = new Date(
        fechaVenta.getTime() + 6 * 60 * 60 * 1000
      );

      if (fechaInicioFiltro && fechaVentaUTC6 < fechaInicioFiltro) {
        return false;
      }

      if (fechaFinFiltro && fechaVentaUTC6 > fechaFinFiltro) {
        return false;
      }

      return true;
    });

    setVentasFiltradas(ventasFiltradas);
  };

  useEffect(() => {
    axios
      .get("/api/ventas/ventas")
      .then((response) => {
        setVentas(response.data);
        setVentasFiltradas(response.data);
      })
      .catch((error) => {
        console.error("Error al obtener las ventas:", error);
      });
  }, []);

  const limpiarFiltro = () => {
    setFiltroActivo(false);
    setVentasFiltradas(ventas);
  };

  // Función para generar el PDF de las ventas filtradas
  const generarPDFVentasFiltradas = () => {
    // Crear un nuevo documento PDF
    const pdf = new jsPDF();

    // Agregar una imagen como un logo
    const logoImage = "/assets/img/logomilo.jpeg";
    pdf.addImage(logoImage, "PNG", 10, 10, 50, 30);

    // Configuración del PDF
    pdf.text("Reporte de Ventas", 10, 55);

    // Calcular el total global y el número de artículos
    let totalGlobal = 0;
    let numeroArticulos = 0;

    // Calcular la cantidad total de productos
    let cantidadTotalProductos = 0;

    // Configurar la tabla
    const tableData = ventasFiltradas.map((venta) => {
      const productosInfo = venta.pedido.map((producto) => {
        numeroArticulos += producto.cantidad;
        totalGlobal += producto.cantidad * producto.precio;
        cantidadTotalProductos += producto.cantidad; // Agregar la cantidad del producto
        return `${producto.cantidad} ${producto.nombre} Precio: ${producto.precio}`;
      });

      return [
        venta.id,
        venta.noPedido,
        venta.mesa,
        formatDate(venta.fechaVenta),
        productosInfo.join("\n"),
        venta.total,
      ];
    });

    // Agregar la tabla al PDF
    pdf.autoTable({
      startY: 60, // Ajusta la posición inicial para dejar espacio para el logo
      head: [
        [
          "No. Venta",
          "No. Orden",
          "No. Mesa",
          "Fecha Venta",
          "Productos",
          "Total",
        ],
      ],
      body: tableData,
    });

    // Agregar el total de ventas, el total de productos y el total global
    pdf.text(
      `Total Ventas: ${ventasFiltradas.length}`,
      10,
      pdf.autoTable.previous.finalY + 10
    );
    pdf.text(
      `Total Artículos: ${numeroArticulos}`,
      10,
      pdf.autoTable.previous.finalY + 20
    );
    pdf.text(
      `Total Global: ${totalGlobal.toFixed(2)}`,
      10,
      pdf.autoTable.previous.finalY + 30
    );
    pdf.text(
      `Cantidad Total de Productos: ${cantidadTotalProductos}`,
      10,
      pdf.autoTable.previous.finalY + 40
    );

    // Guardar o mostrar el PDF
    pdf.save("ventas_filtradas.pdf");
  };

  const mostrarVentasMasRecientes = () => {
    // Ordena las ventas por fecha de venta de forma descendente (más recientes primero)
    const ventasRecientes = [...ventasFiltradas].sort(
      (a, b) => new Date(b.fechaVenta) - new Date(a.fechaVenta)
    );
    setVentasFiltradas(ventasRecientes);
  };

  const mostrarVentasMasAntiguas = () => {
    // Ordena las ventas por fecha de venta de forma ascendente (más antiguas primero)
    const ventasAntiguas = [...ventasFiltradas].sort(
      (a, b) => new Date(a.fechaVenta) - new Date(b.fechaVenta)
    );
    setVentasFiltradas(ventasAntiguas);
  };

  const handleLogout = () => {
    deleteCookie("_token");
    router.push("/");
  };

  return (
    <>
      {loading ? (
        <div className="flex flex-col justify-center items-center min-h-screen bg-yellow-400">
          <div className="spinner">
            <div className="dot1"></div>
            <div className="dot2"></div>
          </div>
          <p className="font-bold uppercase text-white">Redirigiendo.....</p>
        </div>
      ) : (
        <>
          {usuarioActual?.rol?.rol === "cajero" ||
          usuarioActual?.rol?.rol === "administrador" ? (
            <>
              <Head>
                <title>Parrillada - Venta</title>
                <meta name="description" content="MenuMaster Parrillada" />
              </Head>
              <aside className="md:w-4/12 xl:w-1/4 2xl:w-1/5 py-5">
                <Image
                  width={300}
                  height={100}
                  src="/assets/img/logomilo.jpeg"
                  alt="imagen logotipo"
                  className="mx-auto"
                />
                <Image
                  width={100}
                  height={100}
                  src={obtenerImagenRol()}
                  alt="imagen rol"
                  className="mx-auto"
                />
                <p className="text-lg font-bold text-center">
                  Bienvenido: {usuarioActual?.username}
                </p>
                <p className="text-lg text-center">{usuarioActual?.email}</p>
                <p className="text-lg font-bold uppercase text-center">
                  {usuarioActual?.rol?.rol}
                </p>
                <button
                  onClick={() => router.push("/admin")}
                  className={`w-full gap-x-4 cursor-pointer px-5 py-2 mt-5 font-bold uppercase rounded ${
                    isAdmin
                      ? "bg-yellow-500 hover:bg-yellow-400 text-white"
                      : "hidden"
                  }`}
                >
                  <span className="font-black">Regresar</span>
                </button>
                <button
                  onClick={() => router.push("/caja")}
                  className={`w-full gap-x-4 cursor-pointer px-5 py-2 mt-5 font-bold uppercase rounded ${
                    isCajero
                      ? "bg-yellow-500 hover:bg-yellow-400 text-white"
                      : "hidden"
                  }`}
                >
                  <span className="font-black">Regresar Caja</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full gap-x-4 cursor-pointer text-white p-2 transition-colors duration-300 bg-red-500 hover:bg-red-400
          px-5 py-2 mt-5 font-bold uppercase rounded"
                >
                  <span className="font-black">Cerrar Sesión</span>
                </button>
                <div className="mt-5">
                  <label className="text-black font-bold">Fecha Inicio:</label>
                  <input
                    type="date"
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="border p-1"
                  />
                </div>
                <div className="mt-2">
                  <label className="text-black font-bold">Fecha Fin:</label>
                  <input
                    type="date"
                    onChange={(e) => setFechaFin(e.target.value)}
                    className="border p-1"
                  />
                </div>
                <button
                  onClick={filtrarPorFecha}
                  className="w-full bg-green-500 hover:bg-green-400 text-white mt-5 p-2 font-bold uppercase rounded"
                >
                  Filtrar por Fecha
                </button>
                <button
                  onClick={limpiarFiltro}
                  className="w-full bg-blue-500 hover:bg-blue-400 text-white mt-5 p-2 font-bold uppercase rounded"
                >
                  Limpiar Filtro
                </button>
              </aside>

              <div className="flex flex-col items-center justify min-h-screen">
                <h1 className="text-4xl font-black">Ventas Registradas</h1>

                <div className="container p-10 w-full bg-white rounded-lg shadow-md">
                  <div className="flex justify-between">
                    <button
                      onClick={mostrarVentasMasRecientes}
                      className="bg-green-500 hover:bg-green-400 text-white p-2 font-bold uppercase rounded"
                    >
                      Mostrar Más Recientes
                    </button>
                    <button
                      onClick={mostrarVentasMasAntiguas}
                      className="bg-yellow-500 hover:bg-yellow-400 text-white p-2 font-bold uppercase rounded"
                    >
                      Mostrar Más Antiguas
                    </button>
                  </div>
                  <button
                    onClick={generarPDFVentasFiltradas}
                    className="w-full bg-blue-500 hover:bg-blue-400 text-white mt-5 p-2 font-bold uppercase rounded"
                  >
                    Generar PDF de Ventas
                  </button>
                  <h2 className="text-xl font-bold text-amber-500">
                    Información de las Ventas
                  </h2>
                  <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400 border border-black">
                      <thead className="font-bold uppercase shadow-md w-fulls bg-yellow-50 dark:bg-amber-500 dark:text-white">
                        <tr className="border-b border-black">
                          <th
                            scope="col"
                            className="px-6 py-3 border-r border-black"
                          >
                            No. Venta
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 border-r border-black"
                          >
                            No. Orden
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 border-r border-black"
                          >
                            No. Mesa
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 border-r border-black"
                          >
                            Fecha Venta
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 border-r border-black"
                          >
                            Productos
                          </th>
                          <th scope="col" className="px-6 py-3">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black">
                        {ventasFiltradas.map((venta, index) => (
                          <tr
                            key={index}
                            className="dark:bg-amber-100 dark:border-gray-700 border-b border-black"
                          >
                            <td className="px-4 py-2 sm:px-6 sm:py-4 text-lg font-semibold uppercase border-r border-black text-black">
                              {venta.id}
                            </td>
                            <td className="px-4 py-2 sm:px-6 sm:py-4 text-lg border-r border-black text-black">
                              {venta.noPedido}
                            </td>
                            <td className="px-4 py-2 sm:px-6 sm:py-4 text-lg border-r border-black text-black">
                              {venta.mesa}
                            </td>
                            <td className="px-4 py-2 sm:px-6 sm:py-4 text-lg uppercase border-r border-black text-black">
                              {formatDate(venta.fechaVenta)}
                            </td>
                            <td className="px-4 py-2 sm:px-6 sm:py-4 text-lg border-r border-black text-black">
                              {venta.pedido.map((producto, idx) => (
                                <div key={idx} className="space-y-2">
                                  <div className="text-lg font-semibold text-black">
                                    {producto.cantidad} {producto.nombre}
                                  </div>
                                  <div className="text-lg text-black">
                                    Precio: {producto.precio}
                                  </div>
                                </div>
                              ))}
                            </td>
                            <td className="px-4 py-2 sm:px-6 sm:py-4 text-lg border-r border-black text-black font-semibold">
                              {venta.total}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <footer className="bg-gray-800 text-white py-4">
                <div className="container mx-auto text-center">
                  <p>
                    &copy; {new Date().getFullYear()} MenuMaster. Todos los
                    derechos reservados.
                  </p>
                </div>
              </footer>
            </>
          ) : (
            <div className="flex flex-col justify-center items-center min-h-screen bg-yellow-400">
              <div className="spinner">
                <div className="dot1"></div>
                <div className="dot2"></div>
              </div>
              <p className="font-bold uppercase text-white">
                Redirigiendo.....
              </p>
            </div>
          )}
        </>
      )}
    </>
  );
}
