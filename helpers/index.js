export const formatearDinero = (cantidad) => {
  return cantidad
    .toLocaleString("en-GT", {
      style: "currency",
      currency: "GTQ",
    })
    .substring(2); // Eliminar los dos carácteres "GT" que se añaden "GTQ"
};

export function formatDate(date) {
  const newDate = new Date(date);

  // Ajustar la zona horaria a Guatemala (UTC+6)
  newDate.setUTCHours(newDate.getUTCHours() + 6);

  const options = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  };

  const formattedDate = newDate.toLocaleString("es-ES", options);

  return formattedDate;
}
