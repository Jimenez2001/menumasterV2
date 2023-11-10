import axios from "axios";
import { useEffect, useState } from "react";
import CajaLayout from "@/layout/CajaLayout";
import Modal from "../components/Modal";
import Image from "next/image"; //Importamos las imagenes para poder verlas en el panel de cocina
import { toast } from "react-toastify"; //Para usar las alertas toastify
import Swal from "sweetalert2"; //Importamos los sweet alert
import eliminarOrden from "./api/ordenes/delete/[id]";
import { router } from "next/router";
import jsPDF from "jspdf";
import { useRef } from "react";

// 1
import { getCookie } from "cookies-next";

export default function caja() {
  const [mesas, setMesas] = useState([]);
  const [ordenes, setOrdenes] = useState([]); //Enviamos ordenes
  const [showModal, setShowModal] = useState(false); //Para abrir y cerrar modal
  const modalRef = useRef(null);
  // 2
  const [usuarioActual, setUsuarioActual] = useState({});

  // 3
  const token = getCookie("_token");

  // 4
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

  // PARA OBTENER LAS MESAS EXISTENTES
  const getMesas = async () => {
    try {
      const url = "http://localhost:3000/api/mesas/mesas";
      const { data } = await axios(url);
      setMesas(data);
    } catch (error) {
      /* console.log(error); */
      console.log("Error");
    }
  };

  //PARA MOSTRAR LA INFORMACIÓN DE LA ORDEN DE LA MESA SELECCIONADA
  const getOrdenes = async (id) => {
    try {
      const url = `http://localhost:3000/api/ordenes/mesas/${id}`;
      const { data } = await axios(url);
      /* console.log(data); */
      setOrdenes(data);
    } catch (error) {
      /* console.log(error); */
      console.log("Error");
    }
  };

  //LA FUNCION QUE LUEGO DE CREAR EL PRODUCTO NOS MANDA AL LINK DEL PRODUCTO PARA PAGAR
  const handlePagarOrden = async () => {
    try {
      await createProducto(ordenes[0]?.total);
    } catch (error) {
      /* console.log(error); */
      console.log("Error");
    }
  };

  //FUNCION QUE CREA EL PRODUCTO EN RECURRENTE ENVIANDO EL TOTAL DEL PEDIDO DE LA MESA
  const createProducto = async (total) => {
    try {
      const url = "https://app.recurrente.com/api/products";

      const producto = {
        product: {
          name: "Pago Comida",
          description: "Por consumo de alimentos",
          cancel_url: "http://localhost:3000/caja",
          success_url: "http://localhost:3000/recurrenteExitoso",
          custom_payment_method_settings: "true",
          card_payments_enabled: "true",
          bank_transfer_payments_enabled: "true",
          available_installments: [],
          prices_attributes: [
            {
              amount_as_decimal: `${total}`,
              currency: "GTQ",
              charge_type: "one_time",
            },
          ],
        },
      };

      const response = await axios.post(url, producto, {
        headers: {
          "X-PUBLIC-KEY": process.env.SECRETPUBLIC,
          "X-SECRET-KEY": process.env.SECRETKEY,
        },
      });

      await pagarOrden(response.data.id);
    } catch (error) {
      /* console.log(error); */
      console.log("Error");
    }
  };

  //AGARRA EL ID DE RECURRENTE DEL PRODUCTO QUE CREAMOS Y NOS REDIRIJE A ESE LINK
  const pagarOrden = async (id) => {
    try {
      const url = "https://app.recurrente.com/api/checkouts";

      const producto = {
        items: [{ price_id: id }],
      };

      /* console.log(producto); */
      const response = await axios.post(url, producto, {
        headers: {
          "X-PUBLIC-KEY": process.env.SECRETPUBLIC,
          "X-SECRET-KEY": process.env.SECRETKEY,
        },
      });

      window.open(response.data.checkout_url, "_blank");
    } catch (error) {
      /* console.log(error); */
      console.log("Error");
      
    }
  };

  //EJECUTA LA FUNCION GET MESAS
  useEffect(() => {
    getMesas();
    // 5
    getIdUsuario();
  }, []);

  //CAMBIA EL ESTADO DE LA MESA A FALSE PARA QUE ESTÉ DISPONIBLE DE NUEVO
  const completarMesa = async (id) => {
    //Funcion que usamos en el boton para actualizar el estado del pedido
    try {
      // Mostrar una alerta de confirmación con SweetAlert2
      const result = await Swal.fire({
        title: "¿Completar Mesa?",
        text: "¿Estás seguro de que deseas completar esta mesa?",
        icon: "question",
        showDenyButton: true,
        confirmButtonText: "Sí, completar",
        cancelButtonText: "Cancelar",
        denyButtonText: "No completar",
      });

      if (result.isConfirmed) {
        // Realizar la acción para completar la orden
        const data = await axios.post(`/api/completarpedido/${id}`);
        //toast.success('Orden Lista')
        Swal.fire("Mesa Disponible", "", "success");
        await getMesas();
        setShowModal(false);
      } else if (result.isDenied) {
        Swal.fire("La mesa aún sigue ocupada", "", "info");
      }
    } catch (error) {
      /* console.log(error); */
      toast.error("Hubo un error");
    }
  };

  const imprimirTotal = () => {
  
    // Crear un nuevo documento PDF
    const pdf = new jsPDF({
      unit: "in",
      format: [3, Infinity],
    });
  
    // Agregar la imagen
    const imgData = "/assets/img/logomilo.jpeg"; // Reemplaza esto con la ruta de tu imagen
    pdf.addImage(imgData, "JPEG", 0.1, 0.1, 2.7, 0.8);
  
    // Agregar el contenido al PDF
    pdf.setFontSize(10);
    pdf.text("Parrillada Don Milo", 1.5, 0.9, { align: "center" });
    pdf.text(`Orden: ${ordenes[0]?.id}`, 0.1, 1.1);
    pdf.text(`No. Mesa: ${ordenes[0]?.mesa_id}`, 0.1, 1.3);
    pdf.text(`Mesero: ${ordenes[0]?.nombre}`, 0.1, 1.5);
    pdf.text(`Fecha: ${ordenes[0]?.fecha}`, 0.1, 1.7);
  
    // Línea divisoria
    pdf.setLineWidth(0.01);
    pdf.line(0.1, 1.8, 2.9, 1.8);
  
    // Encabezado de la sección de productos
    pdf.text("Cant", 0.1, 1.9);
    pdf.text("Descripción", 0.5, 1.9);
    pdf.text("P.Unit", 2.1, 1.9, { align: "right" });
    pdf.text("Subtotal", 2.8, 1.9, { align: "right" });
  
    // Línea divisoria
    pdf.setLineWidth(0.01);
    pdf.line(0.1, 2, 2.9, 2);
  
    // Detalles de los productos
    let yPosition = 2.1;
    ordenes[0]?.pedido?.forEach((producto) => {
      const subtotal = producto.cantidad * producto.precio;
  
      pdf.text(` ${producto.cantidad}`, 0.1, yPosition);
      pdf.text(` ${producto.nombre.substring(0, 20)}`, 0.4, yPosition);
      pdf.text(` Q${producto.precio}`, 2.2, yPosition, { align: "right" });
      pdf.text(` Q${subtotal}`, 2.8, yPosition, { align: "right" });
  
      yPosition += 0.2;
    });
  
    // Línea divisoria
    pdf.setLineWidth(0.01);
    pdf.line(0.1, yPosition, 2.9, yPosition);
  
    // Total de productos
    const totalProductos = ordenes[0]?.pedido?.reduce(
      (total, producto) => total + producto.cantidad,
      0
    );
  
    pdf.text(`Total Productos: ${totalProductos}`, 0.1, yPosition + 0.2);
  
    // Total final
    pdf.text(`Total: Q${ordenes[0]?.total}`, 0.1, yPosition + 0.4);
  
    // Guardar o mostrar el PDF
    pdf.save("orden.pdf");
  };

  return (
    <CajaLayout pagina={"Caja"}>
      <h1 className="text-4xl font-black">Panel de Caja</h1>
      <p className="text-2xl my-10">Revisa las ordenes pendientes de pago</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {mesas.map((mesa) => (
          <div
            className="cursor-pointer"
            key={mesa.id}
            onClick={async () => {
              setShowModal(true);
              await getOrdenes(mesa.id);
            }}
          >
            {mesa.estado === false ? (
              <>
                <Image
                  width={300}
                  height={400}
                  alt={`Imagen producto ${mesa.nombre}`}
                  src="/assets/img/mesa_libre1.png"
                />
                <p className="text- font-bold uppercase text-center">
                  Disponible
                </p>
              </>
            ) : (
              <>
                <Image
                  width={300}
                  height={400}
                  alt={`Imagen producto ${mesa.nombre}`}
                  src="/assets/img/mesa_ocupada1.png"
                />
                <p className="font-bold uppercase text-center">Ocupada</p>
              </>
            )}
            <p className="text-center text-xl">{mesa?.nombre}</p>
          </div>
        ))}
      </div>
      <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
        {ordenes.length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-600">
              No hay Órdenes Asociadas a esta mesa
            </p>
          </div>
        ) : (
          <div className="p-4 overflow-y-auto max-h-96" ref={modalRef}>
            <h3 className="text-3xl font-semibold text-amber-600">
              Órden: {ordenes[0]?.id}
            </h3>
            <p className="text-lg font-bold text-gray-700">
              No. Mesa {ordenes[0]?.mesa_id}
            </p>
            <p className="text-lg font-bold text-gray-700">
              Mesero: {ordenes[0]?.nombre}
            </p>
            <p className="text-lg font-bold text-gray-700">
              Fecha: {ordenes[0]?.fecha}
            </p>

            <div className="mt-6">
              {ordenes[0]?.pedido?.map((pedido) => (
                <div key={pedido.id} className="flex items-center mb-3">
                  <img
                    className="w-16 h-10 object-cover rounded-lg"
                    src={`/assets/img/${pedido.imagen}.jpeg`}
                    alt={`Imagen Platillo ${pedido.nombre}`}
                  />
                  <div className="ml-4">
                    <p className="text-xl font-bold text-amber-500">
                      {pedido?.nombre}
                    </p>
                    <p className="text-lg font-bold text-amber-600">
                      Cantidad: {pedido.cantidad}
                    </p>
                    <p className="text-lg font-bold text-amber-500">
                      Precio: {pedido.precio}
                    </p>
                    <p className="text-lg font-bold text-amber-600">
                      Subtotal: {pedido.cantidad * pedido.precio}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-2xl font-semibold mt-6 text-right text-amber-600">
              Total: Q{ordenes[0]?.total}
            </p>

            <button
              onClick={handlePagarOrden}
              type="button"
              className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 focus:outline-none"
            >
              Pago tarjeta
            </button>
            {/*  <button
              onClick={() => router.push("/fel")}
              type="button"
              className="text-white bg-sky-700 hover:bg-sky-800 focus:ring-4 focus:ring-sky-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 focus:outline-none"
            >
              Generar FEL
            </button> */}

            <button
              onClick={() => completarMesa(ordenes[0].id)}
              type="button"
              className="text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 focus:outline-none"
            >
              Completar Mesa
            </button>
            <button className="px-5 py-2.5 mr-2 mb-2" onClick={imprimirTotal}>
              <Image
                width={100}
                height={50}
                src="/assets/img/imprimir.png"
                alt="Imagen Impresora"
                className="mx-auto"
              />
              {/* <span className="font-black">Imprimir</span> */}
            </button>
          </div>
        )}
      </Modal>
    </CajaLayout>
  );
}
