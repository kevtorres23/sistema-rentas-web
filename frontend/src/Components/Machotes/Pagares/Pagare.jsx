import { Page, Document, Text, View, Image } from '@react-pdf/renderer';
import { numeroEscrito } from '../../../Utils/numero-escrito';
import { divisorPaginasPagares } from '../../../Utils/divisor-paginas-pdf';
import estilos from './PagareStyles';
import { format, lastDayOfMonth } from "date-fns";
import { es } from "date-fns/locale";

/**
 * Esta función crea un documento PDF con una lista de pagarés en base a la duración del contrato.
 * 
 * Por ejemplo, genera **doce** pagarés en un documento cuando el contrato es a un año.
 * @param informacion Representa el objeto que contiene toda la información necesaria para crear los pagarés.
 * @returns Un documento PDF conteniendo todos los pagarés, en base a la duración del contrato.
 */

export function DocumentoPagare(informacion) {
    let contadorPagares = 0;

    let infoPagare = {
        fecha: new Date(2026, 2, 31),
        valor: 4000,
        receptor: "Betzai Cháidez Lechuga",
        mesesDuracion: 8,
        calle: "Zarco",
        numeroExt: "102",
        colonia: "Zona Centro",
        ciudad: "Durango, Durango",
        nombreSuscriptor: "Puin Almario Juan Sebastián",
        direccionSuscriptor: "Dirección Suscriptor",
        telSuscriptor: "6181889026",
        nombreAval: "Kevin Torres Urbina",
        direccionAval: "Dirección Aval",
        telAval: "6181889026"
    };

    const fechaConFormato = format(infoPagare.fecha, "dd-MM-yyyy");
    let pagaresRestantes = infoPagare.mesesDuracion; // Inicializamos los pagarés restantes con la duración en meses del contrato.
    let pagaresEnHoja; // Indica el número de pagarés que debe contener la hoja de la iteración actual.
    let añoPagareActual; // Indica el año de la fecha a pagar del pagaré de la iteración actual.
    let fechaEscrita;
    let contadorMeses = infoPagare.fecha.getMonth() - 1; // Inicializamos el contador con el mes de la fecha en la que se emiten los pagarés.
    let totalPaginas = divisorPaginasPagares(infoPagare.mesesDuracion);

    const FullDocument = () => (
        <Document>

            {/* Obtenemos el número de páginas del PDF con la función 'divisorPaginasPagares', pasándole los meses que durará del contrato. */}
            {[...Array(totalPaginas)].map((pagina, id) => {
                if (id === 0) {
                    pagaresRestantes = pagaresRestantes;
                } else {
                    pagaresRestantes -= 3;
                };

                if (pagaresRestantes < 3) {
                    pagaresEnHoja = pagaresRestantes;
                } else {
                    pagaresEnHoja = 3;
                };

                return (
                    <Page key={id} size={'A4'} style={estilos.hoja}>
                        {/* Por cada hoja del PDF, debe haber al menos tres recuadros de pagarés. */}

                        {[...Array(pagaresEnHoja)].map((pagare, id) => {

                            contadorMeses += 1;
                            contadorPagares += 1;

                            // Revisar si el pagaré actual no es del siguiente año.
                            if (contadorMeses === 13) {
                                añoPagareActual = infoPagare.fecha.getFullYear() + 1;
                                contadorMeses = 1;
                                // Si lo es, incrementamos por uno el año de la fecha inicial.
                            } else {
                                añoPagareActual = infoPagare.fecha.getFullYear();
                            };

                            const ultimoDiaMes = lastDayOfMonth(new Date(añoPagareActual, contadorMeses, 5));

                            // Generamos la fecha escrita a incluirse en el cuerpo del pagaré, en base al mes actual del mismo.
                            fechaEscrita = format(new Date(añoPagareActual, contadorMeses, ultimoDiaMes.getDate()), "PPP", { locale: es });

                            return (
                                <View key={id} style={estilos.contenedorPagare}>
                                    <View style={estilos.encabezado}>
                                        <Text style={estilos.textoChicoGrueso}>PAGARÉ</Text>

                                        <View style={estilos.enumerador}>
                                            <Text style={estilos.textoChico}>No.</Text>

                                            <View style={estilos.cuadroEnumerador}>
                                                <Text style={estilos.textoChicoGrueso}>
                                                    {contadorPagares}
                                                </Text>
                                            </View>

                                            <Text style={estilos.textoChico}>de</Text>

                                            <View style={estilos.cuadroEnumerador}>
                                                <Text style={estilos.textoChicoGrueso}>
                                                    {infoPagare.mesesDuracion}
                                                </Text>
                                            </View>
                                        </View>

                                        <View style={estilos.valorPagare}>
                                            <Text style={estilos.textoChico}>BUENO POR:</Text>
                                            <Text style={estilos.textoChicoGrueso}>${infoPagare.valor}</Text>
                                        </View>
                                    </View>

                                    <View style={estilos.fecha}>
                                        <Text style={estilos.textoChicoDerecha}>
                                            En la ciudad de Durango, Dgo., a {fechaConFormato}
                                        </Text>
                                    </View>

                                    <View>
                                        <Text style={estilos.cuerpo}>
                                            Debe(mos) y pagare(mos) incondicionalmente por este Pagaré a la orden de:
                                            <Text style={estilos.textoChicoGrueso}> {infoPagare.receptor}</Text>,
                                            el día: <Text style={estilos.textoChicoGrueso}> {fechaEscrita}</Text>,
                                            C. {infoPagare.calle} #{infoPagare.numeroExt}, Col. {infoPagare.colonia}, {infoPagare.ciudad}.
                                            La cantidad de: <Text style={{ fontSize: 7, fontWeight: 600, textDecoration: "underline" }}>{numeroEscrito(infoPagare.valor)} pesos 00/100 MXN</Text>,
                                            valor recibido a mi (nuestra) entera satisfacción. Este Pagaré forma parte de una serie numerada del
                                            <Text style={estilos.textoChicoGrueso}> {contadorPagares}</Text> al <Text style={estilos.textoChicoGrueso}>{infoPagare.mesesDuracion} </Text>
                                            y todos están sujetos a la condición de que, al no pagarse, cualquiera de ellos a su vencimiento,
                                            serán exigibles todos los que le siguen en su número, además de los ya vencidos, desde la fecha de vencimiento de este documento hasta el día de su liquidación,
                                            causarán intereses moratorios al tipo de <Text style={estilos.textoChicoGrueso}>3.5 (tres y medio) % mensual</Text>, pagadero
                                            en esta ciudad juntamente con el principal, más los gastos que por ello se originen.
                                        </Text>
                                    </View>

                                    <View style={estilos.parteInferior}>
                                        <View style={estilos.datosPersonas}>
                                            <View style={estilos.contenedorDatos}>
                                                <Text style={estilos.textoChicoGrueso}>SUSCRIPTOR</Text>
                                                <View style={{ display: "flex", flexDirection: "row", gap: 2 }}>
                                                    <Text style={estilos.textoChicoGrueso}>Nombre:</Text>
                                                    <Text style={estilos.textoChico}>{infoPagare.nombreSuscriptor.toUpperCase()}</Text>
                                                </View>

                                                <View style={{ display: "flex", flexDirection: "row", gap: 2 }}>
                                                    <Text style={estilos.textoChicoGrueso}>Dirección:</Text>
                                                    <Text style={estilos.textoChico}>{infoPagare.direccionSuscriptor}</Text>
                                                </View>

                                                <View style={{ display: "flex", flexDirection: "row", gap: 2 }}>
                                                    <Text style={estilos.textoChicoGrueso}>Teléfono:</Text>
                                                    <Text style={estilos.textoChico}>{infoPagare.telSuscriptor}</Text>
                                                </View>
                                            </View>

                                            <View style={estilos.contenedorDatos}>
                                                <Text style={estilos.textoChicoGrueso}>AVAL</Text>
                                                <View style={{ display: "flex", flexDirection: "row", gap: 2 }}>
                                                    <Text style={estilos.textoChicoGrueso}>Nombre:</Text>
                                                    <Text style={estilos.textoChico}>{infoPagare.nombreAval.toUpperCase()}</Text>
                                                </View>

                                                <View style={{ display: "flex", flexDirection: "row", gap: 2 }}>
                                                    <Text style={estilos.textoChicoGrueso}>Dirección:</Text>
                                                    <Text style={estilos.textoChico}>{infoPagare.direccionAval}</Text>
                                                </View>

                                                <View style={{ display: "flex", flexDirection: "row", gap: 2 }}>
                                                    <Text style={estilos.textoChicoGrueso}>Teléfono:</Text>
                                                    <Text style={estilos.textoChico}>{infoPagare.telAval}</Text>
                                                </View>
                                            </View>
                                        </View>

                                        <View style={estilos.firmas}>
                                            <View style={estilos.espacioFirma}>
                                                <View style={estilos.contenedorFirma}>
                                                    <Image>
                                                        {/* Incluir aquí la firma del suscriptor */}
                                                    </Image>
                                                </View>

                                                <Text style={estilos.textoChico}>
                                                    {infoPagare.nombreSuscriptor.toUpperCase()}
                                                </Text>
                                            </View>

                                            <View style={estilos.espacioFirma}>
                                                <View style={estilos.contenedorFirma}>
                                                    <Image>
                                                        {/* Incluir aquí la firma del aval */}
                                                    </Image>
                                                </View>

                                                <Text style={estilos.textoChico}>
                                                    {infoPagare.nombreAval.toUpperCase()}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            )
                        })}
                    </Page>
                );
            })};
        </Document>
    );

    return (
        <FullDocument />
    )
};