import { Page, Document, Text, View } from '@react-pdf/renderer';
import { numeroEscrito } from '../../../Utils/numero-escrito';
import estilos from './PagareStyles';
import { format } from "date-fns";
import { es } from "date-fns/locale";

/**
 * Esta función crea un documento PDF con una lista de pagarés en base a la duración del contrato.
 * 
 * Por ejemplo, genera **doce** pagarés en un documento cuando el contrato es a un año.
 * @param informacion Representa el objeto que contiene toda la información necesaria para crear los pagarés.
 * @returns Un documento PDF conteniendo todos los pagarés, en base a la duración del contrato.
 */

export function DocumentoPagare(informacion) {
    let contadorPagares = 1;
    const totalPagares = 10;

    let infoPagare = {
        fecha: new Date(2026, 2, 31),
        valor: 4000,
        receptor: "Betzai Cháidez Lechuga",
        mesInicio: 3,
        calle: "Zarco",
        numeroExt: "102",
        colonia: "Zona Centro",
        ciudad: "Durango, Durango",
    };

    const fechaConFormato = format(infoPagare.fecha, "dd-MM-yyyy");
    const fechaEscrita = format(infoPagare.fecha, "PPP", { locale: es });

    const FullDocument = () => (
        <Document>
            <Page size={'A4'} style={estilos.hoja}>
                <View style={estilos.contenedorPagare}>
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
                                    {totalPagares}
                                </Text>
                            </View>
                        </View>

                        <View style={estilos.valorPagare}>
                            <Text style={estilos.textoChico}>BUENO POR:</Text>
                            <Text style={estilos.textoChicoGrueso}>$ {infoPagare.valor}</Text>
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
                            La cantidad de: {numeroEscrito(infoPagare.valor)}
                        </Text>
                    </View>
                </View>
            </Page>
        </Document>
    );

    return (
        <FullDocument />
    )
};