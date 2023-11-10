//Este componenete es llamado para mostrarse en cocina
import React from "react";
import { useReactToPrint } from "react-to-print";
import Image from "next/image"; //Importamos las imagenes para poder verlas en el panel de cocina
import axios from "axios"; // se utiliza para realizar solicitudes HTTP (por ejemplo, solicitudes GET, POST, PUT, DELETE, etc.) desde el lado del cliente
import { toast } from "react-toastify"; //Para usar las alertas toastify
import Swal from "sweetalert2"; //Importamos los sweet alert
import { formatearDinero } from "../helpers"; //Para mostrar el total en Quetzales
import jsPDF from "jspdf";
import "jspdf-autotable";

export default function Orden({ orden }) {
  const { id, nombre, descripcion, total, pedido, fecha, mesa } = orden; //Declaramos los valores que queremos mostrar
  const componentRef = React.useRef(); //Para declarar la informacion a imprimir

  const completarOrden = async () => {
    //Funcion que usamos en el boton para actualizar el estado del pedido
    try {
      // Mostrar una alerta de confirmación con SweetAlert2
      const result = await Swal.fire({
        title: "¿Completar orden?",
        text: "¿Estás seguro de que deseas completar esta orden?",
        icon: "question",
        showDenyButton: true,
        confirmButtonText: "Sí, completar",
        cancelButtonText: "Cancelar",
        denyButtonText: "No completar",
      });

      if (result.isConfirmed) {
        // Realizar la acción para completar la orden
        const data = await axios.post(`/api/ordenes/${id}`);
        //toast.success('Orden Lista')
        Swal.fire("Orden Lista", "", "success");
      } else if (result.isDenied) {
        Swal.fire("La orden no ha sido completada", "", "info");
      }
    } catch (error) {
      toast.error("Hubo un error");
    }
  };

  const imprimirOrden = useReactToPrint({
    content: () => componentRef.current,
  });

  // Nueva función para obtener la información deseada
  function obtenerInformacionOrden(orden) {
    const { id, nombre, fecha, mesa, pedido, descripcion } = orden;
    const detallesPedido = pedido.map((platillo) => ({
      cantidad: platillo.cantidad,
      nombrePlatillo: platillo.nombre,
    }));

    return {
      id,
      nombreMesero: nombre,
      fecha,
      nombreMesa: mesa.nombre,
      detallesPedido,
      descripcion,
    };
  }

  // Función para obtener la información y generar PDF
  const generarPDF = () => {
    const informacion = obtenerInformacionOrden(orden);

    // Crear un nuevo documento PDF
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "in",
      format: [3, Infinity], // Establecer una altura infinita
    });

    // Establecer el tamaño de fuente deseado
    pdf.setFontSize(10);

    // Agregar el título "Parrillada Don Milo" centrado y con negrita
    const titleText = "Parrillada Don Milo";
    const titleFontSize = 14; // Ajusta el tamaño de fuente según tus necesidades

    // Obtener el ancho del texto para centrarlo
    const titleWidth =
      (pdf.getStringUnitWidth(titleText) * titleFontSize) /
      pdf.internal.scaleFactor;

    // Calcular la posición x centrada
    const centerX = (pdf.internal.pageSize.width - titleWidth) / 2;

    // Establecer la fuente en negrita
     pdf.setFont("bold");

    // Agregar el título centrado
    pdf.text(titleText, centerX, 0.1, { fontSize: titleFontSize });

    // Restaurar la fuente normal
    pdf.setFont("normal");

    // Agregar el contenido al PDF
    pdf.text("Información de la Orden", 0.1, 0.3);
    pdf.text(`Orden: ${informacion.id}`, 0.1, 0.5);
    pdf.text(`Fecha: ${informacion.fecha}`, 0.1, 0.7);
    pdf.text(`Mesero: ${informacion.nombreMesero}`, 0.1, 0.9);
    pdf.text(`Mesa: ${informacion.nombreMesa}`, 0.1, 1.1);

    // Agregar la tabla de detalles del pedido
    const headers = ["Cantidad", "Nombre del Platillo"];
    const detallesPedido = informacion.detallesPedido.map((platillo) => [
      platillo.cantidad,
      platillo.nombrePlatillo,
    ]);
    pdf.autoTable({
      startY: 1.5, // Ajusta la posición de inicio de la tabla
      head: [headers],
      body: detallesPedido,
      margin: { top: 0.5 }, // Reducir el margen superior
      theme: "grid",
      styles: {
        textColor: [0, 0, 0], // Color del texto en la tabla (negro)
        fillColor: [255, 255, 255], // Color de fondo de la tabla (blanco)
        lineWidth: 0.05,
      },
    });

    // Agregar la descripción
    pdf.text(
      `Descripción: ${informacion.descripcion}`,
      0.1,
      pdf.autoTable.previous.finalY + 0.2
    );

    // Guardar o mostrar el PDF
    pdf.save("informacion_orden.pdf");
  };

  return (
    <div className="border p-10 space-y-5" ref={componentRef}>
      <h3 className="text-2xl font-bold">Orden: {id} </h3>
      <p className="text-lg font-bold">No. {mesa.nombre}</p>
      <p className="text-lg font-bold">Mesero: {nombre}</p>
      <div
        className="p-5 space-y-2" //Para mostrar la fecha del pedido
      >
        <p className="text-lg font-bold">Fecha: {fecha}</p>
      </div>

      <div>
        {pedido.map(
          (
            platillo //Creamos la variable platillo para almacenar la descripcion de cada plato del pedido
          ) => (
            <div
              key={platillo.id}
              className="py-3 flex border-b last-of-type:border-0 items-center"
            >
              <div className="w-32">
                <Image
                  width={400} //Mostramos y damos tamaño a la imagen de cada orden
                  height={500}
                  src={`/assets/img/${platillo.imagen}.jpeg`}
                  alt={`Imagen Platillo ${platillo.nombre}`}
                />
              </div>

              <div className="p-5 space-y-2">
                <p className="text-lg font-bold">
                  Cantidad: {platillo.cantidad}
                </p>
                <h4 className="text-xl font-bold text-amber-500">
                  {
                    platillo.nombre //Aqui mostramos el nombre del platillo
                  }
                </h4>
              </div>

              {/* <div className="p-5 space-y-2"> 
                            <p className="text-xl font-bold text-amber-600">
                                Precio unitario: {formatearDinero(platillo.precio)}
                            </p>
                        </div> */}
            </div>
          )
        )}
      </div>

      <p className="text-lg font-bold">Descripcion: {descripcion}</p>

      <div className="md:flex md:items-center md:justify-between my-10">
        {/* <p className="mt-5 font-black text-4xl text-amber-600"> 
                    Total a Pagar: {formatearDinero(total)}
                </p> */}

        <button
          className="bg-yellow-600 hover:bg-yellow-800 text-white mt-5 md:mt-0 py-2 px-6 uppercase font-bold rounded-lg text-sm mb-2 md:mb-0 md:mr-2 lg:mr-4"
          type="button"
          onClick={completarOrden}
        >
          Completar Orden
        </button>
        {/* <button
  className="bg-blue-600 hover:bg-blue-800 text-white mt-5 md:mt-0 py-2 px-6 uppercase font-bold rounded-lg text-sm mb-2 md:mb-0 md:mr-2 lg:mr-4"
  type="button"
  onClick={mostrarInformacion}
>
  Mostrar Información
</button> */}
        <button
          className="bg-blue-600 hover:bg-blue-800 text-white mt-5 md:mt-0 py-2 px-6 uppercase font-bold rounded-lg text-sm mb-2 md:mb-0 md:mr-2 lg:mr-4"
          type="button"
          onClick={generarPDF}
        >
          Generar PDF
        </button>
        <button
          className="bg-green-600 hover:bg-green-800 text-white mt-5 md:mt-0 py-2 px-6 uppercase font-bold rounded-lg text-sm"
          type="button"
          onClick={imprimirOrden}
        >
          Imprimir Orden
        </button>
      </div>
    </div>
  );
}
